import { useState, useEffect } from "react";

const TONES = ["Punchy", "Educational", "Contrarian", "Storytelling", "Funny", "Inspirational", "Pastor Bryant", "Pastor Hannah", "My Voice"];
const QUEUE_SLOTS = [9, 13, 18]; // preferred posting hours (local time)
const ACCENT = "#1d9bf0";

// ---------- helpers ----------

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function nextFreeSlot(queue) {
  const taken = new Set(queue.map((q) => new Date(q.scheduledAt).getTime()));
  const now = new Date();
  for (let day = 0; day < 30; day++) {
    for (const hour of QUEUE_SLOTS) {
      const slot = new Date(now.getFullYear(), now.getMonth(), now.getDate() + day, hour, 0, 0, 0);
      if (slot > now && !taken.has(slot.getTime())) return slot.toISOString();
    }
  }
  return new Date(now.getTime() + 3600000).toISOString();
}

function toLocalInput(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function loadStore(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

// ---------- small building blocks ----------

function CharCount({ text }) {
  const len = text.length;
  const over = len > 280;
  const near = len > 260 && !over;
  return (
    <span style={{ fontSize: 12, fontWeight: 700, color: over ? "#f4212e" : near ? "#ffd400" : "#8b98a5" }}>
      {len}/280
    </span>
  );
}

function ActionBtn({ onClick, children, primary, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 13px",
        borderRadius: 100,
        border: primary ? "none" : `1px solid ${danger ? "rgba(244,33,46,0.4)" : "rgba(255,255,255,0.15)"}`,
        background: primary ? ACCENT : "transparent",
        color: primary ? "#fff" : danger ? "#f4212e" : "#e7e9ea",
        fontSize: 12.5,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "inherit",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

function Card({ children, style }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 16,
        padding: 18,
        marginBottom: 14,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ---------- main component ----------

export default function TweetForge() {
  const [tab, setTab] = useState("write");
  const [queue, setQueue] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState(null);

  // composer
  const [composer, setComposer] = useState("");

  // generator
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("Punchy");
  const [format, setFormat] = useState("tweet"); // tweet | thread
  const [results, setResults] = useState(null); // { tweets: [...] } or { thread: [...] }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // library
  const [libTopic, setLibTopic] = useState("");
  const [library, setLibrary] = useState(null);
  const [libLoading, setLibLoading] = useState(false);

  useEffect(() => {
    setQueue(loadStore("tf_queue"));
    setDrafts(loadStore("tf_drafts"));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem("tf_queue", JSON.stringify(queue));
  }, [queue, loaded]);

  useEffect(() => {
    if (loaded) localStorage.setItem("tf_drafts", JSON.stringify(drafts));
  }, [drafts, loaded]);

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const callApi = async (body) => {
    const res = await fetch("/api/tweets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  };

  const generate = async () => {
    if (!topic.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const mode = format === "thread" ? "thread" : "generate";
      setResults(await callApi({ mode, topic, tone }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const improve = async () => {
    if (!composer.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      setResults(await callApi({ mode: "rewrite", tweet: composer }));
      notify("3 improved versions below ↓");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLibrary = async () => {
    if (!libTopic.trim() || libLoading) return;
    setLibLoading(true);
    setError(null);
    try {
      setLibrary(await callApi({ mode: "library", topic: libTopic }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLibLoading(false);
    }
  };

  // tweets is always an array: [text] for a single tweet, [t1, t2, ...] for a thread
  const addToQueue = (tweets) => {
    setQueue((q) =>
      [...q, { id: uid(), tweets, scheduledAt: nextFreeSlot(q), status: "queued" }].sort(
        (a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt)
      )
    );
    notify("Added to queue 📅");
  };

  const saveDraft = (tweets) => {
    setDrafts((d) => [{ id: uid(), tweets, savedAt: new Date().toISOString() }, ...d]);
    notify("Saved to drafts 💾");
  };

  const copyText = (text) => {
    navigator.clipboard?.writeText(text);
    notify("Copied to clipboard 📋");
  };

  const postNow = (tweets) => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweets[0])}`, "_blank");
    if (tweets.length > 1) {
      copyText(tweets.slice(1).join("\n\n"));
      notify("Tweet 1 opened in X — rest of thread copied 📋");
    }
  };

  const tweetActions = (tweets) => (
    <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 12 }}>
      <ActionBtn primary onClick={() => addToQueue(tweets)}>+ Queue</ActionBtn>
      <ActionBtn onClick={() => saveDraft(tweets)}>Draft</ActionBtn>
      <ActionBtn onClick={() => copyText(tweets.join("\n\n"))}>Copy</ActionBtn>
      {tweets.length === 1 && <ActionBtn onClick={() => { setComposer(tweets[0]); setTab("write"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</ActionBtn>}
      <ActionBtn onClick={() => postNow(tweets)}>Post on X ↗</ActionBtn>
    </div>
  );

  const renderTweetText = (text) => (
    <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "#e7e9ea", whiteSpace: "pre-wrap" }}>{text}</p>
  );

  const label = (text) => (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: 100,
        background: "rgba(29,155,240,0.13)",
        color: ACCENT,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.5,
      }}
    >
      {text}
    </span>
  );

  const upcoming = queue.filter((q) => q.status === "queued");
  const posted = queue.filter((q) => q.status === "posted");

  const TABS = [
    { id: "write", name: "✍️ Write" },
    { id: "library", name: "🔥 Viral Library" },
    { id: "queue", name: `📅 Queue${upcoming.length ? ` (${upcoming.length})` : ""}` },
    { id: "drafts", name: `📝 Drafts${drafts.length ? ` (${drafts.length})` : ""}` },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b0e14",
        color: "#e7e9ea",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(180deg, #101725 0%, #0b0e14 100%)",
          borderBottom: "1px solid rgba(29,155,240,0.18)",
          padding: "26px 20px 0",
          textAlign: "center",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ fontSize: 11, letterSpacing: 5, color: ACCENT, textTransform: "uppercase", marginBottom: 4 }}>
          AI-Powered X Growth Studio
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(1.7rem, 4vw, 2.4rem)",
            fontWeight: 800,
            background: `linear-gradient(135deg, #fff, ${ACCENT})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          TweetForge
        </h1>
        <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 16, flexWrap: "wrap" }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "10px 16px",
                border: "none",
                borderBottom: tab === t.id ? `2.5px solid ${ACCENT}` : "2.5px solid transparent",
                background: "transparent",
                color: tab === t.id ? "#fff" : "#8b98a5",
                fontSize: 14,
                fontWeight: tab === t.id ? 700 : 500,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "22px 16px 60px" }}>
        {error && (
          <div
            style={{
              background: "rgba(244,33,46,0.1)",
              border: "1px solid rgba(244,33,46,0.3)",
              borderRadius: 12,
              padding: "12px 16px",
              color: "#ff8a92",
              fontSize: 13.5,
              marginBottom: 16,
            }}
          >
            ⚠ {error}
          </div>
        )}

        {/* ---------- WRITE ---------- */}
        {tab === "write" && (
          <>
            <Card>
              <div style={{ fontSize: 11, letterSpacing: 2.5, color: "#8b98a5", textTransform: "uppercase", marginBottom: 10 }}>
                Composer
              </div>
              <textarea
                value={composer}
                onChange={(e) => setComposer(e.target.value)}
                placeholder="What's happening? Write a tweet, or generate one below and hit Edit…"
                rows={4}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#e7e9ea",
                  fontSize: 16,
                  fontFamily: "inherit",
                  resize: "vertical",
                  lineHeight: 1.6,
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, flexWrap: "wrap", gap: 8 }}>
                <CharCount text={composer} />
                {composer.trim() && (
                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                    <ActionBtn onClick={improve}>✨ Improve with AI</ActionBtn>
                    <ActionBtn onClick={() => saveDraft([composer])}>Draft</ActionBtn>
                    <ActionBtn primary onClick={() => { addToQueue([composer]); setComposer(""); }}>+ Queue</ActionBtn>
                    <ActionBtn onClick={() => postNow([composer])}>Post on X ↗</ActionBtn>
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <div style={{ fontSize: 11, letterSpacing: 2.5, color: "#8b98a5", textTransform: "uppercase", marginBottom: 12 }}>
                AI Generator
              </div>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && generate()}
                placeholder='Topic or idea… e.g. "lessons from building a side project"'
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  padding: "13px 16px",
                  color: "#e7e9ea",
                  fontSize: 15,
                  fontFamily: "inherit",
                  outline: "none",
                  marginBottom: 12,
                }}
              />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                {TONES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    style={{
                      padding: "6px 13px",
                      borderRadius: 100,
                      border: tone === t ? `1.5px solid ${ACCENT}` : "1.5px solid rgba(255,255,255,0.12)",
                      background: tone === t ? "rgba(29,155,240,0.13)" : "transparent",
                      color: tone === t ? ACCENT : "#8b98a5",
                      fontSize: 12.5,
                      fontWeight: tone === t ? 700 : 500,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  {[
                    { id: "tweet", name: "Single tweet" },
                    { id: "thread", name: "Thread 🧵" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFormat(f.id)}
                      style={{
                        padding: "7px 15px",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: format === f.id ? "rgba(255,255,255,0.1)" : "transparent",
                        color: format === f.id ? "#fff" : "#8b98a5",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
                <button
                  onClick={generate}
                  disabled={loading || !topic.trim()}
                  style={{
                    padding: "11px 28px",
                    background: loading || !topic.trim() ? "rgba(29,155,240,0.25)" : ACCENT,
                    border: "none",
                    borderRadius: 100,
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 14.5,
                    cursor: loading || !topic.trim() ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {loading ? "Generating…" : "⚡ Generate"}
                </button>
              </div>
            </Card>

            {loading && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#8b98a5" }}>
                <div style={{ fontSize: 30, marginBottom: 12, animation: "spin 1.5s linear infinite", display: "inline-block", color: ACCENT }}>⚡</div>
                <p style={{ fontSize: 14 }}>Forging tweets…</p>
              </div>
            )}

            {results?.tweets && !loading && (
              <div style={{ animation: "fadeUp 0.4s ease" }}>
                {results.tweets.map((t, i) => (
                  <Card key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      {label(t.style || t.format || "Variation " + (i + 1))}
                      <CharCount text={t.text} />
                    </div>
                    {renderTweetText(t.text)}
                    {tweetActions([t.text])}
                  </Card>
                ))}
              </div>
            )}

            {results?.thread && !loading && (
              <Card style={{ animation: "fadeUp 0.4s ease" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  {label(`Thread · ${results.thread.length} tweets`)}
                </div>
                {results.thread.map((t, i) => (
                  <div
                    key={i}
                    style={{
                      borderLeft: `2px solid ${i === 0 ? ACCENT : "rgba(255,255,255,0.15)"}`,
                      paddingLeft: 14,
                      marginBottom: 16,
                    }}
                  >
                    <div style={{ fontSize: 11, color: "#8b98a5", fontWeight: 700, marginBottom: 4 }}>
                      {i + 1}/{results.thread.length} · <CharCount text={t} />
                    </div>
                    {renderTweetText(t)}
                  </div>
                ))}
                {tweetActions(results.thread)}
              </Card>
            )}
          </>
        )}

        {/* ---------- LIBRARY ---------- */}
        {tab === "library" && (
          <>
            <Card>
              <div style={{ fontSize: 11, letterSpacing: 2.5, color: "#8b98a5", textTransform: "uppercase", marginBottom: 8 }}>
                Viral Inspiration Library
              </div>
              <p style={{ margin: "0 0 12px", color: "#8b98a5", fontSize: 13.5, lineHeight: 1.6 }}>
                Enter a topic and get 6 ready-to-edit tweets, each written in a different proven viral format.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input
                  value={libTopic}
                  onChange={(e) => setLibTopic(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchLibrary()}
                  placeholder='e.g. "productivity", "faith", "entrepreneurship"'
                  style={{
                    flex: 1,
                    minWidth: 200,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    padding: "12px 16px",
                    color: "#e7e9ea",
                    fontSize: 15,
                    fontFamily: "inherit",
                    outline: "none",
                  }}
                />
                <button
                  onClick={fetchLibrary}
                  disabled={libLoading || !libTopic.trim()}
                  style={{
                    padding: "11px 24px",
                    background: libLoading || !libTopic.trim() ? "rgba(29,155,240,0.25)" : ACCENT,
                    border: "none",
                    borderRadius: 100,
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 14.5,
                    cursor: libLoading || !libTopic.trim() ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {libLoading ? "Hunting…" : "🔥 Find formats"}
                </button>
              </div>
              <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["productivity", "faith & purpose", "side hustles", "personal growth"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setLibTopic(s)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 100,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "transparent",
                      color: "#8b98a5",
                      fontSize: 12,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Card>

            {libLoading && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#8b98a5" }}>
                <div style={{ fontSize: 30, marginBottom: 12, animation: "spin 1.5s linear infinite", display: "inline-block", color: ACCENT }}>🔥</div>
                <p style={{ fontSize: 14 }}>Studying viral formats…</p>
              </div>
            )}

            {library?.tweets && !libLoading && (
              <div style={{ animation: "fadeUp 0.4s ease" }}>
                {library.tweets.map((t, i) => (
                  <Card key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      {label(t.format || "Format")}
                      <CharCount text={t.text} />
                    </div>
                    {renderTweetText(t.text)}
                    {tweetActions([t.text])}
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* ---------- QUEUE ---------- */}
        {tab === "queue" && (
          <>
            {upcoming.length === 0 && posted.length === 0 && (
              <div style={{ textAlign: "center", padding: "50px 20px", color: "#8b98a5" }}>
                <div style={{ fontSize: 40, marginBottom: 14 }}>📅</div>
                <p style={{ fontSize: 15, lineHeight: 1.7 }}>
                  Your queue is empty. Generate tweets in <strong style={{ color: "#e7e9ea" }}>✍️ Write</strong> and hit{" "}
                  <strong style={{ color: ACCENT }}>+ Queue</strong> — each one auto-schedules into the next free slot
                  (9am, 1pm, 6pm).
                </p>
              </div>
            )}
            {upcoming.map((item) => (
              <Card key={item.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                  <input
                    type="datetime-local"
                    value={toLocalInput(item.scheduledAt)}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (!v) return;
                      setQueue((q) =>
                        q
                          .map((x) => (x.id === item.id ? { ...x, scheduledAt: new Date(v).toISOString() } : x))
                          .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
                      );
                    }}
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      padding: "6px 10px",
                      color: "#e7e9ea",
                      fontSize: 13,
                      fontFamily: "inherit",
                      colorScheme: "dark",
                    }}
                  />
                  {item.tweets.length > 1 && label(`Thread · ${item.tweets.length}`)}
                </div>
                {renderTweetText(item.tweets[0])}
                {item.tweets.length > 1 && (
                  <p style={{ margin: "6px 0 0", color: "#8b98a5", fontSize: 13 }}>…and {item.tweets.length - 1} more tweets</p>
                )}
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 12 }}>
                  <ActionBtn primary onClick={() => postNow(item.tweets)}>Post on X ↗</ActionBtn>
                  <ActionBtn onClick={() => setQueue((q) => q.map((x) => (x.id === item.id ? { ...x, status: "posted" } : x)))}>
                    ✓ Mark posted
                  </ActionBtn>
                  <ActionBtn onClick={() => copyText(item.tweets.join("\n\n"))}>Copy</ActionBtn>
                  <ActionBtn danger onClick={() => setQueue((q) => q.filter((x) => x.id !== item.id))}>Delete</ActionBtn>
                </div>
              </Card>
            ))}
            {posted.length > 0 && (
              <>
                <div style={{ fontSize: 11, letterSpacing: 2.5, color: "#8b98a5", textTransform: "uppercase", margin: "24px 0 10px" }}>
                  Posted
                </div>
                {posted.map((item) => (
                  <Card key={item.id} style={{ opacity: 0.55 }}>
                    {renderTweetText(item.tweets[0])}
                    <div style={{ display: "flex", gap: 7, marginTop: 10 }}>
                      <ActionBtn danger onClick={() => setQueue((q) => q.filter((x) => x.id !== item.id))}>Remove</ActionBtn>
                    </div>
                  </Card>
                ))}
              </>
            )}
          </>
        )}

        {/* ---------- DRAFTS ---------- */}
        {tab === "drafts" && (
          <>
            {drafts.length === 0 && (
              <div style={{ textAlign: "center", padding: "50px 20px", color: "#8b98a5" }}>
                <div style={{ fontSize: 40, marginBottom: 14 }}>📝</div>
                <p style={{ fontSize: 15 }}>No drafts yet. Save any generated tweet here to polish later.</p>
              </div>
            )}
            {drafts.map((d) => (
              <Card key={d.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ color: "#8b98a5", fontSize: 12 }}>Saved {new Date(d.savedAt).toLocaleString()}</span>
                  {d.tweets.length > 1 && label(`Thread · ${d.tweets.length}`)}
                </div>
                {renderTweetText(d.tweets[0])}
                {d.tweets.length > 1 && (
                  <p style={{ margin: "6px 0 0", color: "#8b98a5", fontSize: 13 }}>…and {d.tweets.length - 1} more tweets</p>
                )}
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 12 }}>
                  <ActionBtn primary onClick={() => { addToQueue(d.tweets); setDrafts((ds) => ds.filter((x) => x.id !== d.id)); }}>
                    + Queue
                  </ActionBtn>
                  {d.tweets.length === 1 && (
                    <ActionBtn onClick={() => { setComposer(d.tweets[0]); setTab("write"); }}>Edit</ActionBtn>
                  )}
                  <ActionBtn onClick={() => copyText(d.tweets.join("\n\n"))}>Copy</ActionBtn>
                  <ActionBtn danger onClick={() => setDrafts((ds) => ds.filter((x) => x.id !== d.id))}>Delete</ActionBtn>
                </div>
              </Card>
            ))}
          </>
        )}

        <div style={{ textAlign: "center", marginTop: 46, color: "#3a4149", fontSize: 11, lineHeight: 1.8 }}>
          TweetForge · queue &amp; drafts are stored locally in your browser
          <br />
          <a href="/" style={{ color: "#556170" }}>← Pocket Bible</a>
        </div>
      </div>

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: ACCENT,
            color: "#fff",
            padding: "10px 22px",
            borderRadius: 100,
            fontSize: 13.5,
            fontWeight: 600,
            zIndex: 100,
            animation: "fadeUp 0.25s ease",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          {toast}
        </div>
      )}

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        textarea::placeholder, input::placeholder { color: #556170; }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  );
}
