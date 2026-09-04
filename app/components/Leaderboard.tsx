"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CATEGORIES, type Product } from "@/lib/types";

const money = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export default function Leaderboard({ category }: { category?: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const response = await fetch(`/api/products${category ? `?category=${category}` : ""}`, { cache: "no-store" });
      if (active) { setProducts(await response.json()); setLoading(false); }
    };
    load();
    const timer = setInterval(load, 15000);
    return () => { active = false; clearInterval(timer); };
  }, [category]);

  return (
    <section className="board">
      <div className="tabs">
        <Link className={`tab ${!category ? "active" : ""}`} href="/">All</Link>
        {CATEGORIES.map((item) => <Link key={item.slug} className={`tab ${category === item.slug ? "active" : ""}`} href={`/category/${item.slug}`}>{item.name.replace("AI ", "")}</Link>)}
      </div>
      {loading ? <div className="empty">Loading the board…</div> : products.length === 0 ? <div className="empty">Nobody has bid here yet. Be the first one to plant a flag.</div> : products.map((product, index) => (
        <div className="row" key={product.id}>
          <div className="rank">#{index + 1}</div>
          <Link href={`/product/${product.id}`} className="product" style={{ color: "inherit", textDecoration: "none" }}>
            {product.logoUrl ? <img className="logo" src={product.logoUrl} alt="" /> : <div className="logo" />}
            <div><strong>{product.name}</strong><div className="muted">{product.tagline}</div></div>
          </Link>
          <div className="count muted">{product.bidCount} bid{product.bidCount === 1 ? "" : "s"}</div>
          <div className="bid">{money(product.totalBidUSD)}</div>
        </div>
      ))}
    </section>
  );
}