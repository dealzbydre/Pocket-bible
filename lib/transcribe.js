// Universal video → text.
//
// Strategy (portable: works locally and on any Node server):
//   1. If the platform hands out captions for free (YouTube), read those —
//      instant and costs nothing.
//   2. Otherwise (Instagram, TikTok, Facebook, X/Twitter, or a YouTube video
//      with captions disabled), download the audio with yt-dlp and run it
//      through OpenAI Whisper speech-to-text.
//
// Requirements on the host running this:
//   - yt-dlp        (pip install -U yt-dlp)      — downloads audio from ~all platforms
//   - ffmpeg        (system package)             — extracts/compresses the audio
//   - OPENAI_API_KEY                             — Whisper speech-to-text
//
// Binary paths can be overridden with YTDLP_PATH / FFMPEG_PATH.

import { spawn } from "child_process";
import { randomUUID } from "crypto";
import { readFile, unlink, stat } from "fs/promises";
import os from "os";
import path from "path";

const YTDLP = process.env.YTDLP_PATH || "yt-dlp";
const WHISPER_MODEL = "whisper-1";
const WHISPER_MAX_BYTES = 25 * 1024 * 1024; // OpenAI's hard limit per request

const YT_HOSTS = ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "music.youtube.com"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function formatTimestamp(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function platformLabel(url) {
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "the link";
  }
  if (YT_HOSTS.some((h) => host === h || host === h.replace(/^www\./, ""))) return "YouTube";
  if (host.includes("tiktok")) return "TikTok";
  if (host.includes("instagram")) return "Instagram";
  if (host.includes("facebook") || host === "fb.watch") return "Facebook";
  if (host.includes("twitter") || host === "x.com") return "X (Twitter)";
  return host;
}

function isHttpUrl(str) {
  try {
    const u = new URL(str.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function isYouTube(url) {
  try {
    return YT_HOSTS.includes(new URL(url).hostname);
  } catch {
    return false;
  }
}

// Run a binary, resolving with stdout. Rejects with a tagged error on failure
// so callers can tell "binary missing" apart from "the binary ran but failed".
function run(bin, args, { timeoutMs = 180000 } = {}) {
  return new Promise((resolve, reject) => {
    let child;
    try {
      child = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    } catch (err) {
      const e = new Error(`Failed to start ${bin}: ${err.message}`);
      e.code = err.code;
      return reject(e);
    }
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`${bin} timed out`));
    }, timeoutMs);

    child.on("error", (err) => {
      clearTimeout(timer);
      const e = new Error(err.message);
      e.code = err.code; // ENOENT when the binary isn't installed
      reject(e);
    });
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("close", (codeNum) => {
      clearTimeout(timer);
      if (codeNum === 0) return resolve(stdout);
      const e = new Error(stderr.trim() || `${bin} exited with code ${codeNum}`);
      e.stderr = stderr;
      e.exitCode = codeNum;
      reject(e);
    });
  });
}

class MissingBinaryError extends Error {}
class UserFacingError extends Error {
  constructor(message, status = 422) {
    super(message);
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// Free path: YouTube caption track via the public InnerTube player endpoint
// ---------------------------------------------------------------------------

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

function youTubeId(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return /^[\w-]{11}$/.test(url.trim()) ? url.trim() : null;
  }
  if (u.hostname === "youtu.be") {
    const id = u.pathname.slice(1).split("/")[0];
    return /^[\w-]{11}$/.test(id) ? id : null;
  }
  const v = u.searchParams.get("v");
  if (v && /^[\w-]{11}$/.test(v)) return v;
  const m = u.pathname.match(/^\/(shorts|embed|live|v)\/([\w-]{11})/);
  return m ? m[2] : null;
}

function pickCaptionTrack(tracks) {
  if (!tracks?.length) return null;
  const manual = tracks.filter((t) => t.kind !== "asr");
  const pool = manual.length ? manual : tracks;
  return pool.find((t) => t.languageCode?.startsWith("en")) || pool[0];
}

async function tryYouTubeCaptions(videoId) {
  let player = null;
  let track = null;
  for (const cfg of INNERTUBE_CLIENTS) {
    try {
      const res = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": cfg.userAgent },
        body: JSON.stringify({ context: { client: cfg.client }, videoId }),
      });
      if (!res.ok) continue;
      const candidate = await res.json();
      player = player || candidate;
      if (candidate.playabilityStatus?.status !== "OK") continue;
      const picked = pickCaptionTrack(
        candidate.captions?.playerCaptionsTracklistRenderer?.captionTracks
      );
      if (picked?.baseUrl) {
        player = candidate;
        track = picked;
        break;
      }
    } catch {
      // try next client
    }
  }

  if (!track?.baseUrl) return null;

  const capRes = await fetch(`${track.baseUrl}&fmt=json3`);
  if (!capRes.ok) return null;
  const capData = await capRes.json();

  const segments = [];
  for (const event of capData.events || []) {
    if (!event.segs) continue;
    const text = event.segs.map((s) => s.utf8 || "").join("").replace(/\s+/g, " ").trim();
    if (!text) continue;
    segments.push({ start: formatTimestamp((event.tStartMs || 0) / 1000), text });
  }
  if (!segments.length) return null;

  const details = player.videoDetails || {};
  return {
    title: details.title || "Untitled video",
    author: details.author || null,
    durationSeconds: Number(details.lengthSeconds) || null,
    language: track.name?.simpleText || track.languageCode || null,
    source: "captions",
    autoGenerated: track.kind === "asr",
    segments,
    transcript: segments.map((s) => s.text).join(" "),
  };
}

// ---------------------------------------------------------------------------
// Universal path: yt-dlp downloads audio → OpenAI Whisper transcribes it
// ---------------------------------------------------------------------------

async function fetchMetadata(url) {
  try {
    const out = await run(YTDLP, ["-J", "--no-warnings", "--no-playlist", url], { timeoutMs: 60000 });
    const json = JSON.parse(out);
    return {
      title: json.title || json.fulltitle || "Untitled video",
      author: json.uploader || json.channel || json.uploader_id || null,
      durationSeconds: json.duration || null,
    };
  } catch (err) {
    if (err.code === "ENOENT") throw new MissingBinaryError("yt-dlp");
    return null; // metadata is best-effort; keep going even if it fails
  }
}

async function downloadAudio(url) {
  const base = path.join(os.tmpdir(), `pb-${randomUUID()}`);
  const outTemplate = `${base}.%(ext)s`;
  const args = [
    "-f", "bestaudio/best",
    "-x", "--audio-format", "mp3",
    "--no-playlist", "--no-warnings",
    // Mono 16 kHz at 48 kbps: what Whisper listens at anyway, keeps files small
    "--postprocessor-args", "ffmpeg:-ac 1 -ar 16000 -b:a 48k",
    "-o", outTemplate,
    url,
  ];
  if (process.env.FFMPEG_PATH) {
    args.unshift("--ffmpeg-location", process.env.FFMPEG_PATH);
  }

  try {
    await run(YTDLP, args, { timeoutMs: 300000 });
  } catch (err) {
    if (err.code === "ENOENT") throw new MissingBinaryError("yt-dlp");
    const msg = (err.stderr || err.message || "").toLowerCase();
    if (msg.includes("ffmpeg") || msg.includes("ffprobe")) throw new MissingBinaryError("ffmpeg");
    if (msg.includes("login") || msg.includes("private") || msg.includes("not available") || msg.includes("sign in")) {
      throw new UserFacingError(
        "This video couldn't be downloaded — it may be private, age-restricted, or require login on that platform."
      );
    }
    throw new UserFacingError(
      "Couldn't download this video. Double-check the link is public and points directly to a video."
    );
  }

  const filePath = `${base}.mp3`;
  const { size } = await stat(filePath);
  if (size > WHISPER_MAX_BYTES) {
    await unlink(filePath).catch(() => {});
    throw new UserFacingError(
      "This video's audio is too long for a single transcription pass (over ~70 minutes). Try a shorter clip.",
      413
    );
  }
  return filePath;
}

async function transcribeWithWhisper(filePath, apiKey) {
  const buffer = await readFile(filePath);
  const form = new FormData();
  form.append("file", new Blob([buffer], { type: "audio/mpeg" }), "audio.mp3");
  form.append("model", WHISPER_MODEL);
  form.append("response_format", "verbose_json");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new UserFacingError(
      `Speech-to-text failed: ${data.error?.message || "unknown error"}`,
      res.status === 401 ? 500 : 502
    );
  }

  const segments = (data.segments || [])
    .map((s) => ({ start: formatTimestamp(s.start || 0), text: (s.text || "").trim() }))
    .filter((s) => s.text);

  return {
    language: data.language || null,
    segments,
    transcript: (data.text || segments.map((s) => s.text).join(" ")).trim(),
  };
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export async function transcribeFromUrl(rawUrl) {
  const url = (rawUrl || "").trim();
  const platform = platformLabel(url);

  // Accept a bare 11-char YouTube ID as a convenience
  if (!isHttpUrl(url) && !/^[\w-]{11}$/.test(url)) {
    throw new UserFacingError("That doesn't look like a valid video link. Paste the full URL.", 400);
  }

  // 1) Free captions for YouTube
  if (isYouTube(url) || /^[\w-]{11}$/.test(url)) {
    const id = youTubeId(url);
    if (id) {
      try {
        const captioned = await tryYouTubeCaptions(id);
        if (captioned) return { platform: "YouTube", ...captioned };
      } catch {
        // fall through to the audio path
      }
    }
  }

  // 2) Universal audio → Whisper for everything else (and captionless YouTube)
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new UserFacingError(
      `${platform} videos don't provide caption files, so this needs speech-to-text — but OPENAI_API_KEY isn't set on the server.`,
      500
    );
  }

  const meta = await fetchMetadata(url); // may throw MissingBinaryError(yt-dlp)
  let audioPath;
  try {
    audioPath = await downloadAudio(url);
    const result = await transcribeWithWhisper(audioPath, apiKey);
    return {
      platform,
      title: meta?.title || `${platform} video`,
      author: meta?.author || null,
      durationSeconds: meta?.durationSeconds || null,
      language: result.language,
      source: "speech-to-text",
      autoGenerated: true,
      segments: result.segments,
      transcript: result.transcript,
    };
  } finally {
    if (audioPath) await unlink(audioPath).catch(() => {});
  }
}

export { MissingBinaryError, UserFacingError };
