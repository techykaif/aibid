import Link from "next/link";
import Leaderboard from "./components/Leaderboard";

export const revalidate = 15;

export default function Home() {
  return (
    <main className="shell">
      <nav className="nav" aria-label="Primary navigation">
        <Link className="brand" href="/" aria-label="Ai-Bid home">
          <img src="/logo.svg" alt="" />
          <span className="brand-name">Ai-Bid</span>
        </Link>
        <div className="navlinks">
          <Link className="nav-link" href="/today">Today</Link>
          <Link className="button primary" href="/submit">List your AI <span aria-hidden="true">→</span></Link>
        </div>
      </nav>

      <div className="demo-banner" role="status">
        <span className="status-dot" />
        <b>PREVIEW MARKET</b>
        <span>Payments are disabled until the production credentials are connected.</span>
      </div>

      <header className="hero">
        <div className="hero-copy">
          <div className="eyebrow">THE VISIBILITY MARKET FOR AI</div>
          <h1>Build it.<br /><span>Bid it.</span> Be seen.</h1>
          <p>
            A public market for AI products. Put your product on the board, bid for position,
            and let real demand decide who gets attention.
          </p>
          <div className="hero-actions">
            <Link className="button primary button-lg" href="/submit">List your AI <span aria-hidden="true">→</span></Link>
            <Link className="button button-lg" href="/today">Explore today <span aria-hidden="true">↗</span></Link>
          </div>
        </div>

        <div className="market-preview" aria-label="Market snapshot">
          <div className="preview-head">
            <span><i className="live-dot" /> Market snapshot</span>
            <span className="mono">LIVE</span>
          </div>
          <div className="preview-chart" aria-hidden="true">
            <span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span />
          </div>
          <div className="preview-main">
            <div><span className="metric-label">Total bid volume</span><strong>$8.56k</strong></div>
            <span className="trend">↑ 18.4%</span>
          </div>
          <div className="preview-grid">
            <div><span className="metric-label">Products</span><strong>1,240+</strong></div>
            <div><span className="metric-label">Categories</span><strong>07</strong></div>
            <div><span className="metric-label">Minimum</span><strong>$5</strong></div>
          </div>
          <div className="preview-note">Rankings are driven by confirmed cumulative bids.</div>
        </div>
      </header>

      <div className="ticker">
        <span className="live-dot" />
        <b>LIVE MARKET</b>
        <span className="ticker-sep">/</span>
        <span>Rankings are driven by confirmed cumulative bids</span>
        <span className="ticker-right">24/7</span>
      </div>

      <section className="market-section">
        <div className="boardhead">
          <div>
            <div className="section-kicker">MARKET / ALL TIME</div>
            <strong>All-time leaderboard</strong>
            <div className="muted">The more confirmed bids a product earns, the higher it ranks.</div>
          </div>
          <Link className="button" href="/submit">Submit a product <span aria-hidden="true">→</span></Link>
        </div>
        <Leaderboard />
      </section>

      <section className="closing-grid">
        <div>
          <div className="section-kicker">WHY AI-BID</div>
          <h2>Attention should be<br />earned in public.</h2>
        </div>
        <div className="closing-copy">
          <p>One board. Seven categories. A simple ranking signal. No opaque recommendation engine deciding which builder gets seen.</p>
          <Link className="text-link" href="/submit">Put your product on the market <span>→</span></Link>
        </div>
      </section>

      <footer className="footer">
        <span>Ai-Bid</span>
        <span>Discover · Bid · Be seen</span>
        <span>One-time bids · Non-refundable</span>
      </footer>
    </main>
  );
}
