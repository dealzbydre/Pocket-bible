export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { imageData, mediaType } = req.body;
  if (!imageData || !mediaType) {
    return res.status(400).json({ error: "Missing imageData or mediaType" });
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
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: imageData,
                },
              },
              {
                type: "text",
                text: `Extract ALL text visible in this image exactly as written, preserving line breaks, formatting, and structure.

Return a JSON object with this exact structure:
{
  "extractedText": "the full text content here with \\n for line breaks",
  "textBlocks": [
    { "label": "short label for this section", "content": "text content" }
  ],
  "summary": "1-2 sentence description of what this image/post is about",
  "platform": "detected social media platform or 'Unknown'"
}

Return ONLY valid JSON, no markdown, no backticks, no extra explanation.`,
              },
            ],
          },
        ],
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
    return res.status(500).json({ error: "Failed to extract text from image" });
  }
}
