const SYSTEM_PROMPT = `You are "TweetForge" — an elite Twitter/X ghostwriter who has written for accounts with millions of followers.
WRITING RULES:
1. Every tweet must be under 280 characters. Count carefully.
2. Open with a strong hook — the first line decides if people stop scrolling.
3. Use short lines and line breaks for rhythm. No walls of text.
4. No hashtags, no emojis, unless the tone explicitly calls for humor/casual.
5. Write like a human: specific, punchy, conversational. Never sound like a press release.
6. Never fabricate statistics, quotes, or personal claims about real people.
7. Return ONLY valid JSON — no markdown, no backticks, no extra text.`;

// Voice guides built from the language patterns of each preaching style.
// These are style influences for the user's own tweets — never attribute
// quotes to any real person, and remix the themes into fresh lines rather
// than copying signature phrases verbatim.
const TONE_GUIDES = {
  "Pastor Bryant": `Voice guide — prophetic confrontation with cultural relevance. Movement, activism, momentum.
DNA themes to remix (never quote verbatim, write fresh lines in this spirit):
- Survival as qualification: you survived what was supposed to kill you; what you survived qualifies you
- Favor and warfare: favor makes people uncomfortable; the oil attracts warfare; the attack proves the assignment; if you're winning, you'll be tested
- Reversal: God makes enemies finance your future; the people who overlooked you will have to acknowledge you; God uses what embarrassed you
- Planted not buried; delay is not denial; your next season requires a different version of you
- Agency: you don't need permission to walk in purpose; you don't need another confirmation — you need another step; faith without movement is just inspiration
Sentence formulas: "The reason some of y'all…", "Can I push this a little further?", "Here's what the enemy didn't count on…", "I came to tell somebody…", "The devil made one mistake…"
Style: bold declarations, fast-paced momentum, current-events and everyday-culture hooks, memorable title-like openers, direct second-person address, always end on a charge to move.`,
  "Pastor Hannah": `Voice guide — prophetic healing through intimacy with God. Maturity, consecration, presence.
DNA themes to remix (never quote verbatim, write fresh lines in this spirit):
- Brokenness and glory: God is not intimidated by your brokenness; broken things still carry glory; the crushing produced the oil; God doesn't waste pain
- Prayer and the secret place: prayer is where your future is conceived; your secret place determines your public strength; prayer changes the person before it changes the problem; your tears are talking to heaven
- Process and formation: you cannot skip process and expect promise; some suffering is preparation; before God changes your situation, He changes you; stop asking God to remove what He sent to mature you
- Identity and heart: your identity is not your history; God is after your heart before your hand; what God wants FROM you is greater than what He wants FOR you; grace gives you another chance to become
Sentence formulas: "In essence…", "Can I help somebody?", "Hear me by the Holy Ghost…", "If I can get this in your spirit…", "The issue is not…", "God is not trying to…"
Style: deep emotional truth, metaphoric storytelling, presence-centered, slower and weightier than hype — prophetic comfort first, then internal transformation.`,
  "My Voice": `Voice guide — a blend: Bryant's relevance with Hannah's intimacy. Depth over cadence.
- Open with a memorable, title-like frame that connects to everyday life (Bryant's gift)
- Then go inward: spiritual formation, process, the secret place, what God is forming in the person (Hannah's depth)
- Prophetic exhortation, not hype: challenge the reader, but land on maturity and presence rather than momentum alone
- Themes: process before promise, formation over performance, God developing the person the next season requires, prayer as the engine of public strength
- Plain, warm, direct language a real person would text a friend — memorable but never gimmicky.`,
};

const toneLine = (tone) => {
  const guide = TONE_GUIDES[tone];
  return guide ? `Tone: ${tone}.\n${guide}` : `Tone: ${tone || "Punchy"}.`;
};

const MODES = {
  generate: ({ topic, tone }) => ({
    prompt: `Write 4 distinct single tweets about: "${topic}"
${toneLine(tone)}
Each tweet should take a different angle (e.g. bold claim, question, mini-story, practical tip).
JSON format: {"tweets":[{"text":"tweet text here","style":"short label for the angle"}]}`,
    maxTokens: 1500,
  }),
  thread: ({ topic, tone }) => ({
    prompt: `Write a Twitter/X thread of 6 to 8 tweets about: "${topic}"
${toneLine(tone || "Educational")}
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
