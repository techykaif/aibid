import type { Metadata } from "next";
import Link from "next/link";
import { db, isFirebaseConfigured } from "@/lib/firebase-admin";
import Leaderboard from "./components/Leaderboard";
import SiteHeader from "./components/SiteHeader";

const SITE_URL = "https://www.ai-bid.lol";
const SITE_TITLE = "Ai-Bid — The visibility market for AI";
const SITE_DESCRIPTION = "Discover AI products, bid for attention, and climb the public visibility market on confirmed bid volume.";

export const metadata: Metadata = {
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Ai-Bid",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "en_US",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: SITE_TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/opengraph-image"],
  },
};

export const revalidate = 15;

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Ai-Bid",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.svg`,
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Ai-Bid",
  alternateName: "Ai Bid",
  url: SITE_URL,
  description: SITE_DESCRIPTION,
};

async function getMarketStats() {
  if (!isFirebaseConfigured) return null;

  try {
    const snapshot = await db.collection("stats").doc("global").get();
    const data = snapshot.data() || {};
    return {
      totalRevenueUSD: Number(data.totalRevenueUSD || 0),
      totalProducts: Number(data.totalProducts || 0),
      totalBids: Number(data.totalBids || 0),
    };
  } catch {
    return null;
  }
}

const numberFormatter = new Intl.NumberFormat("en-US");
const moneyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default async function Home() {
  const stats = await getMarketStats();

  return <main className="shell">
    <SiteHeader />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
    {!isFirebaseConfigured && <div className="demo-banner" role="status"><span className="status-dot"/><b>MARKET NOT CONNECTED</b><span>Payments and live rankings are disabled until production credentials are connected.</span></div>}
    <header className="hero">
      <div className="hero-copy">
        <div className="eyebrow">THE VISIBILITY MARKET FOR AI</div>
        <h1>Build it.<br/><span>Bid it.</span> Be seen.</h1>
        <p>A public leaderboard where AI products compete for attention. List your product, put real money behind it, and climb through the market on confirmed bid volume.</p>
        <div className="hero-actions"><Link className="button primary button-lg" href="/submit">List your product <span>→</span></Link><Link className="button button-lg" href="/today">See today&apos;s market <span>→</span></Link></div>
      </div>
    </header>

    <section className="ticker" aria-label="Ai-Bid market statistics">
      <b>MARKET STATS</b><span className="ticker-sep">/</span>
      {stats ? <><span>{moneyFormatter.format(stats.totalRevenueUSD)} bid volume</span><span className="ticker-sep">/</span><span>{numberFormatter.format(stats.totalProducts)} products</span><span className="ticker-sep">/</span><span>{numberFormatter.format(stats.totalBids)} confirmed bids</span></> : <span>Temporarily unavailable</span>}
      <span className="ticker-right">15s refresh</span>
    </section>

    <section className="market-primer" aria-label="How Ai-Bid works">
      <div className="primer-label"><span>THE MARKET, IN 3 MOVES</span><span>Simple rules. Public signal.</span></div>
      <div className="primer-steps">
        <div className="primer-step"><span className="step-number">01</span><div><strong>List your product</strong><p>Submit your AI product with a $5 minimum starting bid.</p></div></div>
        <div className="primer-step"><span className="step-number">02</span><div><strong>Bid for attention</strong><p>Every confirmed bid adds to your product&apos;s public total.</p></div></div>
        <div className="primer-step"><span className="step-number">03</span><div><strong>Climb the board</strong><p>Higher cumulative bids mean a higher place in the market.</p></div></div>
      </div>
    </section>

    <div className="ticker"><span className="status-dot"/><b>MARKET STATUS</b><span className="ticker-sep">/</span><span>{isFirebaseConfigured ? "Live rankings · confirmed bids only" : "Waiting for the production market connection"}</span><span className="ticker-right">24/7</span></div>
    <section className="market-section" id="categories">
      <div className="boardhead"><div><div className="board-label">MARKET / ALL TIME</div><strong>AI leaderboard</strong><div className="muted">The more confirmed bids a product earns, the higher it ranks in its category.</div></div><Link className="button" href="/submit">Submit a product <span>→</span></Link></div>
      <Leaderboard />
    </section>
    <section className="closing-grid" id="how-it-works"><div><div className="board-label">WHY AI-BID</div><h2>Attention should be<br/>earned in public.</h2></div><div className="closing-copy"><p>One launch market. Seven categories. One simple ranking signal. No opaque recommendation engine deciding which AI builder gets seen.</p><Link className="text-link" href="/submit">Put your product on the market <span>→</span></Link></div></section>
    <footer className="footer">
      <span>Ai-Bid</span>
      <span><Link href="/legal/terms">Terms</Link> · <Link href="/legal/privacy">Privacy</Link> · <Link href="/legal/rules">Rules</Link> · <Link href="/legal/faq">FAQ</Link></span>
      <span>One-time bids · Non-refundable</span>
    </footer>
  </main>;
}
