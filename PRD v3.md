# ai-bid.lol — Product Requirements Document (v3, complete spec)

**Domain:** ai-bid.lol · **Repo:** github.com/techykaif/aibid
**Status key used throughout:** ✅ Built & verified · ⚠️ Built but needs a fix · ⬜ Not yet built
**Purpose of this revision:** a single, complete spec covering every feature of the app as it stands plus everything still to build — meant to be the standing reference for continued implementation, not just a delta from the last pass.

---

## 1. Overview

ai-bid.lol is a pay-to-rank public leaderboard for AI tools and AI-built products, modeled on outbid.lol's mechanic and scoped initially to a single audience. Anyone can list a product and pay to climb the board; highest cumulative bid holds the top spot in its category. The product is split into category sub-boards with permanent, SEO-indexable product pages, so it works as a viral mechanic in week one and a real directory after the novelty fades.

The launch product is intentionally **AI-only**. The core mechanic is a focused visibility market for AI tool builders and AI-built products. Future markets may reuse the same infrastructure after the AI market has been validated, but they are not part of the current launch scope and must not appear in production navigation, submission options, categories, or fabricated listings.

### Market roadmap

1. **AI** — current launch market and sole production market
2. **Games** — future expansion, not part of the current launch
3. **Open Source** — future expansion
4. **Music** — future expansion
5. Additional markets only after the core mechanic and earlier phases are validated

Future markets must reuse the same core primitives — submission, paid ranking, permanent product pages, shareable rank changes, stats, moderation, and verified payments — while keeping each market's taxonomy and presentation appropriate to its audience. Do not add dormant/mock/fabricated listings or categories for future markets.

## 2. Goals

- Ship fast — this genre lives or dies on being early
- Generate real bidding activity and shareable "I got outbid" moments
- Leave behind a durable, search-indexable AI-tools directory
- Match the trust/transparency signals that made outbid.lol credible (live stats, click counts, legal pages) — these are load-bearing, not decoration
- Keep the architecture extensible so future markets can be added without compromising the focused AI launch

### Non-Goals

- User accounts/login — anonymous-with-email only
- Subscriptions/recurring billing — every bid is one-time
- Comments, reviews, ratings
- "Claim your listing" ownership transfer flow
- Native mobile app
- Multi-currency bidding — USD only
- Games or other non-AI markets at launch

## 3. Target Users

- **Bidders/submitters:** AI tool builders spending $5–$50+ on visibility
- **Visitors:** people browsing a specific AI category, plus spectacle-driven X/Twitter traffic

## 4. Core Mechanic

- Listing a new product requires a minimum **$5** bid as part of the same checkout — no free tier
- Rank = **cumulative total bid amount** per product, not a single largest bid
- Minimum increment to raise an existing product's total: **$1**
- **USD only.** No FX normalization — simpler, avoids ranking disputes across currencies
- Bids are **non-refundable**, stated at checkout and in Terms

## 5. Feature Scope

### 5.1 Submission ⚠️
Fields: name, URL, tagline, description (optional), AI category, X/Twitter handle (optional), email (required, private). Submission + first bid happen in one checkout.
- **Logo upload ✅ in code; deployed upload/read verification completed** — see PRD v3.1 for the authoritative Firestore logo architecture. Firebase Storage is not a launch dependency.

### 5.2 Bidding ✅
- New product: submission form doubles as first bid (min $5)
- Existing product: "Bid" button → amount input (min $1) → Dodo checkout
- Anonymous bidding allowed — `bidderName`/`bidderTwitter` optional, unset bids show as "Anonymous"

### 5.3 Leaderboards ✅
- **All-time** (`/`) — every AI category, tabbed
- **Category** (`/category/[slug]`) — permanent, SEO-indexable, one per AI category
- **Daily** (`/today`) — resets at UTC midnight, ranks by that day's bids only

### 5.4 Product Pages ✅
`/product/[id]` — logo (when present), tagline, description, outbound link (via click-tracked redirect), total bid, bid count, click count, bid history, "Bid to raise rank" CTA.

### 5.5 Click Tracking ✅
`/go/[productId]` — validates the product is `live`, validates the destination URL's protocol is http/https (blocks open-redirect abuse), increments `clicks` atomically, then 302-redirects. This is the ROI number bidders actually care about — outbid.lol shows it prominently and so should this.

### 5.6 Stats & Analytics ✅
`stats/global` doc — `totalRevenueUSD`, `totalProducts`, `totalBids` — incremented in the same transaction as every confirmed bid. Served via `/api/stats` and rendered live in the homepage market-stats strip. Formatting: comma-grouped, no abbreviation, matches bid/click formatting.

### 5.7 Legal & Trust Pages ✅
`/legal/[page]` — Terms, Privacy, Rules, FAQ, linked from the footer. Privacy explicitly states submitter email is never public. Content should stay in sync with actual behavior (e.g., if a moderation/report flow ships, the Rules copy already anticipates it).

### 5.8 Growth Mechanics
- **Live-updating board** ✅ — short-interval polling behind cached API routes (`s-maxage=15` products, `s-maxage=10` today), not `onSnapshot`. Firestore rules block all direct client access; this is final, not a placeholder.
- **Dynamic OG image** ✅ — per-product, includes live category rank
- **Embeddable badge** ✅ — SVG at `/api/badge/[productId].svg`
- Report link on product pages — implemented; verify end-to-end before final launch acceptance

### 5.9 Moderation & Anti-Spam
- Paid $5+ floor is the primary spam control ✅
- New products go live immediately on payment confirmation ✅
- Automated URL-resolves + profanity-filter check on submission — wired in code; verify deployed behavior before final launch
- Report link + admin review/unpublish tooling — implemented; verify end-to-end before final launch acceptance

### 5.10 Payments ✅
Dodo Payments as sole processor, Merchant of Record, USD only. See Section 8.

## 6. Categories

### AI launch categories

1. AI Coding & Dev Tools
2. AI Writing & Content
3. AI Image & Design
4. AI Video & Audio
5. AI Agents & Automation
6. AI Productivity & Chat
7. Other / Uncategorized

Games, Open Source, Music, and other future markets have **no live categories at launch**. Their taxonomy will be introduced only when the corresponding expansion is intentionally started.

## 7. Data Model (Firestore)

### `products`

| Field | Type | Notes |
|---|---|---|
| name, url, tagline, description, category, market, twitterHandle | string | as submitted |
| logoUrl | string \| null | points to `/api/logo/{productId}` when a verified logo is present |
| email | string | **private — never in any public response, see Section 9** |
| totalBidUSD | number | drives ranking |
| bidCount | number | |
| clicks | number | incremented by `/go/[productId]` |
| status | enum | `pending` \| `live` \| `rejected` |
| createdAt, lastBidAt | timestamp | |

## 8. Payment Flow (Dodo Payments) ✅

1. Client submits form/bid → server validates with zod → the same validated number drives both the Dodo charge and the checkout metadata.
2. Checkout created against Dodo, `product_currency: "USD"`.
3. Dodo sends a signed webhook to `/api/webhooks/dodo` on `payment.succeeded`.
4. Signature verified via `standardwebhooks` before anything in the payload is trusted.
5. **Amount is derived from the server-created checkout intent and verified against Dodo's signed USD settlement amount;** metadata `bidUSD` is only cross-checked for consistency and rejected on mismatch.
6. Currency and Dodo product ID are both validated against expected values.
7. Idempotency: `bids` doc ID = Dodo payment ID; existing doc short-circuits the transaction.
8. One transaction: writes the bid, updates `products.totalBidUSD/bidCount/lastBidAt/status`, updates `dailyStats`, updates `stats/global` (including `totalProducts` incremented only on a product's first confirmed bid).
9. Failure/cancellation: nothing written, user sees retry state.

**Dodo onboarding:** register as **Individual**, not Organization, unless under a registered entity.

## 9. Security Requirements

- **Never spread a full Firestore document into a public response.** `email` lives on the same `products` doc as everything else — every public-facing read must explicitly allowlist fields.
  - `/api/products` — fixed, allowlists correctly
  - `/api/today` — fixed, allowlists correctly
- Webhook payloads are untrusted until signature-verified; never write to Firestore before verification succeeds
- Checkout amount and recorded bid amount must always derive from the same server-validated/Dodo-confirmed number, never a client-supplied one taken alone
- Redirect endpoints (`/go/[productId]`) must validate destination URL scheme before redirecting, to prevent open-redirect abuse

## 10. Design System

Full ruleset lives in `AGENTS.md` under "Design system constraints" — treat that file as the enforced source of truth for anyone (human or agent) touching UI code. Summary:

- **One stylesheet.** `app/globals.css` only.
- **Dual theme, intentional.** Both light and dark are first-class. Token set remains defined by `AGENTS.md`.
- **No box-shadow anywhere.**
- **No monospace font.**
- **Radius:** 8px (inputs, pills, thumbnails) / 12px (buttons, tabs) / 16px (cards). No other radius value.
- **Eyebrow/kicker label** used exactly once, in the hero.
- **One arrow style if used at all.**
- No hero widgets, hover-underline nav, sticky/blurred header, or backdrop-filter unless explicitly requested first.

## 11. Non-Functional Requirements

- All reads/writes go through server routes on the Admin SDK; `firestore.rules` denies all direct client access — keep this
- Polling (not `onSnapshot`) behind cached API routes — final architecture, not interim
- Mobile-first — most share traffic arrives via X/Twitter's in-app browser
- SEO — sitemap.ts, robots.ts in place; verify per-page meta tags are set on category/product routes
- Resilience — lean on Vercel edge caching; outbid.lol saw real downtime under its own spike

## 12. Known Gaps (prioritized)

1. Verify production Dodo product configuration, webhook endpoint/signing secret, Adaptive Currency setting, and payment behavior without exposing credentials.
2. Run integration/e2e coverage against Dodo test mode + Firebase emulator, including duplicate/retry/failure paths.
3. Complete the AI launch end-to-end journeys and runtime audit.
4. Verify the full AI launch acceptance across submission, payment, ranking, product pages, sharing, stats, click tracking, moderation, SEO, mobile, and themes.
5. After AI launch validation, evaluate whether the Games expansion is strategically justified; if started, reuse the shared marketplace primitives rather than creating a separate payment/ranking system.

## 13. Success Metrics (first 7 days post-launch)

- Paid product submissions, total $ in confirmed bids, total clicks delivered, categories with more than one competing bid, X/Twitter referral traffic, day-2+ return visits to `/today`

## 14. Risks

| Risk | Mitigation |
|---|---|
| Genre fatigue | Ship in days, not weeks |
| Chargebacks | Dodo as MoR absorbs disputes; $5 floor limits remorse |
| Spam listings | Pay-to-list floor + report/unpublish flow |
| Traffic spike | Edge caching, lean webhook path, polling architecture already avoids listener-cost blowup |
| Status-doc drift | Keep PRD and implementation status aligned with actual code and runtime verification |
| Scope dilution | Keep the launch focused on AI; future markets stay out of production until deliberately activated |

## 15. Build Order (current → AI launch)

1. Verify production Dodo product configuration and signed webhook/payment behavior.
2. Run integration/E2E coverage against Dodo test mode + Firebase emulator.
3. Complete the AI launch acceptance journeys and runtime audit.
4. Complete the combined AI E2E, security, payment, moderation, SEO, mobile, and theme acceptance audit.
5. Declare the focused AI launch ready when the above gates are satisfied.

**Future expansion:** Games is intentionally deferred. It may be revisited after the AI market is validated and should reuse the existing marketplace primitives. Open Source and Music remain later expansion phases and must not distract from unresolved AI launch blockers.
