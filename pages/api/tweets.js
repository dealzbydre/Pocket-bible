const SYSTEM_PROMPT = `You are "TweetForge" — an elite Twitter/X ghostwriter who has written for accounts with millions of followers.
WRITING RULES:
1. Every tweet must be under 280 characters. Count carefully.
2. Open with a strong hook — the first line decides if people stop scrolling.
3. Use short lines and line breaks for rhythm. No walls of text.
4. No hashtags, no emojis, unless the tone explicitly calls for humor/casual.
5. Write like a human: specific, punchy, conversational. Never sound like a press release.
6. Never fabricate statistics, quotes, or personal claims about real people.
7. Return ONLY valid JSON — no markdown, no backticks, no extra text.`;

const MODES = {
  generate: ({ topic, tone }) => ({
    prompt: `Write 4 distinct single tweets about: "${topic}"
Tone: ${tone || "Punchy"}.
Each tweet should take a different angle (e.g. bold claim, question, mini-story, practical tip).
JSON format: {"tweets":[{"text":"tweet text here","style":"short label for the angle"}]}`,
    maxTokens: 1500,
  }),
  thread: ({ topic, tone }) => ({
    prompt: `Write a Twitter/X thread of 6 to 8 tweets about: "${topic}"
Tone: ${tone || "Educational"}.
Tweet 1 must be a scroll-stopping hook. The last tweet wraps up with a takeaway or soft call to action. Number nothing — just the tweet texts.
JSON format: {"thread":["tweet 1 text","tweet 2 text"]}`,
    maxTokens: 2000,
  }),
  rewrite: ({ tweet }) => ({
    prompt: `Rewrite and improve this tweet. Keep the core idea but make it sharper, punchier, and more likely to get engagement. Give 3 versions with different angles.
Original tweet: "${tweet}"
JSON format: {"tweets":[{"text":"improved tweet","style":"what changed, 2-4 words"}]}`,
    maxTokens: 1200,
  }),
  library: ({ topic }) => ({
    prompt: `Write 6 tweets about "${topic}", each using a different proven viral format:
1. Listicle (numbered list of tips)
2. Hot take (contrarian opinion)
3. Personal story (relatable mini-narrative, first person, generic enough to inspire)
4. How-to (actionable steps)
5. One-liner (short, quotable)
6. Question (sparks replies)
JSON format: {"tweets":[{"text":"tweet text","format":"Listicle"}]}`,
    maxTokens: 2000,
  }),
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { mode, topic, tone, tweet } = req.body;
  const builder = MODES[mode];
  if (!builder) {
    return res.status(400).json({ error: "Invalid mode" });
  }
  if ((mode === "rewrite" && !tweet?.trim()) || (mode !== "rewrite" && !topic?.trim())) {
    return res.status(400).json({ error: "Missing topic or tweet" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  const { prompt, maxTokens } = builder({ topic, tone, tweet });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || "Anthropic API error" });
    }

    const raw = data.content?.find((b) => b.type === "text")?.text || "";
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    return res.status(200).json(parsed);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to generate tweets" });
  }
}
