# ai-bid.lol — Product Requirements Document (v3, complete spec)

**Domain:** ai-bid.lol · **Repo:** github.com/techykaif/aibid
**Status key used throughout:** ✅ Built & verified · ⚠️ Built but needs a fix · ⬜ Not yet built
**Purpose of this revision:** a single, complete spec covering every feature of the app as it stands plus everything still to build — meant to be the standing reference for continued implementation, not just a delta from the last pass.

---

## 1. Overview

ai-bid.lol is a pay-to-rank public leaderboard for AI tools and AI-built products, modeled on outbid.lol's mechanic and scoped to a single audience. Anyone can list a product and pay to climb the board; highest cumulative bid holds the top spot in its category. The product is split into category sub-boards with permanent, SEO-indexable product pages, so it works as a viral mechanic in week one and a real directory after the novelty fades.

## 2. Goals

- Ship fast — this genre lives or dies on being early
- Generate real bidding activity and shareable "I got outbid" moments
- Leave behind a durable, search-indexable AI-tools directory
- Match the trust/transparency signals that made outbid.lol credible (live stats, click counts, legal pages) — these are load-bearing, not decoration

### Non-Goals

- User accounts/login — anonymous-with-email only
- Subscriptions/recurring billing — every bid is one-time
- Comments, reviews, ratings
- "Claim your listing" ownership transfer flow
- Native mobile app
- Multi-currency bidding — USD only

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

### 5.1 Submission ✅
Fields: name, URL, tagline, description (optional), category, X/Twitter handle (optional), email (required, private). Submission + first bid happen in one checkout.
- **Logo upload ⬜** — deferred until Firebase Storage is configured. Until then, listings render without a logo image (placeholder).

### 5.2 Bidding ✅
- New product: submission form doubles as first bid (min $5)
- Existing product: "Bid" button → amount input (min $1) → Dodo checkout
- Anonymous bidding allowed — `bidderName`/`bidderTwitter` optional, unset bids show as "Anonymous"

### 5.3 Leaderboards ✅
- **All-time** (`/`) — every category, tabbed
- **Category** (`/category/[slug]`) — permanent, SEO-indexable, one per category
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
- **Report link on product pages** ⬜ — not yet built (see 5.9)

### 5.9 Moderation & Anti-Spam
- Paid $5+ floor is the primary spam control ✅
- New products go live immediately on payment confirmation ✅
- Automated URL-resolves + profanity-filter check on submission — **verify this is actually wired in; not confirmed in latest review**
- **Report link + admin review/unpublish tooling ⬜** — not yet built. Rules and Privacy pages already describe this as if it exists — close this gap before it's a stated-but-false claim to users.

### 5.10 Payments ✅
Dodo Payments as sole processor, Merchant of Record, USD only. See Section 8.

## 6. Categories (final)

1. AI Coding & Dev Tools
2. AI Writing & Content
3. AI Image & Design
4. AI Video & Audio
5. AI Agents & Automation
6. AI Productivity & Chat
7. Other / Uncategorized

## 7. Data Model (Firestore)

### `products`

| Field | Type | Notes |
|---|---|---|
| name, url, tagline, description, category, twitterHandle | string | as submitted |
| logoUrl | string \| null | null until logo upload ships |
| email | string | **private — never in any public response, see Section 9** |
| totalBidUSD | number | drives ranking |
| bidCount | number | |
| clicks | number | incremented by `/go/[productId]` |
| status | enum | `pending` \| `live` \| `rejected` |
| createdAt, lastBidAt | timestamp | |

### `bids`
Document ID = Dodo `paymentId` (idempotency by construction).

| Field | Type |
|---|---|
| productId, amount, currency, amountUSD, bidderName, bidderTwitter, dodoPaymentId, status, createdAt | as implemented |

### `dailyStats/{YYYY-MM-DD}/entries/{productId}`
`totalBidTodayUSD`, `bidCountToday`

### `stats/global`
`totalRevenueUSD`, `totalProducts`, `totalBids`

## 8. Payment Flow (Dodo Payments) ✅

1. Client submits form/bid → server validates with zod → the same validated number drives both the Dodo charge and the checkout metadata.
2. Checkout created against Dodo, `product_currency: "USD"`.
3. Dodo sends a signed webhook to `/api/webhooks/dodo` on `payment.succeeded`.
4. Signature verified via `standardwebhooks` before anything in the payload is trusted.
5. **Amount is taken from Dodo's own `product_cart[].amount`, not from client-supplied metadata** — metadata `bidUSD` is only cross-checked for consistency and rejected on mismatch. This is stronger than a metadata-trust model.
6. Currency and Dodo product ID are both validated against expected values.
7. Idempotency: `bids` doc ID = Dodo payment ID; existing doc short-circuits the transaction.
8. One transaction: writes the bid, updates `products.totalBidUSD/bidCount/lastBidAt/status`, updates `dailyStats`, updates `stats/global` (including `totalProducts` incremented only on a product's first confirmed bid).
9. Failure/cancellation: nothing written, user sees retry state.

**Dodo onboarding:** register as **Individual**, not Organization, unless under a registered entity.

## 9. Security Requirements

- **Never spread a full Firestore document into a public response.** `email` lives on the same `products` doc as everything else — every public-facing read must explicitly allowlist fields.
  - `/api/products` — ✅ fixed, allowlists correctly
  - **`/api/today` — ⚠️ NOT fixed.** Still does `{ id: p.id, ...p.data(), ... }`, which includes `email`. This is a live bug, not a documented gap — fix this before anything else in this document.
- Webhook payloads are untrusted until signature-verified; never write to Firestore before verification succeeds ✅
- Checkout amount and recorded bid amount must always derive from the same server-validated/Dodo-confirmed number, never a client-supplied one taken alone ✅
- Redirect endpoints (`/go/[productId]`) must validate destination URL scheme before redirecting, to prevent open-redirect abuse ✅

## 10. Design System

Full ruleset lives in `AGENTS.md` under "Design system constraints" — treat that file as the enforced source of truth for anyone (human or agent) touching UI code. Summary:

- **One stylesheet.** `app/globals.css` only. ⚠️ **Not yet true in the repo** — `premium.css`, `market-primer.css`, `ui-polish.css`, `bid-polish.css`, `mobile-parity.css` are all still imported in `layout.tsx`. Consolidate into `globals.css` (organized by section comment) and delete the rest. Zero `!important` once consolidated.
- **Dual theme, intentional.** Both light and dark are first-class, not one designed and one inverted. Token set:

```css
:root {
  color-scheme: light;
  --bg: #fafafa; --bg-glow: #fff3e6; --surface: #ffffff; --border: #e0e0e0;
  --text-primary: #0d0d0d; --text-secondary: #585858; --text-tertiary: #8a8a8a;
  --accent: #ff7a00; --accent-ink: #090909;
  --danger: #d64545; --success: #178a4c;
}
html.dark {
  color-scheme: dark;
  --bg: #080808; --bg-glow: #2a1700; --surface: #0d0d0d; --border: #292929;
  --text-primary: #f5f5f5; --text-secondary: #a9a9a9; --text-tertiary: #767676;
  --accent: #ff7a00; --accent-ink: #090909;
  --danger: #ff6b6b; --success: #75e6a1;
}
```
`--accent` and `--accent-ink` are identical in both themes, deliberately — the primary button, active tab, and rank-1 highlight should render pixel-identical regardless of theme; only background/surface/border/text shift. `--bg-glow` is used once, in the hero, in both themes.
- **No box-shadow anywhere** — borders and surface contrast do the separation job in both themes.
- **No monospace font** — one sans stack, no exceptions for labels/tickers/step numbers.
- **Radius:** 8px (inputs, pills, thumbnails) / 12px (buttons, tabs) / 16px (cards). No other value.
- **Eyebrow/kicker label** used exactly once, in the hero. No `.section-kicker` reused elsewhere.
- **One arrow style if used at all.** ⚠️ Currently violated — the two hero CTAs use two different glyphs (`→` and `↗`). Pick one.
- No hero widgets, hover-underline nav, sticky/blurred header, or backdrop-filter unless explicitly requested first.

## 11. Non-Functional Requirements

- All reads/writes go through server routes on the Admin SDK; `firestore.rules` denies all direct client access — keep this
- Polling (not `onSnapshot`) behind cached API routes — final architecture, not interim
- Mobile-first — most share traffic arrives via X/Twitter's in-app browser
- SEO — sitemap.ts, robots.ts in place; verify per-page meta tags are set on category/product routes
- Resilience — lean on Vercel edge caching; outbid.lol saw real downtime under its own spike

## 12. Known Gaps (prioritized)

1. **Fix `/api/today` email leak** — same allowlist fix already applied to `/api/products`
2. **CSS consolidation** — fold the five extra stylesheets into `globals.css`, remove the imports, drop all `!important`
3. **One arrow glyph**, not two, across hero CTAs
4. **Report link + admin/moderation tooling** — Rules/Privacy pages already describe this; build it so the claim is true
5. **Logo upload** via Firebase Storage
6. **Verify submission-time URL-resolves/profanity check** is actually implemented, not just planned
7. **Production config**: Firebase project/Storage/indexes, Dodo product ID + webhook secret, then run one real end-to-end payment before launch
8. **Automated tests** against Dodo test mode + Firebase emulator

## 13. Success Metrics (first 7 days post-launch)

- Paid product submissions, total $ in confirmed bids, total clicks delivered, categories with more than one competing bid, X/Twitter referral traffic, day-2+ return visits to `/today`

## 14. Risks

| Risk | Mitigation |
|---|---|
| Genre fatigue | Ship in days, not weeks |
| Chargebacks | Dodo as MoR absorbs disputes; $5 floor limits remorse |
| Spam listings | Pay-to-list floor + report/unpublish flow (once built) |
| Traffic spike | Edge caching, lean webhook path, polling architecture already avoids listener-cost blowup |
| Status-doc drift | `IMPLEMENTATION_STATUS.md` currently claims the email-allowlist fix is complete for "public product API" broadly — it's only true for one of two endpoints. Update status docs only after verifying the actual code, not the intent. |

## 15. Build Order (current → launch)

1. Fix `/api/today` email leak (Section 9)
2. CSS consolidation into `globals.css`, drop extra files and `!important` (Section 10)
3. Report/moderation tooling so Rules/Privacy pages describe real behavior
4. Logo upload via Firebase Storage
5. Confirm/wire submission-time content checks
6. Configure production Firebase (project, Storage, indexes, rules deploy)
7. Configure production Dodo (product ID, webhook secret)
8. Run one real end-to-end payment in test mode, then production
9. Basic integration tests against Dodo test mode + Firebase emulator
10. Launch
