"use client";
import { useState } from "react";

export default function BidForm({ productId, currentTotal }: { productId: string; currentTotal: number }) {
  const [amount, setAmount] = useState(String(Math.max(5, Math.ceil(currentTotal + 1))));
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [twitter, setTwitter] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function bid(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/products/${productId}/bid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, email, bidderName: name, bidderTwitter: twitter }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout unavailable");
      window.location.href = data.checkout_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={bid} className="form bid-form" style={{ margin: "20px 0 0" }}>
      <div className="eyebrow">Move the market</div>
      <h2>Raise the rank.</h2>
      <p className="muted bid-intro">Your confirmed bid is added to the product total. Higher total, higher position.</p>

      <div className="field">
        <label htmlFor="bid-amount">Bid amount <span className="muted">· USD</span></label>
        <input id="bid-amount" name="amount" type="number" min="5" step="1" inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value)} required aria-describedby="bid-amount-help" />
        <span id="bid-amount-help" className="field-help">Minimum $5 · Current total ${Number(currentTotal).toLocaleString()}</span>
      </div>

      <div className="field">
        <label htmlFor="bid-email">Email</label>
        <input id="bid-email" name="email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
      </div>

      <div className="field">
        <label htmlFor="bid-name">Name <span className="muted">optional</span></label>
        <input id="bid-name" name="name" autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="Anonymous" />
      </div>

      <div className="field">
        <label htmlFor="bid-x">X handle <span className="muted">optional</span></label>
        <input id="bid-x" name="twitter" autoComplete="off" value={twitter} onChange={e => setTwitter(e.target.value)} placeholder="@you" />
      </div>

      <button className="button primary bid-submit" type="submit" disabled={loading} aria-describedby={error ? "bid-error" : undefined}>
        {loading ? "Opening checkout…" : `Bid $${Number(amount || 0).toLocaleString()} →`}
      </button>

      {error && <div id="bid-error" className="bid-error" role="alert">{error}</div>}
      <p className="muted bid-note">One-time bid · non-refundable · payment verified by webhook</p>
    </form>
  );
}
