# Pocket Bible

A small Next.js app with two tools, both powered by the Anthropic API:

- **The Bible Says** (`/`) — accurate Bible verse lookup across KJV, NIV, and The Message.
- **TweetForge** (`/tweet-hunter`) — a Tweet Hunter–style AI studio for Twitter/X:
  - ⚡ **AI Generator** — 4 tweet variations per topic across 6 tones, or full 6–8 tweet threads
  - ✨ **Improve with AI** — rewrite any tweet into 3 sharper versions
  - 🔥 **Viral Library** — 6 ready-to-edit tweets per topic in proven viral formats (listicle, hot take, story, how-to, one-liner, question)
  - 📅 **Queue** — auto-schedules into daily slots (9am / 1pm / 6pm), editable per tweet, one-click "Post on X"
  - 📝 **Drafts** — save anything to polish later (queue and drafts persist in your browser)

## Setup

```bash
cp .env.example .env.local   # add your Anthropic API key
npm install
npm run dev
```

Then open http://localhost:3000 (Bible) or http://localhost:3000/tweet-hunter (TweetForge).
