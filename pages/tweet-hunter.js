import Head from "next/head";
import TweetForge from "../components/TweetForge";

export default function TweetHunterPage() {
  return (
    <>
      <Head>
        <title>TweetForge — AI-Powered X Growth Studio</title>
        <meta name="description" content="Generate, schedule, and post viral tweets with AI." />
      </Head>
      <TweetForge />
    </>
  );
}
