# Pocket Bible

A small Next.js app with two tools:

- **The Bible Says** (`/`) — ask a question or enter a reference and get exact
  verses in KJV, NIV, or The Message, with a confidence rating. Powered by the
  Anthropic API.
- **Video Transcriber** (`/transcribe`) — paste a link from **YouTube, TikTok,
  Instagram, Facebook, or X (Twitter)** and get the spoken words as text you can
  read, copy, download, or view with timestamps.

## How the transcriber works

- **YouTube** videos with a caption track are read directly — instant and free.
- **Everything else** (TikTok, Instagram, Facebook, X, or a YouTube video with
  captions turned off) is transcribed by downloading the audio and running it
  through **OpenAI Whisper** speech-to-text.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in your keys
npm run dev
```

### Environment variables

| Variable            | Needed for                                   |
| ------------------- | -------------------------------------------- |
| `ANTHROPIC_API_KEY` | The Bible Says verse lookup                  |
| `OPENAI_API_KEY`    | Speech-to-text transcription (Whisper)       |

### System dependencies (for the transcriber's speech-to-text path)

The universal transcription path shells out to two command-line tools, so they
must be installed on whatever machine runs the app:

- **yt-dlp** — downloads audio from the video platforms
  ```bash
  pip install -U yt-dlp
  ```
- **ffmpeg** — extracts and compresses the audio
  ```bash
  # macOS
  brew install ffmpeg
  # Debian / Ubuntu
  sudo apt install ffmpeg
  ```

If they aren't on your `PATH`, point to them with `YTDLP_PATH` / `FFMPEG_PATH`
in `.env.local`. YouTube-caption transcription works without either tool.

## Run with Docker (recommended — everything bundled)

The included `Dockerfile` bakes in `yt-dlp` and `ffmpeg`, so the speech-to-text
path works with no extra setup. You only supply the API keys.

```bash
# 1. put your keys in .env.local (see .env.example)
cp .env.example .env.local

# 2. build and run
docker build -t pocket-bible .
docker run -p 3000:3000 --env-file .env.local pocket-bible
```

Then open http://localhost:3000. This works on any machine or server with
Docker and normal internet access.

## Hosting notes

- **Your own server, a VM, or Docker** — recommended. `yt-dlp` and `ffmpeg` run
  normally, so all platforms work.
- **Vercel / other serverless** — serverless functions can't run the `yt-dlp`
  and `ffmpeg` binaries out of the box, so the speech-to-text path won't work
  there without extra setup (a custom runtime/layer, or routing audio through a
  hosted transcription service). YouTube-caption transcription still works.
