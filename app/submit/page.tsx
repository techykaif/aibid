"use client";

import { useState } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/types";
import SiteHeader from "@/app/components/SiteHeader";

export default function SubmitPage() {
  const [form, setForm] = useState({ name:"", url:"", tagline:"", description:"", category:"coding", email:"", twitterHandle:"", bid:"5" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const update = (key: string, value: string) => setForm(v => ({ ...v, [key]: value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout unavailable");
      if (!data.checkout_url) throw new Error("Checkout URL was not returned.");
      window.location.href = data.checkout_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return <main className="shell">
    <SiteHeader />
    <div className="submit-grid">
      <form className="form" onSubmit={submit}>
        <div className="eyebrow">List your product</div>
        <h1>Buy your place on the board.</h1>
        <p className="muted" style={{ whiteSpace:"normal", lineHeight:1.6 }}>Every listing starts with a bid. Choose your category, tell people what you built, then compete for attention.</p>

        <div className="field"><label htmlFor="product-name">Product name</label><input id="product-name" name="name" autoComplete="organization" maxLength={60} required value={form.name} onChange={e => update("name", e.target.value)} placeholder="Your product" /></div>
        <div className="field"><label htmlFor="product-url">Product URL</label><input id="product-url" name="url" type="url" inputMode="url" autoComplete="url" required value={form.url} onChange={e => update("url", e.target.value)} placeholder="https://yourproduct.com" /></div>
        <div className="field"><label htmlFor="product-tagline">One-line pitch</label><input id="product-tagline" name="tagline" maxLength={100} required value={form.tagline} onChange={e => update("tagline", e.target.value)} placeholder="The fastest way to…" /></div>
        <div className="field"><label htmlFor="product-description">Description <span className="muted">optional</span></label><textarea id="product-description" name="description" maxLength={500} value={form.description} onChange={e => update("description", e.target.value)} placeholder="What makes this worth discovering?" /></div>
        <div className="field"><label htmlFor="product-category">Category</label><select id="product-category" name="category" value={form.category} onChange={e => update("category", e.target.value)}>{CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></div>
        <div className="field"><label htmlFor="submitter-email">Email</label><input id="submitter-email" name="email" type="email" inputMode="email" autoComplete="email" spellCheck={false} required value={form.email} onChange={e => update("email", e.target.value)} placeholder="For your receipt and listing updates" /></div>
        <div className="field"><label htmlFor="twitter-handle">X handle <span className="muted">optional</span></label><input id="twitter-handle" name="twitterHandle" autoComplete="off" spellCheck={false} value={form.twitterHandle} onChange={e => update("twitterHandle", e.target.value)} placeholder="@yourproduct" /></div>
        <div className="field"><label htmlFor="opening-bid">Opening bid</label><input id="opening-bid" name="bid" type="number" inputMode="decimal" min="5" step="1" required value={form.bid} onChange={e => update("bid", e.target.value)} /></div>

        <button className="button primary" type="submit" disabled={loading}>{loading ? "Opening secure checkout…" : `Continue to checkout · $${Number(form.bid || 0).toFixed(0)} →`}</button>
        {error && <p className="bid-error" role="alert">{error}</p>}
        <p className="muted bid-note">One-time bid · minimum $5 · payment verified by webhook</p>
      </form>
      <aside className="form-aside">
        <div className="eyebrow">How it works</div>
        <h3>Turn attention into a position.</h3>
        <p>No subscriptions. No complicated ad manager. Your cumulative confirmed bid is your position.</p>
        <ul><li><b>01</b> · Create your listing</li><li><b>02</b> · Place the opening bid</li><li><b>03</b> · Get a public product page</li><li><b>04</b> · Outbid the field</li></ul>
        <div className="metric"><div className="metric-label">Minimum opening bid</div><div className="metric-value">$5</div></div>
      </aside>
    </div>
  </main>;
}
