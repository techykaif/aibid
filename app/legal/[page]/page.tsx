import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "../../components/SiteHeader";

const pages = {
  terms: {
    title: "Terms",
    intro: "The rules for using Ai-Bid, placing bids, and submitting products.",
    sections: [
      ["Using Ai-Bid", "Ai-Bid is a public market for AI products. By using the site, you agree to use it lawfully, provide accurate information, and avoid attempts to manipulate, disrupt, or abuse the service."],
      ["Bids and payments", "Bids are one-time payments in USD and are non-refundable. A bid affects a product's ranking only after payment is successfully confirmed by our payment processor. We do not guarantee traffic, conversions, revenue, or any particular ranking outcome."],
      ["Listings and removal", "You are responsible for the product information and links you submit. Ai-Bid may remove or reject a listing that violates these terms, the listing rules, or applicable law, including after a report is received."],
      ["Third-party products", "Ai-Bid does not own or operate listed products unless explicitly stated. Product names, descriptions, links, and other submitted material remain the responsibility of the submitter."],
      ["Changes", "We may update these terms as the product evolves. Continued use after an update means you accept the revised terms."],
    ],
  },
  privacy: {
    title: "Privacy",
    intro: "What Ai-Bid collects, why we use it, and what stays private.",
    sections: [
      ["Information we collect", "When you submit or bid, we may collect the information needed to operate the transaction and listing, including your email address, product information, bid information, and payment-related identifiers. We may also process IP addresses and request metadata for rate-limiting, abuse prevention, and security."],
      ["Private email", "Submitter email addresses are private. They are stored for operational purposes and are not included in public product APIs, public product pages, or leaderboard data."],
      ["Payments", "Dodo Payments processes payment transactions. Ai-Bid receives the payment information and identifiers necessary to reconcile a confirmed bid, but does not rely on a client-side success page as proof of payment."],
      ["Public information", "Product name, URL, tagline, description, category, logo, optional social handle, ranking totals, bid counts, click counts, and relevant timestamps may be displayed publicly as part of the market."],
      ["Retention and security", "We retain information as needed to provide the service, prevent abuse, reconcile payments, and meet legal obligations. We use server-side access controls and do not expose Firestore data directly to public clients."],
    ],
  },
  rules: {
    title: "Rules",
    intro: "A short standard for what belongs on the Ai-Bid market.",
    sections: [
      ["What you can list", "List real AI tools, AI-built products, and products that clearly fit one of the available categories. Your submission must point to a working HTTPS destination and use an accurate product name and description."],
      ["Keep it honest", "Do not submit misleading claims, impersonate another product or company, use someone else's brand without authorization, or manipulate bids, clicks, or market data."],
      ["No abusive content", "Do not submit illegal, hateful, sexually explicit, malware-related, deceptive, or otherwise abusive content. Do not use Ai-Bid to distribute phishing, scams, or harmful downloads."],
      ["Reports and removal", "Every product may be reviewed after a report. We may remove a listing that breaks these rules or applicable law. Paid placement does not exempt a listing from moderation."],
      ["Category fit", "Choose the category that best describes the product. We may move or remove listings that are clearly unrelated to the category or the AI-product focus."],
    ],
  },
  faq: {
    title: "FAQ",
    intro: "How the market works, in plain language.",
    sections: [
      ["How does ranking work?", "A product's position is driven by its confirmed cumulative bid total. More confirmed bid volume means a higher rank within its category."],
      ["How much does it cost to list?", "A new product requires a minimum $5 starting bid. There is no free listing tier in the MVP."],
      ["How much can I bid on an existing product?", "Existing products accept bids starting at $1. Each confirmed bid is added to that product's cumulative total."],
      ["Are bids refundable?", "No. Bids are one-time and non-refundable. The checkout flow should make this clear before payment."],
      ["What does the click count mean?", "Product outbound links pass through Ai-Bid so we can count visits delivered from the market. The running click count is displayed publicly as an ROI signal."],
      ["When does a bid affect ranking?", "Only after the payment webhook is verified and reconciled by the server. A browser redirect or client-side success state cannot make a bid live by itself."],
      ["Can I report a product?", "Yes. Ai-Bid is designed to support reactive moderation. Reported listings can be reviewed and removed when they violate the rules."],
    ],
  },
} as const;

type PageKey = keyof typeof pages;

export function generateStaticParams() {
  return Object.keys(pages).map((page) => ({ page }));
}

export async function generateMetadata({ params }: { params: Promise<{ page: string }> }): Promise<Metadata> {
  const { page } = await params;
  const content = pages[page as PageKey];
  return {
    title: content ? `${content.title} — Ai-Bid` : "Legal — Ai-Bid",
    description: content?.intro,
  };
}

export default async function LegalPage({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  const content = pages[page as PageKey];

  if (!content) {
    return <main className="shell"><SiteHeader /><section className="form"><h1>Page not found</h1><p className="muted">That legal page does not exist.</p><Link className="button primary" href="/">Back to Ai-Bid</Link></section></main>;
  }

  return (
    <main className="shell">
      <SiteHeader />
      <article className="form" aria-labelledby="legal-title">
        <div className="eyebrow">AI-BID / {content.title.toUpperCase()}</div>
        <h1 id="legal-title">{content.title}</h1>
        <p className="muted" style={{ whiteSpace: "normal", fontSize: 14, lineHeight: 1.7 }}>{content.intro}</p>
        <div style={{ display: "grid", gap: 24, marginTop: 30 }}>
          {content.sections.map(([heading, body]) => (
            <section key={heading}>
              <h2>{heading}</h2>
              <p style={{ color: "var(--p-soft)", lineHeight: 1.75, fontSize: 14, margin: 0 }}>{body}</p>
            </section>
          ))}
        </div>
        <nav aria-label="Legal pages" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 36, paddingTop: 20, borderTop: "1px solid var(--p-line)" }}>
          {(Object.keys(pages) as PageKey[]).map((key) => (
            <Link key={key} className="button" href={`/legal/${key}`}>{pages[key].title}</Link>
          ))}
        </nav>
      </article>
    </main>
  );
}
