import { YoutubeTranscript } from "youtube-transcript";

const SYSTEM_PROMPT = `You are a Biblical content analyzer. Given a video transcript, you will:
1. Clean up the transcript (fix grammar, remove filler words, add proper punctuation and paragraph breaks)
2. Identify any Bible verses or scripture references mentioned (book, chapter, verse)
3. Identify the main spiritual/biblical themes discussed
4. Provide a brief summary (2-3 sentences)

Return ONLY valid JSON — no markdown, no backticks, no extra text.
JSON format:
{
  "cleanedTranscript": "The cleaned, formatted transcript text with proper paragraphs",
  "bibleReferences": [
    { "reference": "John 3:16", "context": "brief context about why it was mentioned" }
  ],
  "themes": ["theme1", "theme2"],
  "summary": "Brief 2-3 sentence summary of the content"
}
If no Bible references are found, return an empty array for bibleReferences.`;

function detectPlatform(url) {
  try {
    const host = new URL(url).hostname.replace("www.", "");
    if (host === "youtube.com" || host === "youtu.be" || host === "m.youtube.com") return "youtube";
    if (host === "tiktok.com") return "tiktok";
    if (host === "instagram.com") return "instagram";
    if (host === "twitter.com" || host === "x.com") return "twitter";
    if (host === "facebook.com" || host === "fb.watch") return "facebook";
    if (host === "twitch.tv") return "twitch";
    return "unknown";
  } catch {
    return "unknown";
  }
}

function extractYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^"&?\/\s]{11})/,
    /youtube\.com\/shorts\/([^"&?\/\s]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

const PLATFORM_NAMES = {
  tiktok: "TikTok",
  instagram: "Instagram",
  twitter: "X / Twitter",
  facebook: "Facebook",
  twitch: "Twitch",
};

async function analyzeWithClaude(rawText, apiKey) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Transcript to analyze:\n\n${rawText.slice(0, 12000)}` }],
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Claude API error");

  const raw = data.content?.find((b) => b.type === "text")?.text || "";
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "A social media video URL is required." });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured." });

  const platform = detectPlatform(url);

  if (platform !== "youtube") {
    const name = PLATFORM_NAMES[platform] || "this platform";
    return res.status(422).json({
      error: "unsupported_platform",
      platform,
      message:
        platform === "unknown"
          ? "That doesn't look like a recognized social media URL. Try a YouTube, TikTok, Instagram, X, or Facebook video link."
          : `Automatic transcript extraction for ${name} is coming soon. YouTube links with captions are fully supported right now.`,
    });
  }

  try {
    const videoId = extractYouTubeId(url);
    if (!videoId) {
      return res.status(422).json({ error: "Could not find a valid YouTube video ID in that link. Make sure the URL points to a specific video." });
    }

    const items = await YoutubeTranscript.fetchTranscript(videoId);
    if (!items || items.length === 0) {
      return res.status(422).json({ error: "No captions found for this video. The creator may not have captions enabled." });
    }

    const rawText = items.map((i) => i.text.trim()).join(" ");
    const analysis = await analyzeWithClaude(rawText, apiKey);

    return res.status(200).json({
      platform,
      videoId,
      rawText: rawText.slice(0, 20000),
      ...analysis,
    });
  } catch (err) {
    console.error(err);
    const msg = err.message || "";
    if (msg.includes("Could not find") || msg.includes("captions")) {
      return res.status(422).json({ error: msg });
    }
    return res.status(500).json({ error: "Transcription failed. Please try a different video." });
  }
}
