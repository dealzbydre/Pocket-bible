import Head from "next/head";
import Link from "next/link";
import styles from "../styles/Home.module.css";

const FOUNDERS = [
  {
    name: "Rebecca",
    role: "Co-Lead",
    banner: "#e8503a",
    monogram: "R",
    tags: ["Ohio Native", "Artist + Designer"],
    bio: "Rebecca is passionate about sharing the gospel of Jesus Christ in non-traditional ways and environments. Her inspiration for her art stems not only from her faith, but from her Jamaican heritage and the bold use of color from the 80s and 90s.",
    fun: "Faith, heritage, and fearless color — that's the Rebecca signature.",
  },
  {
    name: "Monica",
    role: "Co-Lead",
    banner: "#f0a92e",
    monogram: "M",
    tags: ["Ohio Native", "Founder of Temple Fuel"],
    bio: "Monica is passionate about helping women find their purpose and develop into who God has called them to be.",
    fun: "Loves weightlifting, music, and a good book!",
  },
];

const TICKER_ITEMS = Array(6).fill(
  "Next Bible Study: Fall dates will be announced soon ✦"
);

export default function Home() {
  return (
    <div className={styles.page}>
      <Head>
        <title>Study Hall — Bible Study &amp; Fellowship in Cincinnati</title>
        <meta
          name="description"
          content="Study Hall brings together like-minded people to strengthen their relationship with God through fellowship and the exploration of His Word — in a friendly, non-traditional setting."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📖</text></svg>"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <meta property="og:title" content="Study Hall — Bible Study & Fellowship" />
        <meta
          property="og:description"
          content="Biblical-centered discussion in a friendly, non-traditional setting. New believers and the curious are warmly welcome."
        />
      </Head>

      <style jsx global>{`
        :root {
          --font-display: "Bricolage Grotesque", "Arial Black", sans-serif;
          --font-body: "Space Grotesk", "Helvetica Neue", Arial, sans-serif;
        }
        html {
          scroll-behavior: smooth;
        }
      `}</style>

      {/* Nav */}
      <nav className={styles.nav}>
        <a href="#top" className={styles.logo}>
          <span className={styles.logoMark}>✦</span> Study Hall
        </a>
        <div className={styles.navLinks}>
          <a href="#mission" className={styles.navLink}>mission</a>
          <a href="#founders" className={styles.navLink}>founders</a>
          <a href="#community" className={styles.navLink}>community</a>
          <a href="#connect" className={styles.navCta}>connect</a>
        </div>
      </nav>

      {/* Announcement ticker */}
      <div className={styles.ticker} aria-label="Next Bible study announcement">
        <div className={styles.tickerTrack}>
          {TICKER_ITEMS.map((t, i) => (
            <span key={i}>{t}</span>
          ))}
          {TICKER_ITEMS.map((t, i) => (
            <span key={`b-${i}`} aria-hidden="true">{t}</span>
          ))}
        </div>
      </div>

      {/* Hero */}
      <header className={styles.hero} id="top">
        <span className={styles.heroStars} style={{ top: "16%", left: "8%" }} aria-hidden="true">✦</span>
        <span className={styles.heroStars} style={{ top: "30%", right: "10%", color: "#14603a" }} aria-hidden="true">✦</span>
        <span className={styles.heroStars} style={{ bottom: "14%", left: "16%", color: "#f0a92e" }} aria-hidden="true">✦</span>

        <div className={styles.heroKicker}>Cincinnati · Bible Study · Fellowship</div>
        <h1 className={styles.heroTitle}>
          Faith, but make it{" "}
          <span className={styles.heroTitleAccent}>fellowship</span>
        </h1>
        <p className={styles.heroSub}>
          Study Hall is a Biblical-centered community for the curious, the new
          believer, and everyone in between — real conversations about God&apos;s
          Word in a friendly, non-traditional setting.
        </p>
        <div className={styles.heroActions}>
          <a href="#mission" className={styles.btnPrimary}>See our mission in action</a>
          <a href="#connect" className={styles.btnSecondary}>Join the next study</a>
        </div>
      </header>

      {/* Mission */}
      <section className={`${styles.section} ${styles.mission}`} id="mission">
        <div className={styles.sectionInner}>
          <div className={styles.missionGrid}>
            <div>
              <span className={styles.eyebrow}>Our Mission</span>
              <h2 className={styles.sectionTitle}>Stronger together, rooted in the Word</h2>
            </div>
            <div>
              <p className={styles.missionText}>
                Our goal is to bring together like-minded individuals to{" "}
                <strong>strengthen their relationship with God</strong> through
                fellowship and the exploration of His Word. We warmly invite new
                believers and those curious about faith to participate in
                Biblical-centered discussions within a{" "}
                <strong>friendly, non-traditional setting</strong>.
              </p>
              <blockquote className={styles.missionVerse}>
                &ldquo;For where two or three gather in my name, there am I with
                them.&rdquo;
                <cite>Matthew 18:20</cite>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* Founders */}
      <section className={styles.section} id="founders">
        <div className={styles.sectionInner}>
          <span className={styles.eyebrow} style={{ color: "#14603a" }}>Meet the Founders</span>
          <h2 className={styles.sectionTitle}>Two friends, one calling</h2>
          <div className={styles.founderGrid}>
            {FOUNDERS.map((f) => (
              <article key={f.name} className={styles.founderCard}>
                <div className={styles.founderBanner} style={{ background: f.banner }}>
                  <span className={styles.founderMonogram} aria-hidden="true">{f.monogram}</span>
                  <h3 className={styles.founderName}>
                    {f.name} <span style={{ fontSize: "0.55em", verticalAlign: "middle" }}>· {f.role}</span>
                  </h3>
                </div>
                <div className={styles.founderBody}>
                  <div className={styles.founderTags}>
                    {f.tags.map((t) => (
                      <span key={t} className={styles.founderTag}>{t}</span>
                    ))}
                  </div>
                  <p className={styles.founderBio}>{f.bio}</p>
                  <p className={styles.founderFun}>✦ {f.fun}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Community */}
      <section className={`${styles.section} ${styles.community}`} id="community">
        <div className={styles.sectionInner}>
          <div className={styles.communityGrid}>
            <div>
              <span className={styles.eyebrow} style={{ color: "#f0a92e" }}>Community</span>
              <h2 className={styles.sectionTitle}>Come as you are</h2>
              <p className={styles.communityCopy}>
                Study Hall isn&apos;t a lecture — it&apos;s a conversation. We gather
                around Scripture, ask honest questions, and grow together. No
                dress code, no prerequisites, no judgment.
              </p>
              <ul className={styles.communityList}>
                <li>Biblical-centered discussion, led with warmth</li>
                <li>New believers and the faith-curious warmly welcome</li>
                <li>A non-traditional setting — think study hall, not sanctuary</li>
                <li>Fall gathering dates announced soon on our socials</li>
              </ul>
            </div>
            <div className={styles.toolCard}>
              <div className={styles.toolKicker}>Free Study Tool</div>
              <h3 className={styles.toolTitle}>The Bible Says</h3>
              <p className={styles.toolDesc}>
                Bring your questions between gatherings. Ask anything — &ldquo;What
                does the Bible say about faith?&rdquo; — or look up a verse in KJV,
                NIV, or The Message, with accuracy notes on every result.
              </p>
              <Link href="/the-bible-says" className={styles.toolBtn}>
                Open The Bible Says →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Connect */}
      <section className={styles.section} id="connect">
        <div className={styles.sectionInner}>
          <span className={styles.eyebrow} style={{ color: "#e8503a" }}>Socials</span>
          <h2 className={styles.sectionTitle}>
            Let&apos;s connect &amp; collaborate
          </h2>
          <div className={styles.connectGrid}>
            <a href="mailto:studyhallcincy@gmail.com" className={styles.connectCard}>
              <span className={styles.connectIcon} style={{ background: "#f0a92e" }}>✉️</span>
              <span className={styles.connectLabel}>Email</span>
              <span className={styles.connectValue}>studyhallcincy@gmail.com</span>
              <span className={styles.connectMeta}>Rebecca, co-lead</span>
            </a>
            <a
              href="https://www.instagram.com/studyhallcincy"
              target="_blank"
              rel="noreferrer"
              className={styles.connectCard}
            >
              <span className={styles.connectIcon} style={{ background: "#e8503a" }}>📸</span>
              <span className={styles.connectLabel}>Instagram</span>
              <span className={styles.connectValue}>@studyhallcincy</span>
              <span className={styles.connectMeta}>Monica, co-lead</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerLogo}>✦ Study Hall</div>
        <div>
          Cincinnati, OH · <a href="mailto:studyhallcincy@gmail.com">studyhallcincy@gmail.com</a>{" "}
          · <a href="https://www.instagram.com/studyhallcincy" target="_blank" rel="noreferrer">@studyhallcincy</a>
        </div>
        <div>
          Next Bible study: fall dates will be announced soon. ·{" "}
          <Link href="/the-bible-says">The Bible Says study tool</Link>
        </div>
        <div>© {new Date().getFullYear()} Study Hall</div>
      </footer>
    </div>
  );
}
