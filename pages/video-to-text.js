import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const PLATFORMS = {
  youtube:   { label: "YouTube",    icon: "▶", color: "#ff4444" },
  tiktok:    { label: "TikTok",     icon: "♪", color: "#69c9d0" },
  instagram: { label: "Instagram",  icon: "◈", color: "#e1306c" },
  twitter:   { label: "X / Twitter",icon: "✦", color: "#1da1f2" },
  facebook:  { label: "Facebook",   icon: "◉", color: "#1877f2" },
  twitch:    { label: "Twitch",     icon: "◈", color: "#9146ff" },
  unknown:   { label: "Unknown",    icon: "?", color: "#7a7060" },
};

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
    return null;
  }
}

export default function VideoToText() {
  const [url, setUrl] = useState("");
  const [detectedPlatform, setDetectedPlatform] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [unsupportedInfo, setUnsupportedInfo] = useState(null);
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (result && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [result]);

  useEffect(() => {
    setDetectedPlatform(url.trim() ? detectPlatform(url) : null);
    setError(null);
    setUnsupportedInfo(null);
  }, [url]);

  const convert = async () => {
    if (loading || !url.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setUnsupportedInfo(null);
    setShowRaw(false);

    try {
      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === "unsupported_platform") {
          setUnsupportedInfo(data);
        } else {
          setError(data.error || "Something went wrong. Please try again.");
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

  const copyTranscript = () => {
    const text = showRaw ? result.rawText : result.cleanedTranscript;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const platform = detectedPlatform ? PLATFORMS[detectedPlatform] : null;

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
        padding: "22px 24px 20px",
        textAlign: "center",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ fontSize: 11, letterSpacing: 5, color: "#d4af37", textTransform: "uppercase", marginBottom: 6 }}>
          Pocket Bible Reference
        </div>
        <h1 style={{
          margin: 0, fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", fontWeight: 700,
          background: "linear-gradient(135deg, #fff8e7, #d4af37, #b8952a)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          Video to Text
        </h1>
        <p style={{ margin: "6px 0 12px", fontSize: 13, color: "#7a7060" }}>
          Convert any social media video link into a readable transcript
        </p>
        <Link href="/" style={{
          fontSize: 12, color: "#4a4540", textDecoration: "none",
          border: "1px solid rgba(212,175,55,0.15)", borderRadius: 100,
          padding: "4px 14px", letterSpacing: 0.5,
        }}>
          ← Bible Search
        </Link>
      </div>

      {/* Main */}
      <div style={{ flex: 1, maxWidth: 760, width: "100%", margin: "0 auto", padding: "28px 16px 60px", boxSizing: "border-box" }}>

        {/* URL Input Card */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: `1.5px solid ${platform ? platform.color + "50" : "rgba(212,175,55,0.2)"}`,
          borderRadius: 20, overflow: "hidden", marginBottom: 20,
          transition: "border-color 0.3s",
        }}>
          {/* Platform badge row */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px 4px", minHeight: 40 }}>
            {platform && detectedPlatform !== "unknown" ? (
              <>
                <span style={{
                  fontSize: 11, letterSpacing: 1,
                  color: platform.color,
                  background: platform.color + "20",
                  padding: "3px 11px", borderRadius: 100, fontWeight: 700,
                }}>
                  {platform.icon} {platform.label}
                </span>
                {detectedPlatform === "youtube" ? (
                  <span style={{ fontSize: 11, color: "#4ade80" }}>✓ Transcript supported</span>
                ) : (
                  <span style={{ fontSize: 11, color: "#fcd34d" }}>⚠ Limited support — see below</span>
                )}
              </>
            ) : detectedPlatform === "unknown" ? (
              <span style={{ fontSize: 11, color: "#7a7060" }}>Unrecognized platform</span>
            ) : (
              <span style={{ fontSize: 11, color: "#3a3530" }}>Paste a link below to get started</span>
            )}
          </div>

          {/* URL field */}
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") convert(); }}
            placeholder="youtube.com · tiktok.com · instagram.com · x.com · facebook.com"
            style={{
              width: "100%", background: "transparent", border: "none", outline: "none",
              padding: "10px 20px 6px", color: "#f0ebe0",
              fontSize: 16, fontFamily: "inherit", lineHeight: 1.7,
              boxSizing: "border-box",
            }}
          />

          {/* Convert button */}
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 18px 16px" }}>
            <button
              onClick={convert}
              disabled={loading || !url.trim()}
              style={{
                padding: "12px 32px",
                background: loading || !url.trim()
                  ? "rgba(212,175,55,0.12)"
                  : "linear-gradient(135deg, #d4af37, #b8952a)",
                border: "none", borderRadius: 100,
                color: loading || !url.trim() ? "#7a7060" : "#0a0a0f",
                fontWeight: 700, fontSize: 15,
                cursor: loading || !url.trim() ? "not-allowed" : "pointer",
                letterSpacing: 0.5, fontFamily: "inherit", transition: "all 0.2s",
              }}
            >
              {loading ? "Converting…" : "Convert to Text"}
            </button>
          </div>
        </div>

        {/* Supported platform badges */}
        {!result && !loading && !error && !unsupportedInfo && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 28 }}>
            {Object.entries(PLATFORMS).filter(([k]) => k !== "unknown").map(([key, p]) => (
              <div key={key} style={{
                padding: "5px 13px", borderRadius: 100,
                border: `1px solid ${p.color}25`,
                background: p.color + "0d",
                fontSize: 11, color: key === "youtube" ? "#4ade80" : "#5a5550",
                letterSpacing: 0.5,
              }}>
                {p.icon} {p.label}
              </div>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "52px 0" }}>
            <div style={{
              fontSize: 34, marginBottom: 16, color: "#d4af37",
              animation: "spin 2s linear infinite", display: "inline-block",
            }}>✦</div>
            <p style={{ color: "#7a7060", fontSize: 15, margin: "0 0 6px" }}>Converting video to text…</p>
            <p style={{ color: "#3a3530", fontSize: 12, margin: 0 }}>This may take a few seconds</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 14, padding: "16px 20px", color: "#fca5a5", fontSize: 14, marginBottom: 20,
          }}>
            ⚠ {error}
          </div>
        )}

        {/* Unsupported platform */}
        {unsupportedInfo && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            <div style={{
              background: "rgba(245,158,11,0.06)", border: "1.5px solid rgba(245,158,11,0.2)",
              borderRadius: 18, padding: "22px 24px", marginBottom: 16,
            }}>
              <div style={{ fontSize: 10, letterSpacing: 3, color: "#fcd34d", textTransform: "uppercase", marginBottom: 12 }}>
                {unsupportedInfo.platform && PLATFORMS[unsupportedInfo.platform]
                  ? `${PLATFORMS[unsupportedInfo.platform].icon} ${PLATFORMS[unsupportedInfo.platform].label}`
                  : "Platform"} — Coming Soon
              </div>
              <p style={{ margin: "0 0 14px", color: "#f0ebe0", fontSize: 15, lineHeight: 1.75 }}>
                {unsupportedInfo.message}
              </p>
              <div style={{
                background: "rgba(212,175,55,0.06)", borderRadius: 10,
                padding: "12px 16px", border: "1px solid rgba(212,175,55,0.15)",
              }}>
                <p style={{ margin: 0, color: "#a89880", fontSize: 13, lineHeight: 1.7 }}>
                  <strong style={{ color: "#d4af37" }}>Currently supported: </strong>
                  YouTube links with captions enabled. TikTok, Instagram, X, and Facebook support is in development.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>

            {/* Source */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
              {result.platform && PLATFORMS[result.platform] && (
                <span style={{
                  padding: "4px 13px", borderRadius: 100,
                  background: PLATFORMS[result.platform].color + "20",
                  color: PLATFORMS[result.platform].color,
                  fontSize: 11, fontWeight: 700, letterSpacing: 1,
                }}>
                  {PLATFORMS[result.platform].icon} {PLATFORMS[result.platform].label}
                </span>
              )}
              {result.videoId && (
                <a
                  href={`https://www.youtube.com/watch?v=${result.videoId}`}
                  target="_blank" rel="noreferrer"
                  style={{ fontSize: 11, color: "#4a4540", textDecoration: "none" }}
                >
                  youtu.be/{result.videoId} ↗
                </a>
              )}
            </div>

            {/* Summary */}
            {result.summary && (
              <div style={{
                background: "rgba(212,175,55,0.06)", border: "1.5px solid rgba(212,175,55,0.2)",
                borderRadius: 16, padding: "18px 22px", marginBottom: 18,
              }}>
                <div style={{ fontSize: 10, letterSpacing: 3, color: "#d4af37", textTransform: "uppercase", marginBottom: 10 }}>
                  Summary
                </div>
                <p style={{ margin: 0, color: "#f0ebe0", fontSize: 15, lineHeight: 1.85 }}>{result.summary}</p>
              </div>
            )}

            {/* Themes */}
            {result.themes?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, letterSpacing: 3, color: "#4a4540", textTransform: "uppercase", marginBottom: 9 }}>
                  Themes
                </div>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  {result.themes.map((t, i) => (
                    <span key={i} style={{
                      padding: "5px 13px", borderRadius: 100,
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
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, letterSpacing: 3, color: "#d4af37", textTransform: "uppercase", marginBottom: 10 }}>
                  Scripture References Found ({result.bibleReferences.length})
                </div>
                {result.bibleReferences.map((ref, i) => (
                  <div key={i} style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(212,175,55,0.15)",
                    borderRadius: 13, padding: "14px 18px", marginBottom: 9,
                    display: "flex", gap: 14, alignItems: "flex-start",
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#d4af37", whiteSpace: "nowrap" }}>
                      📖 {ref.reference}
                    </span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: "0 0 6px", color: "#a89880", fontSize: 13, lineHeight: 1.65 }}>{ref.context}</p>
                      <a
                        href={`https://www.biblegateway.com/passage/?search=${encodeURIComponent(ref.reference)}&version=KJV`}
                        target="_blank" rel="noreferrer"
                        style={{ fontSize: 11, color: "#4a4540", textDecoration: "none" }}
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

            {/* Bible Search CTA */}
            <div style={{
              background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.13)",
              borderRadius: 13, padding: "14px 18px", marginBottom: 22,
              display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10,
            }}>
              <p style={{ margin: 0, color: "#7a7060", fontSize: 13 }}>
                Look up any scripture in the Bible?
              </p>
              <Link href="/" style={{
                padding: "8px 18px",
                background: "linear-gradient(135deg, #d4af37, #b8952a)",
                borderRadius: 100,
                color: "#0a0a0f", fontWeight: 700, fontSize: 13,
                textDecoration: "none", letterSpacing: 0.5,
              }}>
                Open Bible Search →
              </Link>
            </div>

            {/* Full Transcript */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 10, letterSpacing: 3, color: "#4a4540", textTransform: "uppercase" }}>
                  Full Transcript
                </div>
                <button onClick={() => setShowRaw(!showRaw)} style={{
                  background: "transparent", border: "1px solid rgba(212,175,55,0.2)",
                  borderRadius: 100, padding: "4px 12px", color: "#7a7060",
                  fontSize: 11, cursor: "pointer", fontFamily: "inherit",
                }}>
                  {showRaw ? "Cleaned" : "Raw"} ↔ {showRaw ? "Raw" : "Cleaned"}
                </button>
              </div>
              <div style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(212,175,55,0.1)",
                borderRadius: 14, padding: "20px 22px",
                maxHeight: 420, overflowY: "auto",
                fontSize: 14, lineHeight: 1.95, color: "#c0b8a8",
                whiteSpace: "pre-wrap", wordBreak: "break-word",
              }}>
                {showRaw ? result.rawText : result.cleanedTranscript}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <button onClick={copyTranscript} style={{
                  padding: "9px 22px", background: "transparent",
                  border: `1.5px solid ${copied ? "rgba(74,222,128,0.4)" : "rgba(212,175,55,0.3)"}`,
                  borderRadius: 100,
                  color: copied ? "#4ade80" : "#d4af37",
                  fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                  transition: "all 0.2s",
                }}>
                  {copied ? "✓ Copied!" : "Copy Transcript"}
                </button>
              </div>
            </div>

          </div>
        )}

        <div ref={bottomRef} />
        <div style={{ textAlign: "center", marginTop: 48, color: "#2e2a24", fontSize: 11 }}>
          Video to Text · Pocket Bible Reference · © NCHOP
        </div>
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder { color: #3a3530; }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.2); border-radius: 2px; }
      `}</style>
    </div>
  );
}
