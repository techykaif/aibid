import Link from "next/link";
import { CATEGORIES, type Product } from "@/lib/types";
import { db, isFirebaseConfigured } from "@/lib/firebase-admin";

const demoProducts: Product[] = [
  { id:"demo-1", name:"Cursor", url:"https://cursor.com", tagline:"The AI code editor built for pair programming with models.", category:"coding", totalBidUSD:2480, bidCount:42, status:"live" },
  { id:"demo-2", name:"Perplexity", url:"https://perplexity.ai", tagline:"Search, research and answer with AI at the center.", category:"productivity", totalBidUSD:1920, bidCount:31, status:"live" },
  { id:"demo-3", name:"Lovable", url:"https://lovable.dev", tagline:"Build production-ready apps by chatting with AI.", category:"coding", totalBidUSD:1540, bidCount:27, status:"live" },
  { id:"demo-4", name:"Runway", url:"https://runwayml.com", tagline:"Generative video tools for the next generation of creators.", category:"video", totalBidUSD:1120, bidCount:19, status:"live" },
  { id:"demo-5", name:"v0", url:"https://v0.dev", tagline:"Turn ideas into polished interfaces with generative UI.", category:"coding", totalBidUSD:860, bidCount:14, status:"live" },
  { id:"demo-6", name:"Gamma", url:"https://gamma.app", tagline:"Create beautiful decks and docs without the busywork.", category:"writing", totalBidUSD:640, bidCount:11, status:"live" },
];

const money = (n:number) => new Intl.NumberFormat("en-US", { style:"currency", currency:"USD", maximumFractionDigits:0 }).format(n);

async function getProducts(category?: string) {
  if (!isFirebaseConfigured) return category ? demoProducts.filter(p => p.category === category) : demoProducts;
  let query: FirebaseFirestore.Query = db.collection("products").where("status","==","live");
  if (category && CATEGORIES.some(c => c.slug === category)) query = query.where("category","==",category);
  const snap = await query.orderBy("totalBidUSD","desc").limit(50).get();
  return snap.docs.map(d => ({ id:d.id, ...d.data() } as Product));
}

export default async function Leaderboard({ category }: { category?: string }) {
  const products = await getProducts(category);
  return <section className="board">
    <div className="tabs"><Link className={`tab ${!category ? "active" : ""}`} href="/">All</Link>{CATEGORIES.map(item=><Link key={item.slug} className={`tab ${category===item.slug?"active":""}`} href={`/category/${item.slug}`}>{item.name.replace("AI ","")}</Link>)}</div>
    <div className="board-labels"><span>RANK</span><span>PRODUCT</span><span>ACTIVITY</span><span>CURRENT BID</span><span>ACTION</span></div>
    {products.length===0 ? <div className="empty"><div className="empty-icon">✦</div><strong>The board is waiting.</strong><span>Be the first product to claim this category.</span></div> : products.map((product,index)=><div className={`row ${index<3?"top-row":""}`} key={product.id}>
      <div className={`rank rank-${index+1}`}>{index<3?["01","02","03"][index]:String(index+1).padStart(2,"0")}</div>
      <Link href={`/product/${product.id}`} className="product"><img className="logo" src={product.logoUrl||"/logo.svg"} alt=""/><div className="product-copy"><strong>{product.name}</strong><div className="muted">{product.tagline}</div></div></Link>
      <div className="count"><span className="activity-dot"/>{product.bidCount} bids</div><div className="bid">{money(product.totalBidUSD)}</div>
      <Link href={`/product/${product.id}`} className="row-action" aria-label={`View ${product.name} and bid`}>View &amp; bid <span aria-hidden="true">→</span></Link>
    </div>)}
    <div className="board-foot"><span>Showing {products.length} products</span><span>Ranked by confirmed cumulative bids</span></div>
  </section>;
}