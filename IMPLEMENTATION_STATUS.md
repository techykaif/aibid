# Ai-Bid — Implementation Status

`PRD v3.md` is the current complete product specification and launch acceptance reference. `PRD v3.1.md` is the newer architecture addendum and supersedes the v3 logo-storage section. `AGENTS.md` remains the enforced UI/design-system source of truth.

## Implemented / verified in code

- Next.js + TypeScript application shell
- Mobile-first leaderboard UI
- All-time leaderboard API with category filtering
- Permanent AI category board routes
- Daily leaderboard (`/today`) with UTC reset semantics
- Product detail pages and bid history
- Anonymous AI product submission flow
- Submission-time product URL reachability check with bounded timeout
- Submission-time URL resolver blocks localhost, private/link-local IP targets, embedded credentials, IPv4-mapped private/loopback targets, and revalidates each HTTP(S) redirect target against public DNS/IP space
- Submission-time basic profanity filter for product name and tagline
- Firestore-backed logo upload: PNG/JPG/SVG uploads are decoded, resized, metadata-stripped, converted to WebP, and compressed to a conservative sub-180KB payload before persistence
- Firestore logo documents use a dedicated `productLogos/{productId}` record and are served through a live-product-checked `/api/logo/[id]` route
- Logo upload cleanup on failed checkout creation; moderation rejection transactionally removes the associated logo document; direct browser Firestore access remains blocked by default-deny rules
- Dodo Payments hosted checkout integration using the current `/checkouts` payload shape
- Dodo checkout requests keep Ai-Bid bid amounts denominated in USD while allowing Dodo Adaptive Currency to localize eligible customer checkout currencies and payment methods
- Signed Dodo webhook verification
- Checkout intents bind each Dodo checkout session ID to the server-derived product, flow, Dodo product ID, and USD bid amount before the checkout URL is returned
- Checkout-intent persistence is retried with bounded backoff after Dodo returns a checkout session
- Payment reconciliation derives product, flow, and authoritative USD bid amount from the server-created checkout intent; Dodo metadata is only cross-checked
- Payment reconciliation validates signed Dodo product/quantity and exact signed USD settlement amount
- Idempotent payment reconciliation using payment ID, with checkout intent cleanup after successful reconciliation
- Verified webhook delivery that arrives before its checkout intent returns retryable HTTP 503 rather than incorrectly suppressing provider retries
- Webhook enforces the $5 new-product / $1 existing-product minimum from trusted server-side payment context
- Explicit Dodo checkout cancellation route exists for both new-product and existing-product checkout flows
- Atomic Firestore bid totals and daily rollups
- Public product API and `/api/today` use explicit field allowlists that keep submitter email private
- Public products/leaderboard/product/rank reads remain functional without depending on unavailable composite ranking indexes by using bounded equality-only reads with deterministic server-side sorting
- Tracked outbound product redirects at `/go/[productId]` with atomic click counts and HTTP(S)-only destination validation
- Public global market stats API and transactional stats rollup
- Homepage market stats strip backed by `stats/global`
- Embeddable SVG rank badge endpoint
- Dynamic product Open Graph image route with live category rank
- SEO sitemap and robots metadata
- Product pages emit live-product-only canonical URLs, index/follow directives, per-product title/description, Open Graph/Twitter metadata, and the existing rank-aware `opengraph-image` route
- AI category pages emit explicit canonical URLs, index/follow directives, category-specific title/description, and Open Graph/Twitter metadata
- Today page emits explicit canonical, index/follow, Open Graph, and Twitter metadata
- Submission page is explicitly excluded from search indexing while remaining followable
- Report page is explicitly excluded from search indexing while remaining reachable for moderation/report workflows
- Sitemap includes live product URLs from Firestore, while retaining the static AI category/submit entries and failing safely to those static entries if the optional live-product read is unavailable
- Canonical SEO host is documented as `https://www.ai-bid.lol`; robots/sitemap and page metadata fallbacks now use the same host
- Firestore security rules and composite indexes
- Environment variable template
- Public Terms, Privacy, Rules, and FAQ pages
- Product report form, persistence endpoint, protected admin login, and moderation queue
- Admin moderation can dismiss reports or reject reported products; rejection and logo cleanup are transactional
- UI CSS is consolidated into `app/globals.css`; documented dual-theme tokens, allowed radii, sans-only typography, no `!important`, and no box-shadow declarations
- Main-branch CI runs TypeScript no-emit typecheck, ESLint, and production build before the public production smoke suite
- Next.js 16 linting uses the supported ESLint CLI/flat config
- Production smoke coverage checks homepage, Today, public APIs, AI category routes, AI-only submission categories, homepage/sitemap exclusion of deferred Games, deferred Games route inactivity (`404` + `noindex`), canonical apex-to-www redirect behavior, canonical URLs and Open Graph/Twitter metadata on representative indexable pages, SEO/legal routes, invalid product/redirect/logo/badge IDs, checkout cancellation, private-email leakage, malformed checkout requests, unsigned Dodo webhooks, removed Games checkout requests, SSRF boundary handling, and one real live product's public page/SEO metadata/badge/logo when production has live data
- Production smoke never creates a real payment or mutates production click/payment state
- Production smoke explicitly verifies `robots.txt` declares the canonical `https://www.ai-bid.lol/sitemap.xml` and does not expose deferred Games surfaces
- Production API responses now emit `X-Robots-Tag: noindex, nofollow` through the Next.js header configuration, and production smoke asserts that boundary
- Production smoke asserts the rendered `/submit` surface contains AI categories and no Games/Open Source/Music options
- Production smoke asserts the `/report` moderation surface is `noindex, nofollow`
- ESLint is pinned to the ESLint 9 major so the Next.js 16 ESLint configuration's React rules remain compatible with the lint rule API
- Vercel Web Analytics is installed globally through the Next.js root layout
- 404 responses have an explicit `noindex,nofollow` boundary rather than inheriting a root index directive
- Malformed Dodo webhook requests missing required signature headers are rejected with HTTP 401 before verification
- `/today` uses the established `board-label` treatment for the market label instead of an undeclared/reused `section-kicker` style
- `/submit` uses the established `board-label` treatment for its non-hero section labels instead of reusing the hero-only `eyebrow` style
- Production workflow now runs a dedicated SEO-boundary smoke that verifies sitemap XML content, canonical `www.ai-bid.lol` URL hosts, deferred-market exclusion, and the rendered 404 `noindex,nofollow` boundary
- Production workflow now runs an AI-category SEO smoke that verifies every active AI category route returns 200, has its exact canonical URL, emits Open Graph/Twitter metadata, and does not expose deferred-market terms
- AI-category SEO smoke now also verifies HTML title/description plus Open Graph title/description/image and Twitter title/description metadata for every active AI category route
- Production workflow retries the public production smoke up to three times with a five-second delay between attempts, preserving all existing assertions and failing after the final attempt; this is specifically to distinguish transient network/DNS failures from deterministic production failures
- Production workflow now continues the dedicated SEO-boundary and AI-category smoke checks even when public production smoke fails, while preserving the final failure state; this keeps downstream SEO diagnostics available instead of skipping them after an earlier smoke failure
- AI-category SEO smoke now tolerates valid HTML attribute ordering while still requiring non-empty title/description/Open Graph/Twitter metadata

## Launch scope and roadmap

The launch is intentionally **AI-only**. Games has been removed from the active launch market and moved to a future expansion phase. Open Source and Music remain future expansions. Future markets must not appear as live categories, submission options, navigation, or fabricated production listings until deliberately activated.

1. **AI** — sole current launch market
2. **Games** — future expansion after AI validation
3. **Open Source** — future expansion
4. **Music** — future expansion
5. Additional markets only after the core mechanic and earlier phases are validated

The shared marketplace primitives remain reusable so a future market can be added without creating a separate payment/ranking system.

## Remaining AI launch requirements

1. Verify production Dodo product configuration, webhook endpoint/signing secret, Adaptive Currency setting, and payment behavior without exposing credentials.
2. Run integration/e2e coverage against Dodo test mode and the Firebase emulator, including duplicate/retry/failure paths.
3. Complete the AI launch end-to-end journeys and deployed runtime audit.
4. Complete the combined AI E2E/security/payment/moderation/SEO/mobile/theme acceptance audit before declaring launch ready.

## Current production verification

- **2026-09-11 05:58 IST:** latest `main` includes `9eaf76a2617ff5870ad4fe8885071ca2064b095b` (`test: make AI category metadata smoke attribute-order tolerant`). The preceding `c4620b9…` documentation state had no exposed GitHub Actions workflow run. No new CI or final Vercel result is claimed yet.
- **2026-09-11 05:58 IST:** recurring AI-category SEO smoke was hardened so valid HTML attribute ordering cannot cause false failures. It still requires HTTP 200, exact canonical URL, non-empty title/description, Open Graph title/description/image, Twitter card/title/description, and deferred-market exclusion for all seven authoritative AI category slugs.
- **2026-09-11 05:58 IST:** the production workflow remains configured to run TypeScript, ESLint, production build, public production smoke with three retries, SEO-boundary smoke, AI-category smoke, and a final failure when public smoke fails.
- **2026-09-11 05:58 IST:** source/spec audit rechecked `AGENTS.md`, PRD v3, PRD v3.1, implementation status, recent main commits, and the active AI-only taxonomy. No newer product-spec document was identified. The seven authoritative AI slugs are `coding`, `writing`, `image`, `video`, `agents`, `productivity`, and `other`; Games/Open Source/Music remain future-only.
- **2026-09-11 05:58 IST:** direct production DNS/HTTP access remains unavailable from this execution environment. Therefore fresh crawler-visible HTML, sitemap contents, live-product responses, Firebase production state, payment success, click state, or production health are not claimed.
- **2026-09-11 05:58 IST:** the recurring feature-wiring/SEO source audit confirms the implemented AI category routes, Today, product pages, submission, report/moderation, public projections, tracked redirects, logos, robots/sitemap, API/private/error noindex boundaries, and Dodo server-authoritative flow remain wired in source. The metadata-smoke hardening changes test robustness only and does not change runtime application behavior.
- **2026-09-11 05:58 IST:** the remaining highest-impact launch acceptance gates are external execution requirements: real Dodo test-mode payment → signed webhook → checkout-intent reconciliation → idempotent Firestore activation → totals/rank/daily stats/public visibility; production Dodo configuration verification; a real deployed logo upload/read verification; and Firebase emulator/integration E2E covering duplicate/retry/failure/cancellation. These remain unpassed because no provider/emulator/live Firebase execution evidence is available in this run.

## Measurement and privacy safety

Public product responses use explicit allowlists and do not expose submitter email. Homepage stats read only public aggregate fields from `stats/global`. Unavailable configuration shows honest zero/configuration states rather than invented market activity.

## Moderation safety

Reports are accepted only for existing live products and store a bounded reason with an open status. The moderation queue requires the server-side `ADMIN_TOKEN`; no Firestore client access is opened for moderation. Unpublish changes only the product status to `rejected`, while dismissing a report leaves the product live. Rejection and logo cleanup are performed in the same Firestore transaction to avoid leaving inaccessible orphaned logo documents.
