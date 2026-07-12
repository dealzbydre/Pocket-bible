import Head from "next/head";
import Link from "next/link";
import TheBibleSays from "../components/TheBibleSays";

export default function TheBibleSaysPage() {
  return (
    <>
      <Head>
        <title>The Bible Says — Study Hall</title>
        <meta
          name="description"
          content="Ask anything or look up a verse in KJV, NIV, or The Message — a free study tool from Study Hall."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📖</text></svg>"
        />
      </Head>
      <Link
        href="/"
        style={{
          position: "fixed",
          top: 12,
          left: 12,
          zIndex: 100,
          padding: "8px 16px",
          borderRadius: 100,
          background: "rgba(212,175,55,0.12)",
          border: "1px solid rgba(212,175,55,0.35)",
          color: "#d4af37",
          fontSize: 13,
          fontWeight: 600,
          fontFamily: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
        }}
      >
        ← Study Hall
      </Link>
      <TheBibleSays />
    </>
  );
}
