import Link from "next/link";
import Leaderboard from "./components/Leaderboard";
import SiteHeader from "./components/SiteHeader";

export const revalidate = 15;

export default function Home() {
  return <main className="shell">
    <SiteHeader />
    <div className="demo-banner" role="status"><span className="status-dot"/><b>PREVIEW MARKET</b><span>Payments are disabled until production credentials are connected.</span></div>
    <header className="hero">
      <div className="hero-copy">
        <div className="eyebrow">THE VISIBILITY MARKET FOR AI</div>
        <h1>Build it.<br/><span>Bid it.</span> Be seen.</h1>
        <p>A public leaderboard where AI products compete for attention. List your product, put real money behind it, and climb through the market on confirmed bid volume.</p>
        <div className="hero-actions"><Link className="button primary button-lg" href="/submit">List your AI <span>→</span></Link><Link className="button button-lg" href="/today">See today&apos;s market <span>↗</span></Link></div>
      </div>
      <div className="market-preview" aria-label="Market snapshot">
        <div className="preview-head"><span><i className="live-dot"/> Market snapshot</span><span className="mono">PREVIEW</span></div>
        <div className="preview-chart" aria-hidden="true">{Array.from({length:12},(_,i)=><span key={i}/>)}</div>
        <div className="preview-main"><div><span className="metric-label">Total bid volume</span><strong>$8.56k</strong></div><span className="trend">↑ 18.4%</span></div>
        <div className="preview-grid"><div><span className="metric-label">Products</span><strong>1,240+</strong></div><div><span className="metric-label">Categories</span><strong>07</strong></div><div><span className="metric-label">Minimum</span><strong>$5</strong></div></div>
        <div className="preview-note">Preview figures shown until the live market is connected.</div>
      </div>
    </header>

    <section className="market-primer" aria-label="How Ai-Bid works">
      <div className="primer-label"><span className="section-kicker">THE MARKET, IN 3 MOVES</span><span>Simple rules. Public signal.</span></div>
      <div className="primer-steps">
        <div className="primer-step"><span className="step-number">01</span><div><strong>List your product</strong><p>Submit your AI product with a $5 minimum starting bid.</p></div></div>
        <div className="primer-step"><span className="step-number">02</span><div><strong>Bid for attention</strong><p>Every confirmed bid adds to your product&apos;s public total.</p></div></div>
        <div className="primer-step"><span className="step-number">03</span><div><strong>Climb the board</strong><p>Higher cumulative bids mean a higher place in the market.</p></div></div>
      </div>
    </section>

    <div className="ticker"><span className="status-dot"/><b>MARKET STATUS</b><span className="ticker-sep">/</span><span>Preview data · rankings will use confirmed bids</span><span className="ticker-right">24/7</span></div>
    <section className="market-section" id="categories">
      <div className="boardhead"><div><div className="section-kicker">MARKET / ALL TIME</div><strong>All-time leaderboard</strong><div className="muted">The more confirmed bids a product earns, the higher it ranks.</div></div><Link className="button" href="/submit">Submit a product <span>→</span></Link></div>
      <Leaderboard />
    </section>
    <section className="closing-grid" id="how-it-works"><div><div className="section-kicker">WHY AI-BID</div><h2>Attention should be<br/>earned in public.</h2></div><div className="closing-copy"><p>One board. Seven categories. A simple ranking signal. No opaque recommendation engine deciding which builder gets seen.</p><Link className="text-link" href="/submit">Put your product on the market <span>→</span></Link></div></section>
    <footer className="footer"><span>Ai-Bid</span><span>Discover · Bid · Be seen</span><span>One-time bids · Non-refundable</span></footer>
  </main>;
}
