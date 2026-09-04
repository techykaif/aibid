# ai-bid.lol — Product Requirements Document

**Domain:** ai-bid.lol
**Status:** MVP spec, pre-build
**Model:** Pay-to-rank public leaderboard, scoped to AI tools & AI-built products

---

## 1. Overview

ai-bid.lol is a pay-to-rank leaderboard in the style of outbid.lol, narrowed to a single audience: makers of AI tools and AI-built products. Anyone can list their product and pay to climb the board. Highest bidder holds the top spot in their category. Unlike a generic clone, the product is split into category sub-boards and paired with permanent, SEO-indexable product pages — so it works as a viral gimmick in week one and as a lightweight AI-tools directory after the novelty fades.

## 2. Problem & Opportunity

AI tool builders already fight for visibility on Product Hunt, There's An AI For That, and similar directories — slow, crowded, low signal. A pay-to-rank board gives them a louder, faster, more game-like way to buy visibility, aimed at a crowd that has already shown (via Product Hunt launches, Twitter/X growth spend, etc.) that it will pay for eyeballs. The generic "outbid.lol clone" wave (warmap.lol, rankbid.lol, claimrank.lol, outbids.lol, and others) has no audience focus and no life after the novelty dies. Category focus + permanent product pages fix both.

## 3. Goals

- Get to a live, bid-able MVP fast — this genre lives or dies on being early
- Generate real bidding activity and shareable "I got outbid" moments in week one
- Leave behind a durable, search-indexable directory of AI tools by category, so traffic doesn't fully die when the novelty does

### Non-Goals (out of scope for v1)

- User accounts / login — bidding and submission are anonymous-with-email, not account-based
- Subscriptions or recurring billing — every bid is a one-time payment
- Comments, reviews, or ratings on products
- "Claim your listing" flow for products submitted by someone other than the owner
- Native mobile app — responsive web only

## 4. Target Users

- **Bidders / submitters:** solo AI tool builders and small teams who want quick visibility and are used to spending small amounts ($5–$50+) on growth experiments
- **Visitors / discoverers:** people browsing for AI tools in a specific category (coding, writing, image, etc.), plus people arriving purely for the spectacle of the leaderboard itself (X/Twitter shares)

## 5. Core Mechanic

- Anyone can submit a product. Submission is not free — it requires a minimum **$5 bid** as part of the same checkout. There is no free listing tier (this is the primary anti-spam control).
- A product's rank is driven by **total cumulative bid amount**, not just its single highest bid — every bid a product receives adds to its running total. This rewards repeat small bids (more revenue events) rather than one big one-time payment, and still produces "you got outbid" drama since totals can be overtaken.
- Bids are normalized to **USD** for ranking purposes regardless of what currency the bidder actually paid in (Dodo Payments supports multiple currencies/local payment methods — the leaderboard needs one consistent comparison unit).
- Bids are **non-refundable**. This must be stated clearly at checkout — it's a rank purchase, not a subscription, and needs to be explicit to reduce chargeback risk.

## 6. Feature Scope (MVP)

### 6.1 Submission
Form fields: product name, URL, one-line tagline, longer description (optional), category, logo upload, X/Twitter handle (optional), submitter email (required, not shown publicly — used for payment receipt and moderation contact).

### 6.2 Bidding
- Existing products: a "Bid" button on the leaderboard/category page and on the product's own page, opens a bid-amount input (minimum: $1 above the current total, or any amount ≥ $1 — TBD, see Open Questions) → Dodo checkout.
- New products: submission form doubles as the first bid (minimum $5).

### 6.3 Leaderboards
- **All-time board** (`/`) — every category, tabbed
- **Category boards** (`/category/[slug]`) — permanent, one per category, SEO-indexable
- **Daily board** (`/today`) — resets at midnight UTC, ranks products by bids placed *that day only*, giving new entrants a cheap way to hit #1 without out-bidding an entrenched all-time leader

### 6.4 Product Pages
`/product/[id]` — logo, tagline, description, link out, current total bid, rank badge, bid history feed for that product, "Bid to raise rank" button. This is the page that keeps pulling search traffic after the launch spike.

### 6.5 Growth Mechanics
- **Live bid ticker** on the homepage — "CodeAgent just bid $40 in AI Coding" — real-time via Firestore listeners. Primary share/screenshot bait.
- **Auto-generated OG image** per product page (rank, name, logo, category) so link shares on X carry the flex directly in the preview card.
- **Embeddable badge** — small SVG served at `/api/badge/[productId].svg`, shows live rank, meant for product READMEs/sites. Free backlinks in, near-live (cached ~5 min, not a live socket) so it doesn't hammer the DB on every page view of someone else's site.

### 6.6 Payments
Dodo Payments only, used as Merchant of Record for both Indian and international bidders (see Section 8).

## 7. Categories (MVP list)

1. AI Coding & Dev Tools
2. AI Writing & Content
3. AI Image & Design
4. AI Video & Audio
5. AI Agents & Automation
6. AI Productivity & Chat
7. Other / Uncategorized (catch-all — always needed, don't skip this)

## 8. Data Model (Firestore)

### Collection: `products`

| Field | Type | Notes |
|---|---|---|
| name | string | required, max 60 chars |
| url | string | required, must be a valid https URL |
| tagline | string | required, max 100 chars |
| description | string | optional, max 500 chars, shown on product page |
| category | string (enum) | one of the 7 category slugs |
| logoUrl | string | Firebase Storage URL, PNG/JPG/SVG, max 2MB |
| twitterHandle | string | optional |
| submitterEmail | string | required, private — not rendered publicly |
| totalBidUSD | number | indexed, cumulative sum of all confirmed bids, drives ranking |
| bidCount | number | total number of confirmed bids |
| status | enum | `pending` \| `live` \| `rejected` — see moderation, Section 9 |
| createdAt | timestamp | |
| lastBidAt | timestamp | used for tie-breaks and "recently active" sorting |

### Collection: `bids`

| Field | Type | Notes |
|---|---|---|
| productId | reference | |
| amount | number | as charged, in original currency |
| currency | string | e.g. `USD`, `INR` |
| amountUSD | number | normalized amount, used for all ranking math |
| bidderName | string | optional — bids can be anonymous (see Open Questions) |
| bidderTwitter | string | optional |
| dodoPaymentId | string | external reference, used for reconciliation and webhook idempotency |
| status | enum | `pending` \| `confirmed` \| `failed`, set by webhook |
| createdAt | timestamp | |

### Collection: `dailyStats/{YYYY-MM-DD}/entries/{productId}`

A lightweight per-day rollup, incremented by a Cloud Function whenever a bid confirms — avoids aggregating the full `bids` collection client-side every time someone loads `/today`.

| Field | Type | Notes |
|---|---|---|
| totalBidTodayUSD | number | sum of confirmed bids for this product, this date only |
| bidCountToday | number | |

## 9. Moderation & Anti-Spam

- Because listing requires a paid $5+ bid, low-effort spam submissions already have a cost — this is the main spam control.
- New products go **live immediately** on payment confirmation (no manual approval queue) — a review bottleneck defeats the point of a fast-moving viral mechanic, especially if this spikes outside normal hours.
- A lightweight automated check on submission: URL must resolve (basic HEAD request), name/tagline run through a basic profanity filter.
- A **"Report" link** on every product page, feeding an admin view where a listing can be unpublished (`status: rejected`) after the fact. This is the actual moderation mechanism — reactive, not a pre-publish gate.

## 10. Payment Flow (Dodo Payments)

Dodo Payments is used as sole payment processor, acting as Merchant of Record — it is the legal seller of record on every transaction, handles tax calculation/remittance across jurisdictions, and pays out to your Indian bank account as one consolidated transfer. This replaces the Razorpay + Dodo split used on Keanso; one integration handles both domestic and international bidders.

**Flow:**
1. User submits the form (new product) or clicks "Bid" (existing product), enters a bid amount.
2. Client calls an API route (`/api/checkout`) which creates a Dodo Checkout session with the amount and metadata (productId, or a pending-product payload for new submissions).
3. User is redirected to Dodo's hosted checkout, pays.
4. On success, Dodo sends a webhook to `/api/webhooks/dodo`.
5. Webhook handler **verifies the signature** against Dodo's shared secret before trusting the payload — unverified webhook calls must never be able to fabricate a paid bid.
6. On a verified `payment.succeeded` event:
   - Check `dodoPaymentId` against existing `bids` docs first — webhook delivery isn't guaranteed to be exactly-once, so this must be idempotent.
   - Create the `bids` doc with `status: confirmed`.
   - A Firestore `onCreate` trigger (Cloud Function) then increments `products/{id}.totalBidUSD` and `dailyStats/{today}/entries/{id}.totalBidTodayUSD` atomically, and flips a new product's `status` from `pending` to `live`.
7. On failure/cancellation: no product or bid document is created; user is shown a failure state and can retry.

**Onboarding note:** register with Dodo as an **Individual**, not Organization, unless ai-bid.lol is under a registered legal entity — sole proprietors don't need GST registration unless they cross the threshold.

## 11. Non-Functional Requirements

- **Real-time UI:** leaderboard and bid ticker use Firestore `onSnapshot` listeners. If traffic spikes hard, this is the first thing to revisit — consider switching the full-board view to short-interval polling instead of a raw listener per client to control Firestore read costs.
- **Mobile-first:** most share-driven traffic will land from X/Twitter's in-app browser on mobile.
- **OG images:** generate dynamically per product route (e.g. via Next.js Edge + `@vercel/og`), cached at the edge.
- **SEO:** category and product pages need real meta tags, a sitemap.xml, and robots.txt — this is what keeps the site alive after the launch spike.
- **Resilience:** outbid.lol saw real downtime under its own traffic spike and DDoS attempts. Lean on Vercel's edge caching for static/category pages and keep the write path (bids) as lean as possible.

## 12. Tech Stack

- **Framework:** Next.js (matches Keanso, JobSight, AutoBrief, Technocraze)
- **Database:** Firebase Firestore — real-time listeners for the live leaderboard, autoscales under spike traffic
- **Storage:** Firebase Storage — logo uploads
- **Serverless logic:** Cloud Functions — bid aggregation triggers, webhook handling
- **Payments:** Dodo Payments (Merchant of Record) — single integration, India + international
- **Hosting:** Vercel

## 13. Success Metrics (MVP validation window: first 7 days)

- Number of paid product submissions
- Total $ in confirmed bids
- Number of categories with more than one competing bid (validates that sub-boards actually drive repeat bidding, not just one-and-done per category)
- Referral traffic from X/Twitter (proxy for organic sharing)
- Day-2+ return visits to `/today` (validates the daily-reset habit loop)

## 14. Risks

| Risk | Mitigation |
|---|---|
| Genre fatigue — trend may already be cooling by ship date | Ship in days, not weeks |
| Chargebacks from impulse bidders regretting a spend | Dodo as MoR absorbs dispute handling; low $5 floor reduces remorse-driven disputes |
| Spam/low-quality listings diluting categories | Pay-to-list floor + reactive report/unpublish flow |
| Traffic spike inflating Firestore read costs or causing downtime | Edge caching for reads, lean webhook path, revisit listener-vs-polling if it spikes |

## 15. Open Questions

These are flagged, not decided — need your call before or during build:

1. **Bid increment rule:** any amount ≥ $1 above zero, or must each bid exceed the product's current total?
2. **Anonymous bidding:** allow fully anonymous bids on the public ticker, or require at least a name/handle?
3. **Currency floor:** flat $5 USD-equivalent everywhere, or region-adjusted minimums?
4. Anything in the category list (Section 7) you want renamed, merged, or dropped before build?

## 16. Suggested Build Order

1. Firestore schema + Cloud Function triggers (bid aggregation)
2. Dodo Payments checkout + webhook integration — get the money flow verified first
3. Submission flow (form → checkout → webhook → live product)
4. Leaderboard pages: all-time (with category tabs) + `/today`
5. Product detail pages + OG image generation
6. Live bid ticker
7. Embeddable badge endpoint
8. Polish: mobile pass, SEO metadata, sitemap
