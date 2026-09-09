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
- Firestore security rules and composite indexes
- Environment variable template
- Public Terms, Privacy, Rules, and FAQ pages
- Product report form, persistence endpoint, protected admin login, and moderation queue
- Admin moderation can dismiss reports or reject reported products; rejection and logo cleanup are transactional
- UI CSS is consolidated into `app/globals.css`; documented dual-theme tokens, allowed radii, sans-only typography, no `!important`, and no box-shadow declarations
- Main-branch CI runs TypeScript no-emit typecheck, ESLint, and production build before the public production smoke suite
- Next.js 16 linting uses the supported ESLint CLI/flat config
- Production smoke coverage checks homepage, public APIs, AI category routes, homepage/sitemap exclusion of deferred Games, deferred Games route inactivity (`404` + `noindex`), SEO/legal routes, invalid product/redirect/logo/badge IDs, checkout cancellation, private-email leakage, malformed checkout requests, unsigned Dodo webhooks, removed Games checkout requests, SSRF boundary handling, and one real live product's public page/badge/logo when production has live data
- Production smoke never creates a real payment or mutates production click/payment state
- ESLint is pinned to the ESLint 9 major so the Next.js 16 ESLint configuration's React rules remain compatible with the lint rule API

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

- **2026-09-09 06:41 IST:** GitHub Actions run `112` for `f8238a591c3798606ad8788e5800c22f75463bcc` reached TypeScript success but failed at ESLint before build/smoke. The failure was an ESLint 10 incompatibility in `react/display-name` (`contextOrFilename.getFilename is not a function`) from the Next.js-bundled React plugin. The repository's `eslint` dependency was therefore pinned from the incompatible 10.x range to the compatible 9.x major; build/smoke were skipped by that failed run and remain to be revalidated on the next push.
- **2026-09-09 06:20 IST:** latest `main` commit `2a8ba60aac0bd411615044d4f3c541095fca5b5f` adds production-smoke regression coverage preventing deferred Games from appearing on the homepage or sitemap. The previous production deployment for `fb235c64dc2fa3b2eca174ee7a2b8e76b8f23fdb` is `READY`; the new commit has not yet received a Vercel status result at this check.
- **2026-09-09 06:20 IST:** the latest READY production deployment for `fb235c64dc2fa3b2eca174ee7a2b8e76b8f23fdb` responds successfully on `/api/today` with HTTP 200 JSON. Vercel runtime error/fatal logs for the latest deployment in the checked one-hour window returned no entries.
- Previous fresh production reads of `/api/products?limit=1` returned a real live AI product; no fabricated/demo fallback was observed.
- The live AI category route `/category/coding` returned HTTP 200 with the expected AI-only category navigation and server-rendered leaderboard.
- The deferred Games category route `/category/games-action` returned HTTP 404 with `noindex`, confirming it is not an active launch surface.
- The live product's Firestore-backed logo route returned HTTP 200 with `Content-Type: image/webp`, `X-Content-Type-Options: nosniff`, `Cache-Control: public, max-age=86400`, and a 1,590-byte binary payload, well below the 180KB application ceiling.
- The previously recorded `/api/today` `SERVICE_DISABLED` / `PERMISSION_DENIED` Firestore blocker is cleared at runtime. Fresh production reads confirm the configured server-side Firestore path is responding.

Production smoke previously exposed composite-index failures on public ranking/product/OG paths. Those reads were changed to bounded equality-only reads with deterministic server-side sorting, and the live product page, rank badge, and product OG image were subsequently verified successfully.

The production smoke suite probes payment trust boundaries without creating a charge: malformed checkout requests return HTTP 400 and unsigned Dodo webhook requests return HTTP 401 JSON. These checks do not substitute for a real Dodo test-mode payment and signed webhook reconciliation.

The server never trusts a client-side success redirect. A product becomes live and a bid affects ranking only after a verified `payment.succeeded` webhook. Webhook processing is idempotent and Firestore updates are transactional. The server-created checkout intent is the authoritative USD bid amount; signed Dodo product/quantity and settlement data are independently verified, while metadata is only cross-checked.

## Measurement and privacy safety

Public product responses use explicit allowlists and do not expose submitter email. Homepage stats read only public aggregate fields from `stats/global`. Unavailable configuration shows honest zero/configuration states rather than invented market activity.

## Moderation safety

Reports are accepted only for existing live products and store a bounded reason with an open status. The moderation queue requires the server-side `ADMIN_TOKEN`; no Firestore client access is opened for moderation. Unpublish changes only the product status to `rejected`, while dismissing a report leaves the product live. Rejection and logo cleanup are performed in the same Firestore transaction to avoid leaving inaccessible orphaned logo documents.
