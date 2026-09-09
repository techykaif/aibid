import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found — Ai-Bid",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="shell" aria-labelledby="not-found-title">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">AI-BID</div>
          <h1 id="not-found-title">Page not found.</h1>
          <p>The page you requested does not exist.</p>
          <a className="button primary button-lg" href="/">
            Back to Ai-Bid <span aria-hidden="true">→</span>
          </a>
        </div>
      </section>
    </main>
  );
}
