# Pocket Bible — bundles the app together with yt-dlp + ffmpeg so the video
# transcriber's speech-to-text path works out of the box.
#
#   docker build -t pocket-bible .
#   docker run -p 3000:3000 --env-file .env.local pocket-bible
#
# Requires OPENAI_API_KEY (Whisper) and ANTHROPIC_API_KEY (verse lookup) in
# the env file. Open http://localhost:3000

# ---- Build stage -----------------------------------------------------------
FROM node:20-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Runtime stage ---------------------------------------------------------
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# System tools the transcriber shells out to:
#   ffmpeg   — extract/compress audio
#   yt-dlp   — download audio from YouTube / TikTok / Instagram / Facebook / X
#              (standalone binary, bundles its own Python — no pip needed)
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg ca-certificates curl \
  && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
       -o /usr/local/bin/yt-dlp \
  && chmod a+rx /usr/local/bin/yt-dlp \
  && apt-get purge -y curl \
  && apt-get autoremove -y \
  && rm -rf /var/lib/apt/lists/*

# Next.js standalone output: server + only the deps it actually needs.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
