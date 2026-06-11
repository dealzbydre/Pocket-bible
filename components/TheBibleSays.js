import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const VERSIONS = [
  { id: "KJV", label: "King James Version" },
  { id: "NIV", label: "New International Version" },
  { id: "MSG", label: "The Message" },
];

export default function TheBibleSays() {
  const [query, setQuery] = useState("");
  const [version, setVersion] = useState("KJV");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (response && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [response]);

  const search = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const res = await fetch("/api/bible", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, version }),
      });
      const parsed = await res.json();
      if (!res.ok) throw new Error(parsed.error || "Request failed");
      setResponse(parsed);
      setHistory((h) => [{ query, version, parsed }, ...h.slice(0, 5)]);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const confidenceBadge = (c) => {
    const map = {
      high: { bg: "#14532d", color: "#4ade80", label: "✓ Verified High Accuracy" },
      moderate: { bg: "#78350f", color: "#fcd34d", label: "⚠ Moderate — Please Verify" },
      low: { bg: "#7f1d1d", color: "#fca5a5", label: "⚠ Low — Verify at BibleGateway" },
    };
    return map[c] || map.moderate;
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
        padding: "28px 24px 20px",
        textAlign: "center",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ fontSize: 11, letterSpacing: 5, color: "#d4af37", textTransform: "uppercase", marginBottom: 6 }}>
          Pocket Bible Reference
        </div>
        <h1 style={{
          margin: 0, fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 700,
          background: "linear-gradient(135deg, #fff8e7, #d4af37, #b8952a)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          The Bible Says
        </h1>
        {/* Version tabs */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 16, flexWrap: "wrap" }}>
          {VERSIONS.map((v) => (
            <button key={v.id} onClick={() => setVersion(v.id)} style={{
              padding: "7px 16px", borderRadius: 100,
              border: version === v.id ? "1.5px solid #d4af37" : "1.5px solid rgba(212,175,55,0.2)",
              background: version === v.id ? "rgba(212,175,55,0.15)" : "transparent",
              color: version === v.id ? "#d4af37" : "#7a7060",
              fontSize: 13, fontWeight: version === v.id ? 700 : 400,
              cursor: "pointer", letterSpacing: 0.5,
              transition: "all 0.2s",
              fontFamily: "inherit",
            }}>
              {v.id}
            </button>
          ))}
        </div>
        {/* Tool nav */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 12, flexWrap: "wrap" }}>
          <span style={{
            padding: "5px 14px", borderRadius: 100,
            border: "1.5px solid #d4af37",
            background: "rgba(212,175,55,0.15)",
            color: "#d4af37",
            fontSize: 12, fontWeight: 700, letterSpacing: 0.5,
          }}>
            Bible Search
          </span>
          <Link href="/image-extractor" style={{
            padding: "5px 14px", borderRadius: 100,
            border: "1.5px solid rgba(212,175,55,0.2)",
            background: "transparent",
            color: "#7a7060",
            fontSize: 12, fontWeight: 400, letterSpacing: 0.5,
            textDecoration: "none", display: "inline-block",
          }}>
            Image Extractor
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, maxWidth: 720, width: "100%", margin: "0 auto", padding: "24px 16px 40px", boxSizing: "border-box" }}>
        {/* Search */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1.5px solid rgba(212,175,55,0.2)",
          borderRadius: 18, overflow: "hidden", marginBottom: 24,
        }}>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); search(); } }}
            placeholder='Ask anything... "What does the Bible say about faith?" or "John 3:16"'
            rows={3}
            style={{
              width: "100%", background: "transparent", border: "none", outline: "none",
              padding: "18px 20px 10px", color: "#f0ebe0",
              fontSize: 16, fontFamily: "inherit", resize: "none", lineHeight: 1.6,
              boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 16px 16px" }}>
            <span style={{ fontSize: 12, color: "#4a4540" }}>
              {version} · {VERSIONS.find(v => v.id === version)?.label}
            </span>
            <button onClick={search} disabled={loading || !query.trim()} style={{
              padding: "11px 28px",
              background: loading || !query.trim() ? "rgba(212,175,55,0.15)" : "linear-gradient(135deg, #d4af37, #b8952a)",
              border: "none", borderRadius: 100,
              color: loading || !query.trim() ? "#7a7060" : "#0a0a0f",
              fontWeight: 700, fontSize: 15, cursor: loading || !query.trim() ? "not-allowed" : "pointer",
              letterSpacing: 0.5, fontFamily: "inherit", transition: "all 0.2s",
            }}>
              {loading ? "Searching…" : "Search"}
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 14, color: "#d4af37", animation: "spin 2s linear infinite", display: "inline-block" }}>✦</div>
            <p style={{ color: "#7a7060", fontSize: 15 }}>Searching the scriptures…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 12, padding: "14px 18px", color: "#fca5a5", fontSize: 14, marginBottom: 20,
          }}>
            ⚠ {error}
          </div>
        )}

        {/* Results */}
        {response && !loading && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            {response.verses?.map((v, i) => {
              const badge = confidenceBadge(v.confidence);
              return (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1.5px solid rgba(212,175,55,0.18)",
                  borderRadius: 16, padding: "22px 22px 18px", marginBottom: 16,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: "#d4af37" }}>{v.reference}</span>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 100, background: "rgba(212,175,55,0.12)", color: "#d4af37", fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>
                        {v.version || version}
                      </span>
                      <span style={{ padding: "3px 10px", borderRadius: 100, background: badge.bg + "55", color: badge.color, fontSize: 11, fontWeight: 600 }}>
                        {badge.label}
                      </span>
                    </div>
                  </div>
                  <blockquote style={{
                    margin: 0, borderLeft: "3px solid #d4af37", paddingLeft: 16,
                    fontSize: 17, lineHeight: 1.85, color: "#f0ebe0", fontStyle: "italic",
                  }}>
                    &ldquo;{v.text}&rdquo;
                  </blockquote>
                  {v.accuracyNote && (
                    <div style={{
                      marginTop: 14, padding: "10px 14px",
                      background: "rgba(245,158,11,0.07)", borderRadius: 8,
                      border: "1px solid rgba(245,158,11,0.2)",
                      color: "#fcd34d", fontSize: 13, lineHeight: 1.6,
                    }}>
                      ⚠️ <strong>Accuracy Note:</strong> {v.accuracyNote}{" "}
                      <a href="https://www.biblegateway.com" target="_blank" rel="noreferrer"
                        style={{ color: "#d4af37", textDecoration: "underline" }}>
                        Verify at BibleGateway →
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
            {response.context && (
              <div style={{
                background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.12)",
                borderRadius: 12, padding: "16px 20px", marginBottom: 14,
              }}>
                <div style={{ fontSize: 10, letterSpacing: 3, color: "#d4af37", textTransform: "uppercase", marginBottom: 8 }}>Context</div>
                <p style={{ margin: 0, color: "#c0b8a8", fontSize: 14, lineHeight: 1.7 }}>{response.context}</p>
              </div>
            )}
            {response.suggestion && (
              <div style={{
                background: "rgba(255,255,255,0.02)", borderRadius: 10,
                padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-start",
              }}>
                <span style={{ fontSize: 18 }}>📖</span>
                <p style={{ margin: 0, color: "#7a7060", fontSize: 13, lineHeight: 1.6 }}>
                  <strong style={{ color: "#a89880" }}>Dig Deeper: </strong>{response.suggestion}
                </p>
              </div>
            )}
          </div>
        )}

        {/* History */}
        {history.length > 0 && !loading && (
          <div style={{ marginTop: 36 }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#4a4540", textTransform: "uppercase", marginBottom: 10 }}>Recent Searches</div>
            {history.map((h, i) => (
              <button key={i} onClick={() => { setQuery(h.query); setVersion(h.version); setResponse(h.parsed); }}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: 10, padding: "10px 14px", marginBottom: 6,
                  color: "#7a7060", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                }}>
                <span style={{ color: "#d4af37", marginRight: 8 }}>[{h.version}]</span>{h.query}
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!response && !loading && !error && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#4a4540" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📖</div>
            <p style={{ fontSize: 15, lineHeight: 1.7, maxWidth: 400, margin: "0 auto" }}>
              Type a question or scripture reference above and tap <strong style={{ color: "#d4af37" }}>Search</strong> to find what the Bible says.
            </p>
            <div style={{ marginTop: 24, display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              {["What does the Bible say about faith?", "Psalm 23", "Romans 8:28", "What does the Bible say about peace?"].map((s) => (
                <button key={s} onClick={() => setQuery(s)} style={{
                  padding: "8px 14px", borderRadius: 100,
                  border: "1px solid rgba(212,175,55,0.2)", background: "transparent",
                  color: "#7a7060", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
        <div style={{ textAlign: "center", marginTop: 40, color: "#2e2a24", fontSize: 11 }}>
          Always verify important passages at{" "}
          <a href="https://www.biblegateway.com" target="_blank" rel="noreferrer" style={{ color: "#4a4540" }}>BibleGateway.com</a>
          {" "}· The Bible Says © NCHOP
        </div>
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        textarea::placeholder { color: #3a3530; }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  );
}
