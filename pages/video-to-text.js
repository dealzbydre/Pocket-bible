import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const PLATFORM_ICONS = {
  youtube: "▶",
  tiktok: "♪",
  instagram: "◈",
  twitter: "✦",
  facebook: "◉",
  twitch: "◈",
  paste: "✎",
};

const PLATFORM_LABELS = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  twitter: "Twitter / X",
  facebook: "Facebook",
  twitch: "Twitch",
  paste: "Pasted Text",
  unknown: "Unknown",
};

const UNSUPPORTED_HINT = {
  tiktok: "Open TikTok → share the video → tap “Captions” or use the desktop site to copy the transcript.",
  instagram: "On Instagram, tap the three-dot menu on the post → Transcript (if available).",
  twitter: "On X/Twitter, tap the CC button on the video to view captions, then copy the text.",
  facebook: "On Facebook, click the video → gear icon → Open Transcript.",
  twitch: "Open Twitch, click the video → Transcript button beneath the player.",
};

function detectPlatformClient(url) {
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
    return null;
  }
}

export default function VideoToText() {
  const [url, setUrl] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [mode, setMode] = useState("url"); // "url" | "paste"
  const [detectedPlatform, setDetectedPlatform] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [unsupportedInfo, setUnsupportedInfo] = useState(null);
  const [showRaw, setShowRaw] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (result && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [result]);

  useEffect(() => {
    if (url) {
      const p = detectPlatformClient(url);
      setDetectedPlatform(p);
    } else {
      setDetectedPlatform(null);
    }
  }, [url]);

  const extract = async () => {
    if (loading) return;
    if (mode === "url" && !url.trim()) return;
    if (mode === "paste" && !pastedText.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setUnsupportedInfo(null);

    try {
      const body = mode === "url" ? { url } : { pastedText };
      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === "unsupported_platform") {
          setUnsupportedInfo(data);
        } else {
          setError(data.error || "Something went wrong.");
        }
        return;
      }

      setResult(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = mode === "url" ? url.trim().length > 0 : pastedText.trim().length > 0;

  const platformColor = (p) => {
    const map = {
      youtube: "#ff4444",
      tiktok: "#69c9d0",
      instagram: "#e1306c",
      twitter: "#1da1f2",
      facebook: "#1877f2",
      twitch: "#9146ff",
      paste: "#d4af37",
    };
    return map[p] || "#d4af37";
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      fontFamily: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
      color: "#f0ebe0",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(180deg, #1a1200 0%, #0a0a0f 100%)",
        borderBottom: "1px solid rgba(212,175,55,0.2)",
        padding: "20px 24px 18px",
        textAlign: "center",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ fontSize: 11, letterSpacing: 5, color: "#d4af37", textTransform: "uppercase", marginBottom: 6 }}>
          Pocket Bible Reference
        </div>
        <h1 style={{
          margin: 0, fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)", fontWeight: 700,
          background: "linear-gradient(135deg, #fff8e7, #d4af37, #b8952a)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          Video to Text
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: "#7a7060" }}>
          Extract &amp; analyze transcripts from social media videos
        </p>
        <div style={{ marginTop: 12 }}>
          <Link href="/" style={{
            fontSize: 12, color: "#4a4540", textDecoration: "none",
            border: "1px solid rgba(212,175,55,0.15)", borderRadius: 100,
            padding: "4px 14px", letterSpacing: 0.5,
          }}>
            ← Bible Search
          </Link>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, maxWidth: 760, width: "100%", margin: "0 auto", padding: "24px 16px 60px", boxSizing: "border-box" }}>

        {/* Mode toggle */}
        <div style={{ display: "flex", gap: 0, marginBottom: 20, border: "1.5px solid rgba(212,175,55,0.2)", borderRadius: 12, overflow: "hidden" }}>
          {[
            { id: "url", label: "Paste Link", icon: "⬡" },
            { id: "paste", label: "Paste Transcript", icon: "✎" },
          ].map((m) => (
            <button key={m.id} onClick={() => { setMode(m.id); setError(null); setUnsupportedInfo(null); }} style={{
              flex: 1, padding: "12px 16px",
              background: mode === m.id ? "rgba(212,175,55,0.12)" : "transparent",
              border: "none",
              borderRight: m.id === "url" ? "1.5px solid rgba(212,175,55,0.2)" : "none",
              color: mode === m.id ? "#d4af37" : "#7a7060",
              fontSize: 14, fontWeight: mode === m.id ? 700 : 400,
              cursor: "pointer", fontFamily: "inherit", letterSpacing: 0.5,
              transition: "all 0.2s",
            }}>
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        {/* URL input mode */}
        {mode === "url" && (
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1.5px solid rgba(212,175,55,0.2)",
            borderRadius: 18, overflow: "hidden", marginBottom: 16,
          }}>
            <div style={{ display: "flex", alignItems: "center", padding: "14px 20px 6px", gap: 10 }}>
              {detectedPlatform && (
                <span style={{
                  fontSize: 11, letterSpacing: 1, color: platformColor(detectedPlatform),
                  background: platformColor(detectedPlatform) + "20",
                  padding: "3px 10px", borderRadius: 100, fontWeight: 700,
                  whiteSpace: "nowrap",
                }}>
                  {PLATFORM_ICONS[detectedPlatform]} {PLATFORM_LABELS[detectedPlatform] || "Unknown"}
                </span>
              )}
              {detectedPlatform === "youtube" && (
                <span style={{ fontSize: 11, color: "#4ade80", letterSpacing: 0.5 }}>✓ Auto-transcript supported</span>
              )}
              {detectedPlatform && detectedPlatform !== "youtube" && detectedPlatform !== null && (
                <span style={{ fontSize: 11, color: "#fcd34d", letterSpacing: 0.5 }}>⚠ Use "Paste Transcript" for this platform</span>
              )}
            </div>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") extract(); }}
              placeholder="Paste any social media video link — YouTube, TikTok, Instagram, X, Facebook…"
              style={{
                width: "100%", background: "transparent", border: "none", outline: "none",
                padding: "8px 20px 14px", color: "#f0ebe0",
                fontSize: 15, fontFamily: "inherit", lineHeight: 1.6,
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "4px 16px 14px" }}>
              <button onClick={extract} disabled={loading || !canSubmit} style={{
                padding: "11px 28px",
                background: loading || !canSubmit ? "rgba(212,175,55,0.15)" : "linear-gradient(135deg, #d4af37, #b8952a)",
                border: "none", borderRadius: 100,
                color: loading || !canSubmit ? "#7a7060" : "#0a0a0f",
                fontWeight: 700, fontSize: 15, cursor: loading || !canSubmit ? "not-allowed" : "pointer",
                letterSpacing: 0.5, fontFamily: "inherit", transition: "all 0.2s",
              }}>
                {loading ? "Extracting…" : "Extract Transcript"}
              </button>
            </div>
          </div>
        )}

        {/* Paste mode */}
        {mode === "paste" && (
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1.5px solid rgba(212,175,55,0.2)",
            borderRadius: 18, overflow: "hidden", marginBottom: 16,
          }}>
            <div style={{ padding: "14px 20px 4px", fontSize: 12, color: "#4a4540" }}>
              Paste transcript/captions text from any platform — TikTok, Instagram, X, Facebook, etc.
            </div>
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste video transcript or captions text here…"
              rows={6}
              style={{
                width: "100%", background: "transparent", border: "none", outline: "none",
                padding: "10px 20px 12px", color: "#f0ebe0",
                fontSize: 15, fontFamily: "inherit", resize: "vertical", lineHeight: 1.6,
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "4px 16px 14px" }}>
              <button onClick={extract} disabled={loading || !canSubmit} style={{
                padding: "11px 28px",
                background: loading || !canSubmit ? "rgba(212,175,55,0.15)" : "linear-gradient(135deg, #d4af37, #b8952a)",
                border: "none", borderRadius: 100,
                color: loading || !canSubmit ? "#7a7060" : "#0a0a0f",
                fontWeight: 700, fontSize: 15, cursor: loading || !canSubmit ? "not-allowed" : "pointer",
                letterSpacing: 0.5, fontFamily: "inherit", transition: "all 0.2s",
              }}>
                {loading ? "Analyzing…" : "Analyze Transcript"}
              </button>
            </div>
          </div>
        )}

        {/* Supported platforms info */}
        {!result && !loading && (
          <div style={{
            display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24, justifyContent: "center",
          }}>
            {[
              { p: "youtube", label: "YouTube", auto: true },
              { p: "tiktok", label: "TikTok", auto: false },
              { p: "instagram", label: "Instagram", auto: false },
              { p: "twitter", label: "X / Twitter", auto: false },
              { p: "facebook", label: "Facebook", auto: false },
            ].map(({ p, label, auto }) => (
              <div key={p} style={{
                padding: "5px 12px", borderRadius: 100,
                border: `1px solid ${platformColor(p)}30`,
                background: platformColor(p) + "10",
                fontSize: 11, color: auto ? "#4ade80" : "#7a7060",
                letterSpacing: 0.5,
              }}>
                {PLATFORM_ICONS[p]} {label}
                <span style={{ marginLeft: 5, opacity: 0.6 }}>{auto ? "auto" : "paste"}</span>
              </div>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 14, color: "#d4af37", animation: "spin 2s linear infinite", display: "inline-block" }}>✦</div>
            <p style={{ color: "#7a7060", fontSize: 15 }}>Extracting and analyzing transcript…</p>
            <p style={{ color: "#3a3530", fontSize: 12 }}>This may take a few seconds</p>
          </div>
        )}

        {/* Generic error */}
        {error && (
          <div style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 12, padding: "14px 18px", color: "#fca5a5", fontSize: 14, marginBottom: 20,
          }}>
            ⚠ {error}
          </div>
        )}

        {/* Unsupported platform info */}
        {unsupportedInfo && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            <div style={{
              background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.25)",
              borderRadius: 16, padding: "20px 22px", marginBottom: 16,
            }}>
              <div style={{ fontSize: 10, letterSpacing: 3, color: "#fcd34d", textTransform: "uppercase", marginBottom: 10 }}>
                {PLATFORM_ICONS[unsupportedInfo.platform]} {PLATFORM_LABELS[unsupportedInfo.platform]} — Manual Step Required
              </div>
              <p style={{ margin: "0 0 12px", color: "#f0ebe0", fontSize: 14, lineHeight: 1.7 }}>
                {unsupportedInfo.message}
              </p>
              {UNSUPPORTED_HINT[unsupportedInfo.platform] && (
                <div style={{
                  background: "rgba(255,255,255,0.04)", borderRadius: 8,
                  padding: "10px 14px", border: "1px solid rgba(255,255,255,0.07)",
                }}>
                  <span style={{ color: "#d4af37", fontSize: 12, fontWeight: 700 }}>How to get captions: </span>
                  <span style={{ color: "#a89880", fontSize: 12, lineHeight: 1.6 }}>{UNSUPPORTED_HINT[unsupportedInfo.platform]}</span>
                </div>
              )}
              <button onClick={() => { setMode("paste"); setUnsupportedInfo(null); }} style={{
                marginTop: 14, padding: "9px 20px",
                background: "linear-gradient(135deg, #d4af37, #b8952a)",
                border: "none", borderRadius: 100,
                color: "#0a0a0f", fontWeight: 700, fontSize: 13,
                cursor: "pointer", fontFamily: "inherit",
              }}>
                ✎ Switch to Paste Mode
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>

            {/* Source badge */}
            <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{
                padding: "4px 12px", borderRadius: 100,
                background: platformColor(result.platform) + "20",
                color: platformColor(result.platform),
                fontSize: 11, fontWeight: 700, letterSpacing: 1,
              }}>
                {PLATFORM_ICONS[result.platform]} {PLATFORM_LABELS[result.platform]}
              </span>
              {result.videoId && (
                <a
                  href={`https://www.youtube.com/watch?v=${result.videoId}`}
                  target="_blank" rel="noreferrer"
                  style={{ fontSize: 11, color: "#4a4540", textDecoration: "none" }}
                >
                  youtube.com/watch?v={result.videoId} →
                </a>
              )}
            </div>

            {/* Summary */}
            {result.summary && (
              <div style={{
                background: "rgba(212,175,55,0.06)", border: "1.5px solid rgba(212,175,55,0.2)",
                borderRadius: 16, padding: "18px 20px", marginBottom: 18,
              }}>
                <div style={{ fontSize: 10, letterSpacing: 3, color: "#d4af37", textTransform: "uppercase", marginBottom: 8 }}>Summary</div>
                <p style={{ margin: 0, color: "#f0ebe0", fontSize: 15, lineHeight: 1.8 }}>{result.summary}</p>
              </div>
            )}

            {/* Themes */}
            {result.themes?.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 10, letterSpacing: 3, color: "#4a4540", textTransform: "uppercase", marginBottom: 8 }}>Themes</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {result.themes.map((t, i) => (
                    <span key={i} style={{
                      padding: "4px 12px", borderRadius: 100,
                      border: "1px solid rgba(212,175,55,0.2)",
                      background: "rgba(212,175,55,0.06)",
                      color: "#a89880", fontSize: 12,
                    }}>{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Bible References */}
            {result.bibleReferences?.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 10, letterSpacing: 3, color: "#d4af37", textTransform: "uppercase", marginBottom: 10 }}>
                  Scripture References Found ({result.bibleReferences.length})
                </div>
                {result.bibleReferences.map((ref, i) => (
                  <div key={i} style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(212,175,55,0.15)",
                    borderRadius: 12, padding: "14px 16px", marginBottom: 8,
                    display: "flex", gap: 14, alignItems: "flex-start",
                  }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#d4af37", whiteSpace: "nowrap" }}>📖 {ref.reference}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, color: "#a89880", fontSize: 13, lineHeight: 1.6 }}>{ref.context}</p>
                      <a
                        href={`https://www.biblegateway.com/passage/?search=${encodeURIComponent(ref.reference)}&version=KJV`}
                        target="_blank" rel="noreferrer"
                        style={{ fontSize: 11, color: "#4a4540", textDecoration: "none", letterSpacing: 0.5 }}
                      >
                        Look up at BibleGateway →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {result.bibleReferences?.length === 0 && (
              <div style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 12, padding: "12px 16px", marginBottom: 18,
                color: "#4a4540", fontSize: 13,
              }}>
                📖 No specific Bible verse references were detected in this transcript.
              </div>
            )}

            {/* Search Bible CTA */}
            <div style={{
              background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.15)",
              borderRadius: 12, padding: "14px 18px", marginBottom: 18,
              display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10,
            }}>
              <p style={{ margin: 0, color: "#7a7060", fontSize: 13, lineHeight: 1.6 }}>
                Want to look up any of these scriptures in the Bible?
              </p>
              <Link href="/" style={{
                padding: "8px 18px",
                background: "linear-gradient(135deg, #d4af37, #b8952a)",
                border: "none", borderRadius: 100,
                color: "#0a0a0f", fontWeight: 700, fontSize: 13,
                textDecoration: "none", letterSpacing: 0.5,
              }}>
                Open Bible Search →
              </Link>
            </div>

            {/* Transcript */}
            <div style={{ marginBottom: 16 }}>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10,
              }}>
                <div style={{ fontSize: 10, letterSpacing: 3, color: "#4a4540", textTransform: "uppercase" }}>
                  Full Transcript
                </div>
                <button onClick={() => setShowRaw(!showRaw)} style={{
                  background: "transparent", border: "1px solid rgba(212,175,55,0.2)",
                  borderRadius: 100, padding: "4px 12px", color: "#7a7060",
                  fontSize: 11, cursor: "pointer", fontFamily: "inherit",
                }}>
                  {showRaw ? "Show Cleaned" : "Show Raw"}
                </button>
              </div>
              <div style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(212,175,55,0.1)",
                borderRadius: 14, padding: "18px 20px",
                maxHeight: 400, overflowY: "auto",
                fontSize: 14, lineHeight: 1.9, color: "#c0b8a8",
                whiteSpace: "pre-wrap", wordBreak: "break-word",
              }}>
                {showRaw ? result.rawText : result.cleanedTranscript}
              </div>
            </div>

            {/* Copy button */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => navigator.clipboard.writeText(showRaw ? result.rawText : result.cleanedTranscript)}
                style={{
                  padding: "9px 20px", background: "transparent",
                  border: "1.5px solid rgba(212,175,55,0.3)", borderRadius: 100,
                  color: "#d4af37", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Copy Transcript
              </button>
            </div>
          </div>
        )}

        <div ref={bottomRef} />

        <div style={{ textAlign: "center", marginTop: 40, color: "#2e2a24", fontSize: 11 }}>
          Video to Text · Pocket Bible Reference · © NCHOP
        </div>
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder, textarea::placeholder { color: #3a3530; }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.2); border-radius: 2px; }
      `}</style>
    </div>
  );
}
