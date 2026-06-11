import { useState, useRef, useCallback } from "react";
import Link from "next/link";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export default function ImageTextExtractor() {
  const [imagePreview, setImagePreview] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);
  const resultRef = useRef(null);

  const processFile = (file) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Please upload a JPEG, PNG, GIF, or WebP image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10MB.");
      return;
    }
    setError(null);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setImagePreview(dataUrl);
      const base64 = dataUrl.split(",")[1];
      setImageData(base64);
      setMediaType(file.type);
    };
    reader.readAsDataURL(file);
  };

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, []);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const extract = async () => {
    if (!imageData || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/extract-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData, mediaType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Extraction failed");
      setResult(data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch {
      setError("Could not extract text. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyText = () => {
    if (!result?.extractedText) return;
    navigator.clipboard.writeText(result.extractedText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const reset = () => {
    setImagePreview(null);
    setImageData(null);
    setMediaType(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
          Pocket Bible Tools
        </div>
        <h1 style={{
          margin: 0, fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 700,
          background: "linear-gradient(135deg, #fff8e7, #d4af37, #b8952a)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          Image Text Extractor
        </h1>
        <p style={{ margin: "8px 0 0", color: "#7a7060", fontSize: 13 }}>
          Upload a social media screenshot to extract its text
        </p>
        {/* Nav */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 14 }}>
          <Link href="/" style={{
            padding: "7px 16px", borderRadius: 100,
            border: "1.5px solid rgba(212,175,55,0.2)",
            background: "transparent",
            color: "#7a7060",
            fontSize: 13, fontWeight: 400,
            cursor: "pointer", letterSpacing: 0.5,
            textDecoration: "none",
            display: "inline-block",
          }}>
            Bible Search
          </Link>
          <span style={{
            padding: "7px 16px", borderRadius: 100,
            border: "1.5px solid #d4af37",
            background: "rgba(212,175,55,0.15)",
            color: "#d4af37",
            fontSize: 13, fontWeight: 700,
            letterSpacing: 0.5,
          }}>
            Image Extractor
          </span>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, maxWidth: 720, width: "100%", margin: "0 auto", padding: "24px 16px 40px", boxSizing: "border-box" }}>

        {/* Drop zone */}
        <div
          onClick={() => !imagePreview && fileInputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          style={{
            border: dragging
              ? "2px dashed #d4af37"
              : imagePreview
              ? "1.5px solid rgba(212,175,55,0.3)"
              : "2px dashed rgba(212,175,55,0.25)",
            borderRadius: 18,
            background: dragging ? "rgba(212,175,55,0.06)" : "rgba(255,255,255,0.02)",
            transition: "all 0.2s",
            overflow: "hidden",
            cursor: imagePreview ? "default" : "pointer",
            marginBottom: 20,
          }}
        >
          {imagePreview ? (
            <div style={{ position: "relative" }}>
              <img
                src={imagePreview}
                alt="Uploaded"
                style={{ width: "100%", maxHeight: 400, objectFit: "contain", display: "block" }}
              />
              <button
                onClick={(e) => { e.stopPropagation(); reset(); }}
                style={{
                  position: "absolute", top: 12, right: 12,
                  background: "rgba(10,10,15,0.85)",
                  border: "1px solid rgba(212,175,55,0.3)",
                  borderRadius: 100, color: "#d4af37",
                  padding: "5px 12px", fontSize: 12, cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Remove
              </button>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "48px 24px" }}>
              <div style={{ fontSize: 40, marginBottom: 14, color: "#d4af37", opacity: 0.5 }}>📷</div>
              <p style={{ margin: 0, color: "#7a7060", fontSize: 15, lineHeight: 1.7 }}>
                Drag & drop an image here, or{" "}
                <span style={{ color: "#d4af37", textDecoration: "underline" }}>click to browse</span>
              </p>
              <p style={{ margin: "8px 0 0", color: "#3a3530", fontSize: 12 }}>
                JPEG, PNG, GIF, WebP — up to 10MB
              </p>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={onFileChange}
          style={{ display: "none" }}
        />

        {/* Extract button */}
        {imagePreview && (
          <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
            <button
              onClick={extract}
              disabled={loading}
              style={{
                flex: 1,
                padding: "13px 28px",
                background: loading ? "rgba(212,175,55,0.15)" : "linear-gradient(135deg, #d4af37, #b8952a)",
                border: "none", borderRadius: 100,
                color: loading ? "#7a7060" : "#0a0a0f",
                fontWeight: 700, fontSize: 15,
                cursor: loading ? "not-allowed" : "pointer",
                letterSpacing: 0.5, fontFamily: "inherit", transition: "all 0.2s",
              }}
            >
              {loading ? "Extracting…" : "Extract Text"}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: "13px 20px",
                background: "transparent",
                border: "1.5px solid rgba(212,175,55,0.25)",
                borderRadius: 100, color: "#7a7060",
                fontSize: 14, cursor: "pointer",
                fontFamily: "inherit", transition: "all 0.2s",
              }}
            >
              Change
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 14, color: "#d4af37", animation: "spin 2s linear infinite", display: "inline-block" }}>✦</div>
            <p style={{ color: "#7a7060", fontSize: 15 }}>Reading the image…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 12, padding: "14px 18px", color: "#fca5a5", fontSize: 14, marginBottom: 20,
          }}>
            {error}
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div ref={resultRef} style={{ animation: "fadeUp 0.4s ease" }}>
            {/* Platform + Summary */}
            {(result.platform || result.summary) && (
              <div style={{
                background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.12)",
                borderRadius: 12, padding: "16px 20px", marginBottom: 16,
              }}>
                {result.platform && result.platform !== "Unknown" && (
                  <span style={{
                    display: "inline-block", marginBottom: 8,
                    padding: "3px 10px", borderRadius: 100,
                    background: "rgba(212,175,55,0.12)", color: "#d4af37",
                    fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
                  }}>
                    {result.platform}
                  </span>
                )}
                {result.summary && (
                  <p style={{ margin: 0, color: "#c0b8a8", fontSize: 14, lineHeight: 1.7 }}>{result.summary}</p>
                )}
              </div>
            )}

            {/* Text blocks */}
            {result.textBlocks?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, letterSpacing: 3, color: "#d4af37", textTransform: "uppercase", marginBottom: 10 }}>
                  Text Sections
                </div>
                {result.textBlocks.map((block, i) => (
                  <div key={i} style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1.5px solid rgba(212,175,55,0.18)",
                    borderRadius: 12, padding: "16px 18px", marginBottom: 10,
                  }}>
                    {block.label && (
                      <div style={{ fontSize: 10, letterSpacing: 2, color: "#7a7060", textTransform: "uppercase", marginBottom: 8 }}>
                        {block.label}
                      </div>
                    )}
                    <p style={{ margin: 0, color: "#f0ebe0", fontSize: 15, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                      {block.content}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Full extracted text */}
            {result.extractedText && (
              <div style={{
                background: "rgba(255,255,255,0.03)",
                border: "1.5px solid rgba(212,175,55,0.18)",
                borderRadius: 16, overflow: "hidden", marginBottom: 16,
              }}>
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "14px 18px 10px",
                  borderBottom: "1px solid rgba(212,175,55,0.1)",
                }}>
                  <span style={{ fontSize: 10, letterSpacing: 3, color: "#d4af37", textTransform: "uppercase" }}>
                    Full Extracted Text
                  </span>
                  <button
                    onClick={copyText}
                    style={{
                      padding: "5px 14px", borderRadius: 100,
                      border: "1px solid rgba(212,175,55,0.3)",
                      background: copied ? "rgba(212,175,55,0.15)" : "transparent",
                      color: copied ? "#d4af37" : "#7a7060",
                      fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                      transition: "all 0.2s",
                    }}
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div style={{ padding: "16px 18px" }}>
                  <p style={{ margin: 0, color: "#f0ebe0", fontSize: 15, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>
                    {result.extractedText}
                  </p>
                </div>
              </div>
            )}

            {/* Extract another */}
            <button
              onClick={reset}
              style={{
                width: "100%", padding: "12px",
                background: "transparent",
                border: "1px solid rgba(212,175,55,0.2)",
                borderRadius: 12, color: "#7a7060",
                fontSize: 14, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Extract from another image
            </button>
          </div>
        )}

        {/* Empty state */}
        {!imagePreview && !loading && !error && (
          <div style={{ textAlign: "center", padding: "16px 20px 0", color: "#4a4540" }}>
            <p style={{ fontSize: 14, lineHeight: 1.7, maxWidth: 400, margin: "0 auto" }}>
              Upload any screenshot — a tweet, Instagram post, Facebook update, text overlay, meme, or flyer — and the text inside will be extracted instantly.
            </p>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 48, color: "#2e2a24", fontSize: 11 }}>
          Powered by Claude Vision · The Bible Says © NCHOP
        </div>
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  );
}
