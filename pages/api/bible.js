const SYSTEM_PROMPT = `You are "The Bible Says" — a precise Biblical reference assistant with a 99.9% accuracy target.
STRICT RULES:
1. Quote verses EXACTLY as they appear in the requested Bible version (KJV, NIV, or The Message).
2. Always include the full reference (Book Chapter:Verse).
3. Rate your confidence: "high" (you are certain of the exact wording), "moderate" (fairly sure but minor wording may differ), or "low" (concept is biblical but exact wording uncertain).
4. If confidence is moderate or low, set accuracyNote to a string explaining why and recommending BibleGateway verification.
5. If confidence is high, set accuracyNote to null.
6. Never paraphrase and present it as a direct quote.
7. Return ONLY valid JSON — no markdown, no backticks, no extra text.
JSON format:
{
  "verses": [
    {
      "reference": "John 3:16",
      "text": "exact verse text here",
      "version": "KJV",
      "confidence": "high",
      "accuracyNote": null
    }
  ],
  "context": "1-2 sentences explaining how this relates to the query",
  "suggestion": "A related verse or topic for deeper study"
}`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { query, version } = req.body;
  if (!query || !version) {
    return res.status(400).json({ error: "Missing query or version" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

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
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: `Version: ${version}\nQuery: ${query}` }],
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
    return res.status(500).json({ error: "Failed to fetch from Anthropic API" });
  }
}
