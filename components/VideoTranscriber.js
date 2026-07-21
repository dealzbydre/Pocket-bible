import { useState } from "react";
import Link from "next/link";

export default function VideoTranscriber() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showTimestamps, setShowTimestamps] = useState(false);
  const [copied, setCopied] = useState(false);

  const transcribe = async () => {
    if (!url.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setCopied(false);
    try {
      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setResult(data);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const textForExport = () =>
    showTimestamps && result
      ? result.segments.map((s) => `[${s.start}] ${s.text}`).join("\n")
      : result?.transcript || "";

  const copyTranscript = async () => {
    try {
      await navigator.clipboard.writeText(textForExport());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy to clipboard.");
    }
  };

  const downloadTranscript = () => {
    const blob = new Blob([textForExport()], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(result?.title || "transcript").replace(/[^\w\s-]/g, "").trim() || "transcript"}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const wordCount = result ? result.transcript.split(/\s+/).filter(Boolean).length : 0;

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
          Pocket Bible Tools
        </div>
        <h1 style={{
          margin: 0, fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 700,
          background: "linear-gradient(135deg, #fff8e7, #d4af37, #b8952a)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          Video Transcriber
        </h1>
        <div style={{ marginTop: 12 }}>
          <Link href="/" style={{ color: "#7a7060", fontSize: 13, textDecoration: "underline" }}>
            📖 Back to The Bible Says
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, maxWidth: 720, width: "100%", margin: "0 auto", padding: "24px 16px 40px", boxSizing: "border-box" }}>
        {/* Link input */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1.5px solid rgba(212,175,55,0.2)",
          borderRadius: 18, overflow: "hidden", marginBottom: 24,
        }}>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); transcribe(); } }}
            placeholder="Paste any video link… YouTube, TikTok, Instagram, Facebook, or X"
            style={{
              width: "100%", background: "transparent", border: "none", outline: "none",
              padding: "18px 20px 10px", color: "#f0ebe0",
              fontSize: 16, fontFamily: "inherit", lineHeight: 1.6,
              boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 16px 16px" }}>
            <span style={{ fontSize: 12, color: "#4a4540" }}>
              Pulls the spoken words out of the video
            </span>
            <button onClick={transcribe} disabled={loading || !url.trim()} style={{
              padding: "11px 28px",
              background: loading || !url.trim() ? "rgba(212,175,55,0.15)" : "linear-gradient(135deg, #d4af37, #b8952a)",
              border: "none", borderRadius: 100,
              color: loading || !url.trim() ? "#7a7060" : "#0a0a0f",
              fontWeight: 700, fontSize: 15, cursor: loading || !url.trim() ? "not-allowed" : "pointer",
              letterSpacing: 0.5, fontFamily: "inherit", transition: "all 0.2s",
            }}>
              {loading ? "Transcribing…" : "Transcribe"}
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 14, color: "#d4af37", animation: "spin 2s linear infinite", display: "inline-block" }}>✦</div>
            <p style={{ color: "#7a7060", fontSize: 15 }}>Transcribing the video…</p>
            <p style={{ color: "#4a4540", fontSize: 12, marginTop: 6 }}>
              Speech-to-text can take a minute or two for longer clips.
            </p>
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

        {/* Result */}
        {result && !loading && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1.5px solid rgba(212,175,55,0.18)",
              borderRadius: 16, padding: "22px", marginBottom: 16,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 19, fontWeight: 700, color: "#d4af37", lineHeight: 1.4 }}>{result.title}</span>
                <span style={{
                  padding: "3px 10px", borderRadius: 100,
                  background: result.source === "captions" ? "#14532d55" : "#78350f55",
                  color: result.source === "captions" ? "#4ade80" : "#fcd34d",
                  fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
                }}>
                  {result.source === "captions" ? "From captions" : "🎙 Speech-to-text"}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "#7a7060", marginBottom: 16 }}>
                {result.platform && <span>{result.platform} · </span>}
                {result.author && <span>{result.author} · </span>}
                {result.language && <span>{result.language} · </span>}
                {wordCount.toLocaleString()} words
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
                <button onClick={copyTranscript} style={{
                  padding: "8px 18px", borderRadius: 100,
                  border: "1.5px solid rgba(212,175,55,0.35)", background: "transparent",
                  color: "#d4af37", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}>
                  {copied ? "✓ Copied" : "Copy text"}
                </button>
                <button onClick={downloadTranscript} style={{
                  padding: "8px 18px", borderRadius: 100,
                  border: "1.5px solid rgba(212,175,55,0.35)", background: "transparent",
                  color: "#d4af37", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}>
                  Download .txt
                </button>
                <button onClick={() => setShowTimestamps((t) => !t)} style={{
                  padding: "8px 18px", borderRadius: 100,
                  border: showTimestamps ? "1.5px solid #d4af37" : "1.5px solid rgba(212,175,55,0.2)",
                  background: showTimestamps ? "rgba(212,175,55,0.15)" : "transparent",
                  color: showTimestamps ? "#d4af37" : "#7a7060",
                  fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}>
                  Timestamps {showTimestamps ? "on" : "off"}
                </button>
              </div>

              {/* Transcript */}
              {showTimestamps ? (
                <div style={{ maxHeight: 500, overflowY: "auto", paddingRight: 6 }}>
                  {result.segments.map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, marginBottom: 8, fontSize: 15, lineHeight: 1.7 }}>
                      <span style={{ color: "#d4af37", fontSize: 12, minWidth: 48, paddingTop: 3, fontVariantNumeric: "tabular-nums" }}>
                        {s.start}
                      </span>
                      <span style={{ color: "#f0ebe0" }}>{s.text}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{
                  margin: 0, fontSize: 16, lineHeight: 1.9, color: "#f0ebe0",
                  maxHeight: 500, overflowY: "auto", paddingRight: 6, whiteSpace: "pre-wrap",
                }}>
                  {result.transcript}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!result && !loading && !error && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#4a4540" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🎬</div>
            <p style={{ fontSize: 15, lineHeight: 1.7, maxWidth: 420, margin: "0 auto" }}>
              Paste a link from <strong style={{ color: "#d4af37" }}>YouTube, TikTok, Instagram, Facebook, or X</strong> and
              tap Transcribe to turn the spoken words into text you can read, copy, or download.
            </p>
            <p style={{ fontSize: 12, marginTop: 16, color: "#3a3530", maxWidth: 420, margin: "16px auto 0" }}>
              YouTube uses free captions when available; other platforms are transcribed with speech-to-text.
            </p>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 40, color: "#2e2a24", fontSize: 11 }}>
          Video Transcriber · Pocket Bible Tools © NCHOP
        </div>
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder { color: #3a3530; }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  );
}
