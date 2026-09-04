import Link from "next/link";
import Leaderboard from "./components/Leaderboard";

export default function Home() {
  return <main className="shell">
    <nav className="nav"><div className="brand">ai-bid<span>.lol</span></div><div className="navlinks"><Link className="button" href="/submit">List your AI</Link></div></nav>
    <header className="hero">
      <div className="eyebrow">The AI visibility game</div>
      <h1>Outbid the AI world.</h1>
      <p>Pay to climb. Get seen. Stay on top. The public leaderboard for AI tools and AI-built products.</p>
      <div className="stats"><div className="stat"><b>$5</b> minimum to list</div><div className="stat"><b>7</b> categories</div><div className="stat"><b>24/7</b> competition</div></div>
    </header>
    <div className="ticker">⚡ <b>Live board</b> · rankings refresh automatically · highest cumulative bid wins</div>
    <div className="boardhead"><div><strong>Leaderboard</strong><div className="muted">All-time cumulative bids</div></div><Link className="button primary" href="/submit">+ Submit & bid</Link></div>
    <Leaderboard />
    <div className="footer">ai-bid.lol · One-time payments · Bids are non-refundable</div>
  </main>;
}