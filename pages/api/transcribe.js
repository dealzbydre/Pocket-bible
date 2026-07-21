import { transcribeFromUrl, MissingBinaryError, UserFacingError } from "../../lib/transcribe";

// Give the download + speech-to-text room to finish (mostly relevant on hosts
// that enforce a function timeout, e.g. Vercel — a plain Node server ignores it).
export const config = { maxDuration: 300 };

const INSTALL_HINTS = {
  "yt-dlp": "The server is missing yt-dlp (the video downloader). Install it with: pip install -U yt-dlp",
  ffmpeg: "The server is missing ffmpeg (needed to extract audio). Install it from your system package manager, e.g. apt install ffmpeg or brew install ffmpeg.",
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.body || {};
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Missing video link" });
  }

  try {
    const result = await transcribeFromUrl(url);
    return res.status(200).json(result);
  } catch (err) {
    if (err instanceof MissingBinaryError) {
      console.error("Missing binary:", err.message);
      return res.status(500).json({ error: INSTALL_HINTS[err.message] || `Missing dependency: ${err.message}` });
    }
    if (err instanceof UserFacingError) {
      return res.status(err.status || 422).json({ error: err.message });
    }
    console.error("Transcription failed:", err);
    return res.status(500).json({ error: "Failed to transcribe the video. Please try again." });
  }
}
