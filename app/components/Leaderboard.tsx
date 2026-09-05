import Link from "next/link";
import { CATEGORIES, type Product } from "@/lib/types";
import { db, isFirebaseConfigured } from "@/lib/firebase-admin";

const money = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

async function getProducts(category?: string) {
  if (!isFirebaseConfigured) return [] as Product[];

  try {
    let query: FirebaseFirestore.Query = db.collection("products").where("status", "==", "live");
    if (category && CATEGORIES.some((c) => c.slug === category)) query = query.where("category", "==", category);
    const snap = await query.orderBy("totalBidUSD", "desc").limit(50).get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
  } catch {
    return [] as Product[];
  }
}

export default async function Leaderboard({ category }: { category?: string }) {
  const products = await getProducts(category);
  return <section className="board">
    <nav className="tabs" aria-label="Filter leaderboard by category">
      <Link className={`tab ${!category ? "active" : ""}`} href="/" aria-current={!category ? "page" : undefined}>All</Link>
      {CATEGORIES.map((item) => <Link key={item.slug} className={`tab ${category === item.slug ? "active" : ""}`} href={`/category/${item.slug}`} aria-current={category === item.slug ? "page" : undefined}>{item.name.replace("AI ", "")}</Link>)}
    </nav>
    <div className="board-labels"><span>RANK</span><span>PRODUCT</span><span>ACTIVITY</span><span>CURRENT BID</span><span>ACTION</span></div>
    {products.length === 0 ? <div className="empty"><div className="empty-icon">✦</div><strong>{isFirebaseConfigured ? "The board is waiting." : "The market is not connected yet."}</strong><span>{isFirebaseConfigured ? "Be the first product to claim this category." : "Live rankings will appear when the production market is connected."}</span></div> : products.map((product, index) => <div className={`row ${index < 3 ? "top-row" : ""}`} key={product.id}>
      <div className={`rank rank-${index + 1}`}>{String(index + 1).padStart(2, "0")}</div>
      <Link href={`/product/${product.id}`} className="product"><img className="logo" src={product.logoUrl || "/logo.svg"} alt=""/><div className="product-copy"><strong>{product.name}</strong><div className="muted">{product.tagline}</div></div></Link>
      <div className="count"><span className="activity-dot"/>{product.bidCount} bids</div><div className="bid">{money(product.totalBidUSD)}</div>
      <Link href={`/product/${product.id}`} className="row-action" aria-label={`View ${product.name} and bid`}>View &amp; bid <span aria-hidden="true">→</span></Link>
    </div>)}
    <div className="board-foot"><span>Showing {products.length} products</span><span>Ranked by confirmed cumulative bids</span></div>
  </section>;
}
