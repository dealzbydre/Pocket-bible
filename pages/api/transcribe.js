// Transcribes a video from a link by pulling its caption track (YouTube).
// No API key required — uses YouTube's public InnerTube player endpoint.

const YT_HOSTS = ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "music.youtube.com"];

function extractVideoId(input) {
  let url;
  try {
    url = new URL(input.trim());
  } catch {
    // Allow pasting a bare 11-char video ID
    return /^[\w-]{11}$/.test(input.trim()) ? input.trim() : null;
  }
  if (!YT_HOSTS.includes(url.hostname)) return null;
  if (url.hostname === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return /^[\w-]{11}$/.test(id) ? id : null;
  }
  const v = url.searchParams.get("v");
  if (v && /^[\w-]{11}$/.test(v)) return v;
  const m = url.pathname.match(/^\/(shorts|embed|live|v)\/([\w-]{11})/);
  return m ? m[2] : null;
}

const INNERTUBE_CLIENTS = [
  {
    userAgent: "com.google.android.youtube/20.10.38 (Linux; U; Android 11) gzip",
    client: { clientName: "ANDROID", clientVersion: "20.10.38", androidSdkVersion: 30, hl: "en" },
  },
  {
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    client: { clientName: "WEB", clientVersion: "2.20250101.00.00", hl: "en" },
  },
];

async function fetchPlayerData(videoId, { userAgent, client }) {
  const response = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": userAgent,
    },
    body: JSON.stringify({ context: { client }, videoId }),
  });
  if (!response.ok) throw new Error(`YouTube player request failed (${response.status})`);
  return response.json();
}

function pickCaptionTrack(tracks) {
  if (!tracks?.length) return null;
  // Prefer a manually-created track, then English, then whatever exists
  const manual = tracks.filter((t) => t.kind !== "asr");
  const pool = manual.length ? manual : tracks;
  return pool.find((t) => t.languageCode?.startsWith("en")) || pool[0];
}

function formatTimestamp(ms) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.body || {};
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Missing video link" });
  }

  const videoId = extractVideoId(url);
  if (!videoId) {
    return res.status(400).json({
      error: "Could not read a YouTube video ID from that link. Currently only YouTube links are supported (youtube.com or youtu.be).",
    });
  }

  try {
    // Try each InnerTube client until one returns a usable caption track
    let player = null;
    let track = null;
    for (const clientConfig of INNERTUBE_CLIENTS) {
      try {
        const candidate = await fetchPlayerData(videoId, clientConfig);
        player = player || candidate;
        if (candidate.playabilityStatus?.status !== "OK") continue;
        const tracks = candidate.captions?.playerCaptionsTracklistRenderer?.captionTracks;
        const picked = pickCaptionTrack(tracks);
        if (picked?.baseUrl) {
          player = candidate;
          track = picked;
          break;
        }
      } catch (clientErr) {
        console.error(`InnerTube ${clientConfig.client.clientName} client failed:`, clientErr.message);
      }
    }

    if (!player) throw new Error("All YouTube player requests failed");

    const status = player.playabilityStatus?.status;
    if (status && status !== "OK") {
      const reason = player.playabilityStatus?.reason || "This video is not accessible.";
      return res.status(422).json({ error: `Video unavailable: ${reason}` });
    }

    if (!track?.baseUrl) {
      return res.status(404).json({
        error: "No transcript is available for this video — it has no captions (auto-generated or manual).",
      });
    }

    const captionRes = await fetch(`${track.baseUrl}&fmt=json3`);
    if (!captionRes.ok) throw new Error(`Caption fetch failed (${captionRes.status})`);
    const captionData = await captionRes.json();

    const segments = [];
    for (const event of captionData.events || []) {
      if (!event.segs) continue;
      const text = event.segs.map((s) => s.utf8 || "").join("").replace(/\s+/g, " ").trim();
      if (!text) continue;
      segments.push({ start: formatTimestamp(event.tStartMs || 0), text });
    }

    if (!segments.length) {
      return res.status(404).json({ error: "The caption track for this video is empty." });
    }

    const details = player.videoDetails || {};
    return res.status(200).json({
      videoId,
      title: details.title || "Untitled video",
      author: details.author || null,
      durationSeconds: Number(details.lengthSeconds) || null,
      language: track.name?.simpleText || track.languageCode || null,
      autoGenerated: track.kind === "asr",
      transcript: segments.map((s) => s.text).join(" "),
      segments,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch the transcript. Please try again." });
  }
}
