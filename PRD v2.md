# ai-bid.lol — Product Requirements Document (v2)

**Domain:** ai-bid.lol
**Status:** MVP in build — first draft live, this revision folds in the codebase review and outbid.lol competitive research
**Model:** Pay-to-rank public leaderboard, scoped to AI tools & AI-built products

---

## 1. Overview

ai-bid.lol is a pay-to-rank leaderboard in the style of outbid.lol, narrowed to a single audience: makers of AI tools and AI-built products. Anyone can list their product and pay to climb the board. Highest cumulative bid holds the top spot in their category. The product is split into category sub-boards and paired with permanent, SEO-indexable product pages — so it works as a viral gimmick in week one and as a lightweight AI-tools directory after the novelty fades.

## 2. Problem & Opportunity

AI tool builders already fight for visibility on Product Hunt, There's An AI For That, and similar directories — slow, crowded, low signal. A pay-to-rank board gives them a louder, faster, more game-like way to buy visibility, aimed at a crowd that has already shown it will pay for eyeballs. The generic "outbid.lol clone" wave (warmap.lol, rankbid.lol, claimrank.lol, outbids.lol, and others) has no audience focus and no life after the novelty dies. Category focus + permanent product pages fix both.

## 3. Goals

- Get to a live, bid-able MVP fast — this genre lives or dies on being early
- Generate real bidding activity and shareable "I got outbid" moments in week one
- Leave behind a durable, search-indexable directory of AI tools by category
- Match the trust/transparency signals that made outbid.lol's launch credible (live stats, click counts, legal pages) — these aren't polish, they're part of why people believed the numbers enough to bid

### Non-Goals (out of scope for v1)

- User accounts / login — bidding and submission are anonymous-with-email, not account-based
- Subscriptions or recurring billing — every bid is a one-time payment
- Comments, reviews, or ratings on products
- "Claim your listing" flow for products submitted by someone other than the owner
- Native mobile app — responsive web only
- Multi-currency bidding — USD only for v1 (see Section 10)

## 4. Target Users

- **Bidders / submitters:** solo AI tool builders and small teams who want quick visibility and are used to spending small amounts ($5–$50+) on growth experiments
- **Visitors / discoverers:** people browsing for AI tools in a specific category, plus people arriving purely for the spectacle of the leaderboard itself (X/Twitter shares)

## 5. Core Mechanic

- Anyone can submit a product. Submission is not free — it requires a minimum **$5 bid** as part of the same checkout. No free listing tier (primary anti-spam control).
- A product's rank is driven by **total cumulative bid amount** — every bid a product receives adds to its running total.
- **Minimum increment to raise a bid: $1 above zero, no requirement to specifically exceed a rival's total.** Confirmed against outbid.lol's own live mechanic (each listing's "claim this rank for $X" is that listing's current total + $1) and matches what's already implemented in `/api/products/[id]/bid`. Resolved — was previously an open question.
- Bids are **USD only** for v1. Dodo Payments supports multi-currency, but the current build charges every bid in USD directly rather than normalizing from local currency — simpler, avoids FX-rate ranking disputes, matches what's already shipped. Resolved — was previously an open question about currency floor.
- Bids are **non-refundable**, stated clearly at checkout.

## 6. Feature Scope (MVP)

### 6.1 Submission
Fields: product name, URL, one-line tagline, longer description (optional), category, logo upload, X/Twitter handle (optional), submitter email (required, **private** — see Section 12, Security Notes).

### 6.2 Bidding
- Existing products: "Bid" button opens an amount input (minimum $1) → Dodo checkout.
- New products: submission form doubles as the first bid (minimum $5).
- **Anonymous bidding is allowed.** `bidderName`/`bidderTwitter` are optional; unset bids display as "Anonymous" in the bid history. Resolved — matches what's already implemented.

### 6.3 Leaderboards
- **All-time board** (`/`) — every category, tabbed
- **Category boards** (`/category/[slug]`) — permanent, SEO-indexable
- **Daily board** (`/today`) — resets at midnight UTC, ranks products by bids placed *that day only*

### 6.4 Product Pages
`/product/[id]` — logo, tagline, description, outbound link, current total bid, bid count, **click count** (new, see 6.6), bid history feed, "Bid to raise rank" button.

### 6.5 Growth Mechanics
- **Live-updating leaderboard and ticker** — short-interval polling behind cached API routes (`s-maxage=15` on `/api/products`, `s-maxage=10` on `/api/today`), not a raw Firestore listener. This is a deliberate architecture choice, not a shortcut: Firestore security rules block all direct client access (`allow read, write: if false`), so every read goes through a server route on the Admin SDK. Keep this — it's the right call for this data-sensitivity profile.
- **Auto-generated OG image** per product page (name, tagline, total bid; rank number still needs to be wired in — currently a placeholder, see Section 13).
- **Embeddable badge** — SVG at `/api/badge/[productId].svg`, cached ~5 min.

### 6.6 Click Tracking (new)
outbid.lol shows a click count on every listing ("50,363 clicks") — this is the actual ROI signal a bidder is paying for, not a nice-to-have. Route outbound product links through `/go/[productId]` instead of a direct `<a href>`: log the click, increment `products/{id}.clicks`, then redirect (302) to `product.url`. Display the running count on the product card and product page next to the bid total, formatted the same way as bid totals (comma-grouped integer, no abbreviation).

### 6.7 Stats & Analytics (new)
outbid.lol runs a visible "revenue / products added" counter and links out to a fully public live-analytics dashboard — this is core to the mechanic's credibility, not decoration; it's the proof that money is actually moving. For ai-bid.lol:
- A `stats/global` Firestore doc, incremented in the same transaction as every confirmed bid (`totalRevenueUSD`, `totalProducts`, `totalBids`).
- A stats strip on the homepage reusing the existing `.stat` pill component (see design guidelines) showing these three numbers live.
- Optional, not MVP-blocking: a public analytics dashboard link (e.g., a shared Plausible/Datafa.st view) in the footer, same transparency move outbid.lol makes. Defer unless analytics tooling is already in place.

### 6.8 Legal & Trust Pages (new — pre-launch requirement)
outbid.lol ships Terms, Privacy, Rules, and an FAQ. ai-bid.lol is taking real payments and hosting public third-party content (names, URLs, taglines) — treat these as a **pre-launch blocker**, not polish:
- **Terms** — bids are non-refundable, right to remove listings, no guarantee of traffic/results
- **Privacy** — what's collected (email, IP for rate-limiting), that email is never shown publicly, Dodo as payment processor
- **Rules** — what's allowed to be listed, category-fit expectations, report/removal process
- **FAQ** — how ranking works (cumulative, $1 minimum), why $5 to list, refund policy in plain language

## 7. Categories (MVP list — final)

1. AI Coding & Dev Tools
2. AI Writing & Content
3. AI Image & Design
4. AI Video & Audio
5. AI Agents & Automation
6. AI Productivity & Chat
7. Other / Uncategorized

## 8. Data Model (Firestore)

### Collection: `products`

| Field | Type | Notes |
|---|---|---|
| name | string | required, max 60 chars |
| url | string | required, https |
| tagline | string | required, max 100 chars |
| description | string | optional, max 500 chars |
| category | string (enum) | one of the 7 slugs |
| logoUrl | string | Firebase Storage URL |
| twitterHandle | string | optional |
| email | string | required, **private — never included in any public API response or page prop** (see Section 12) |
| totalBidUSD | number | indexed, cumulative sum of confirmed bids, drives ranking |
| bidCount | number | |
| clicks | number | new — incremented by `/go/[productId]` |
| status | enum | `pending` \| `live` \| `rejected` |
| createdAt | timestamp | |
| lastBidAt | timestamp | |

### Collection: `bids`

Document ID = the Dodo `paymentId` (not an auto ID) — this is what makes webhook processing idempotent for free; keep this pattern for any future payment-triggered write.

| Field | Type | Notes |
|---|---|---|
| productId | reference | |
| amount | number | |
| currency | string | currently always `USD` |
| amountUSD | number | |
| bidderName | string | optional |
| bidderTwitter | string | optional |
| dodoPaymentId | string | = document ID |
| status | enum | `pending` \| `confirmed` \| `failed` |
| createdAt | timestamp | |

### Collection: `dailyStats/{YYYY-MM-DD}/entries/{productId}`

| Field | Type | Notes |
|---|---|---|
| totalBidTodayUSD | number | |
| bidCountToday | number | |

### Document: `stats/global` (new)

| Field | Type | Notes |
|---|---|---|
| totalRevenueUSD | number | incremented alongside every confirmed bid |
| totalProducts | number | incremented on a product's first confirmed bid |
| totalBids | number | incremented on every confirmed bid |

## 9. Moderation & Anti-Spam

- Paid $5+ listing floor is the primary spam control.
- New products go **live immediately** on payment confirmation — no manual approval queue.
- Automated check on submission: URL must resolve, name/tagline run through a basic profanity filter.
- **Report link** on every product page → admin view → `status: rejected`. Reactive, not a pre-publish gate.

## 10. Payment Flow (Dodo Payments)

Dodo Payments is the sole payment processor, acting as Merchant of Record for both Indian and international bidders. Confirmed implementation:

1. Client submits form/bid → API route validates with zod → the **same validated number** drives both what Dodo charges and what gets written to checkout metadata (`bidUSD`). This closes the obvious tampering vector: a client cannot pay one amount and claim a different bid value.
2. Checkout session created against Dodo's `/checkouts` endpoint, currency hardcoded to `USD`.
3. On success, Dodo sends a signed webhook to `/api/webhooks/dodo`.
4. Webhook verifies the signature via the `standardwebhooks` library before trusting anything in the payload.
5. Idempotency: the `bids` document is written with **the Dodo payment ID as its document ID**. If that document already exists, the handler returns early — no query needed, no race window.
6. A single Firestore transaction: writes the bid, increments `products/{id}.totalBidUSD`/`bidCount`, flips `status` to `live`, updates `dailyStats`, and (new) increments `stats/global`.
7. On failure/cancellation: nothing is written; user sees a retry state.

**Onboarding note:** register with Dodo as an **Individual**, not Organization, unless ai-bid.lol is under a registered legal entity.

## 11. Non-Functional Requirements

- **Data access:** all reads/writes go through server routes on the Admin SDK. `firestore.rules` denies all direct client access (`allow read, write: if false`) — keep this; do not relax it to enable client-side listeners.
- **Real-time UI:** short-interval polling behind cached API routes, not `onSnapshot` (see 6.5). Confirmed final.
- **Mobile-first:** most share-driven traffic lands from X/Twitter's in-app browser on mobile.
- **OG images:** dynamic per product route via Next.js `ImageResponse`, cached at the edge. Needs the rank number wired in (currently a placeholder — see Section 13).
- **SEO:** sitemap.ts and robots.ts are in place; category/product pages need real per-page meta tags if not already set.
- **Resilience:** outbid.lol saw real downtime under its own traffic spike. Lean on Vercel edge caching for reads; keep the webhook path lean.

## 12. Security Notes

- **Never spread a full Firestore document into a public API response.** `email` lives on the same `products` document as everything else — any endpoint returning product data to the client must explicitly allowlist fields (name, url, tagline, description, category, logoUrl, twitterHandle, totalBidUSD, bidCount, clicks, createdAt, lastBidAt). This applies to `/api/products`, `/api/today`, and any future endpoint that lists or returns product data — treat this as a standing rule, not a one-time fix.
- Webhook payloads are untrusted until signature-verified; never write to Firestore from a webhook body before verification succeeds.
- Checkout amount and recorded bid amount must always derive from the same server-validated number — never trust a client-supplied "amount paid" separately from what was actually charged.

## 13. Known Gaps (tracked, not yet closed)

1. Logo upload via Firebase Storage — submission flow currently leaves this out until Storage credentials are configured.
2. Admin/moderation tooling for the report flow (Section 9).
3. Rank number not yet wired into the OG image generator (Section 11).
4. Click tracking (6.6) and stats strip (6.7) — specified in this revision, not yet built.
5. Legal pages (6.8) — specified in this revision, not yet built.
6. No rank-aware suggested bid amount in the UI (outbid.lol shows "claim this rank for $X" per row) — nice-to-have, not a blocker.
7. Production Firebase project, Dodo product ID, and webhook secret still need to be configured; no real payment has been run end-to-end yet.

## 14. Success Metrics (first 7 days)

- Number of paid product submissions
- Total $ in confirmed bids
- Total clicks delivered (once 6.6 ships) — this is the number that gets screenshotted and shared
- Categories with more than one competing bid
- Referral traffic from X/Twitter
- Day-2+ return visits to `/today`

## 15. Risks

| Risk | Mitigation |
|---|---|
| Genre fatigue | Ship in days, not weeks |
| Chargebacks from impulse bidders | Dodo as MoR absorbs dispute handling; $5 floor keeps remorse low |
| Spam/low-quality listings | Pay-to-list floor + reactive report/unpublish flow |
| Traffic spike inflating costs/downtime | Edge caching, lean webhook path, current polling architecture already avoids a listener-per-client cost blowup |

## 16. Build Order (updated)

1. ~~Firestore schema + Cloud Function-equivalent transaction logic~~ — done
2. ~~Dodo checkout + webhook integration~~ — done, needs live credentials
3. ~~Submission flow~~ — done, needs logo upload
4. ~~Leaderboard pages (all-time, category, today)~~ — done
5. ~~Product detail pages + OG image~~ — done, rank number pending
6. Fix the public-API field leak (Section 12) — do this first, before anything else below
7. Click tracking (`/go/[productId]`) + click count display
8. Stats strip + `stats/global` rollup
9. Legal pages (Terms, Privacy, Rules, FAQ)
10. Logo upload, admin/report tooling
11. Configure production Firebase + Dodo, run first real payment end-to-end
12. Launch
