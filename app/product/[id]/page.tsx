import { notFound } from "next/navigation";
import { db, isFirebaseConfigured } from "@/lib/firebase-admin";
import { CATEGORIES, type Product } from "@/lib/types";
import BidForm from "@/app/components/BidForm";
import SiteHeader from "@/app/components/SiteHeader";

export const revalidate = 30;

const publicProduct = (id: string, data: FirebaseFirestore.DocumentData): Product => ({
  id,
  name: String(data.name || ""),
  url: String(data.url || ""),
  tagline: String(data.tagline || ""),
  description: data.description ? String(data.description) : undefined,
  category: data.category,
  logoUrl: data.logoUrl,
  twitterHandle: data.twitterHandle,
  totalBidUSD: Number(data.totalBidUSD || 0),
  bidCount: Number(data.bidCount || 0),
  clicks: Number(data.clicks || 0),
  status: data.status,
  createdAt: data.createdAt,
  lastBidAt: data.lastBidAt,
});

const unavailable = () => <main className="shell"><SiteHeader/><section className="empty" style={{ marginTop: 80 }}><div className="empty-icon">✦</div><strong>Product data is temporarily unavailable.</strong><span>Please try again shortly.</span></section></main>;

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isFirebaseConfigured) {
    return <main className="shell"><SiteHeader/><section className="empty" style={{ marginTop: 80 }}><div className="empty-icon">✦</div><strong>The market is not connected yet.</strong><span>Product pages will appear when the production market is connected.</span></section></main>;
  }

  let product: Product;
  try {
    const snap = await db.collection("products").doc(id).get();
    if (!snap.exists || snap.data()?.status !== "live") notFound();
    product = publicProduct(snap.id, snap.data()!);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error && String((error as { digest?: unknown }).digest || "").startsWith("NEXT_HTTP_ERROR_FALLBACK")) {
      throw error;
    }
    return unavailable();
  }

  let bids: number[] = [];
  let rank: number | undefined;

  try {
    const ranked = await db.collection("products")
      .where("category", "==", product.category)
      .limit(1000)
      .get();
    const liveRanked = ranked.docs
      .filter((doc) => doc.data().status === "live")
      .sort((a, b) => Number(b.data().totalBidUSD || 0) - Number(a.data().totalBidUSD || 0));
    const position = liveRanked.findIndex((d) => d.id === id);
    rank = position >= 0 ? position + 1 : undefined;

    const bs = await db.collection("bids")
      .where("productId", "==", id)
      .limit(1000)
      .get();
    bids = bs.docs
      .filter((d) => d.data().status === "confirmed")
      .sort((a, b) => {
        const aTime = a.data().createdAt?.toMillis?.() ?? 0;
        const bTime = b.data().createdAt?.toMillis?.() ?? 0;
        return bTime - aTime;
      })
      .slice(0, 20)
      .map((d) => Number(d.data().amountUSD || 0));
  } catch {
    return unavailable();
  }

  const category = CATEGORIES.find((c) => c.slug === product.category)?.name || "AI Tools";
  const clicks = Number(product.clicks || 0);

  return <main className="shell">
    <SiteHeader />
    <div className="product-hero">
      <article className="product-card">
        <div className="eyebrow">{category}</div>
        <div className="product" style={{ marginTop: 18 }}>
          <img className="logo" src={product.logoUrl || "/logo.svg"} alt="" />
          <div><h1>{product.name}</h1><div className="muted">{product.tagline}</div></div>
        </div>
        <p>{product.description || product.tagline}</p>
        <div className="stats" style={{ justifyContent: "flex-start" }}>
          <div className="stat"><b>${Number(product.totalBidUSD).toLocaleString()}</b> total bid</div>
          <div className="stat"><b>{product.bidCount}</b> bids</div>
          <div className="stat"><b>{clicks.toLocaleString()}</b> clicks</div>
        </div>
        <a className="button" href={`/go/${product.id}`} target="_blank" rel="noreferrer">Visit product ↗</a>
        <div style={{ marginTop: 14 }}><a className="text-link" href={`/report?product=${encodeURIComponent(product.id)}`}>Report this listing <span>→</span></a></div>
      </article>
      <aside className="metric">
        <div className="metric-label">Current position</div>
        <div className="metric-value">#{rank ?? "—"}</div>
        <div className="metric-label" style={{ marginTop: 24 }}>Competitive move</div>
        <div className="muted" style={{ whiteSpace: "normal", lineHeight: 1.5 }}>Add a confirmed bid to push the product higher.</div>
      </aside>
    </div>
    <BidForm productId={id} currentTotal={Number(product.totalBidUSD)} />
    <section className="board" style={{ marginTop: 20 }}>
      <div className="boardhead"><div><strong>Bid activity</strong><div className="muted">Recent confirmed moves</div></div></div>
      {bids.length === 0 ? <div className="empty"><div className="empty-icon">✦</div><strong>No confirmed bids yet.</strong><span>The first confirmed bid will appear here.</span></div> : bids.map((amount, i) => <div className="row" key={`${amount}-${i}`}>
        <div className="rank">✦</div>
        <div className="product"><img className="logo" src="/logo.svg" alt=""/><div><strong>Anonymous</strong><div className="muted">Confirmed bid</div></div></div>
        <div className="count" />
        <div className="bid">+${amount.toLocaleString()}</div>
      </div>)}
    </section>
  </main>;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const base = "https://www.ai-bid.lol";

  if (!isFirebaseConfigured) {
    return { title: "Product — Ai-Bid", robots: { index: false, follow: false } };
  }

  try {
    const snap = await db.collection("products").doc(id).get();
    const data = snap.data();
    if (!snap.exists || data?.status !== "live") {
      return { title: "Product not found — Ai-Bid", robots: { index: false, follow: false } };
    }

    const name = String(data.name || "AI product");
    const tagline = String(data.tagline || "Discover and rank AI products.");
    const category = CATEGORIES.find((item) => item.slug === data.category)?.name || "AI Tools";
    const description = data.description ? String(data.description) : tagline;
    const canonical = `${base}/product/${encodeURIComponent(id)}`;
    const ogImage = `${canonical}/opengraph-image`;

    return {
      title: `${name} — ${category} — Ai-Bid`,
      description,
      alternates: { canonical },
      robots: { index: true, follow: true },
      openGraph: {
        type: "website",
        url: canonical,
        title: `${name} — ${category} — Ai-Bid`,
        description,
        siteName: "Ai-Bid",
        images: [{ url: ogImage, alt: `${name} on Ai-Bid` }],
      },
      twitter: {
        card: "summary_large_image",
        title: `${name} — ${category} — Ai-Bid`,
        description,
        images: [ogImage],
      },
    };
  } catch {
    return { title: "Product — Ai-Bid", robots: { index: false, follow: false } };
  }
}
