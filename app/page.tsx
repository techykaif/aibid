import Link from "next/link";
import Leaderboard from "./components/Leaderboard";

export default function Home() {
  return <main className="shell">
    <nav className="nav"><Link className="brand" href="/"><img src="/logo.svg" alt=""/>Ai<span>-Bid</span></Link><div className="navlinks"><Link className="button" href="/today">Today</Link><Link className="button primary" href="/submit">List your AI →</Link></div></nav>
    <header className="hero"><div className="eyebrow">THE VISIBILITY MARKET FOR AI</div><h1>Build it.<br/><em>Bid it.</em> Be seen.</h1><p>Ai-Bid is the public attention market for AI products. Put your product on the board, bid for position, and let the leaderboard tell the story.</p><div className="stats"><div className="stat"><b>$5</b> to enter</div><div className="stat"><b>7</b> AI categories</div><div className="stat"><b>24/7</b> live competition</div></div></header>
    <div className="ticker">● <b>LIVE MARKET</b> · rankings are driven by confirmed cumulative bids</div>
    <div className="boardhead"><div><strong>All-time leaderboard</strong><div className="muted">The more you bid, the higher you climb.</div></div><Link className="button primary" href="/submit">+ Submit & bid</Link></div>
    <Leaderboard />
    <footer className="footer">Ai-Bid · Discover. Bid. Win. · One-time bids · Non-refundable</footer>
  </main>;
}