# Ai-Bid — Implementation Status

`PRD v3.md` is the current complete product specification and launch acceptance reference. `PRD v3.1.md` is the newer architecture addendum and supersedes the v3 logo-storage section. `AGENTS.md` remains the enforced UI/design-system source of truth.

## Implemented / verified in code

- Next.js + TypeScript application shell
- Mobile-first leaderboard UI
- All-time leaderboard API with category filtering
- Permanent category board routes
- Daily leaderboard (`/today`) with UTC reset semantics
- Product detail pages and bid history
- Anonymous product submission flow
- Submission-time product URL reachability check with bounded timeout
- Submission-time basic profanity filter for product name and tagline
- Firestore-backed logo upload: PNG/JPG/SVG uploads are decoded, resized, metadata-stripped, converted to WebP, and compressed to a conservative sub-180KB payload before persistence
- Firestore logo documents use a dedicated `productLogos/{productId}` record and are served through a live-product-checked `/api/logo/[id]` route
- Logo upload cleanup on failed checkout creation; direct browser Firestore access remains blocked by default-deny rules
- Dodo Payments hosted checkout integration using the current `/checkouts` payload shape
- Signed Dodo webhook verification
- Idempotent payment reconciliation using payment ID
- Webhook ranking totals derived from the signed Dodo product-cart amount rather than client metadata
- Webhook cart validation requires exactly one expected product item and quantity 1
- Webhook enforces the $5 new-product / $1 existing-product minimum based on the signed payment context
- Webhook returns 401 only for signature/parse failures and 400 for verified-but-unreconcilable payment payloads or product state, avoiding misleading auth failures and unnecessary webhook retry pressure
- Atomic Firestore bid totals and daily rollups
- Public product API field allowlist that keeps submitter email private
- `/api/today` now also uses an explicit public field allowlist; it does not spread private Firestore fields
- Public products API and leaderboard reads remain functional even if the production composite ranking indexes are not deployed yet: bounded equality-only Firestore reads are filtered/sorted server-side
- Tracked outbound product redirects at `/go/[productId]` with click counts; missing/non-live products are rejected before entering the click-counting transaction
- Public global market stats API and transactional stats rollup
- Homepage market stats strip backed by the verified `stats/global` rollup
- Embeddable SVG rank badge endpoint
- Dynamic product Open Graph image route with live category rank
- SEO sitemap and robots metadata
- Firestore security rules and composite indexes
- Environment variable template
- Public Terms, Privacy, Rules, and FAQ pages
- Homepage footer links to legal/trust pages
- Production pages no longer fall back to demo products or fabricated market activity; unavailable/empty/configuration states render honest states
- Daily leaderboard and product pages fail safely when Firestore is unavailable instead of breaking prerendering
- Homepage hero CTAs use one consistent arrow glyph and non-kicker section labels
- Product report form and report persistence endpoint
- Protected admin login and moderation queue using the server-side `ADMIN_TOKEN` boundary
- Admin moderation actions can dismiss reports or set a reported product to `rejected`
- Firestore composite index for open moderation reports
- UI CSS is consolidated into `app/globals.css`; `layout.tsx` imports only that stylesheet and the five redundant stylesheet files were removed
- Global CSS now uses the documented dual-theme tokens, allowed radius values, sans-only typography, no `!important`, and no box-shadow declarations
- Public production smoke coverage checks the homepage, public APIs, SEO endpoints, legal pages, JSON content types, absence of private email fields, and invalid outbound product IDs; it runs on every main-branch push and can be dispatched manually
- Main-branch CI now runs a TypeScript no-emit typecheck and production build before the public production smoke suite

## Product expansion roadmap

The launch market remains AI. Future markets are deliberately not enabled as dormant/mock production categories.

1. **AI** — current launch market
2. **Games** — first expansion
3. **Open Source** — third phase / developer-community market
4. **Music** — fourth phase / artist-community market
5. Additional markets only after the earlier phases and core marketplace mechanic are validated

Future markets should reuse the verified submission, payment, ranking, product-page, sharing, stats, click-tracking, and moderation primitives rather than creating separate payment or ranking systems.

## Remaining launch requirements from PRD v3

1. Verify the Firestore-backed logo path in the deployed production runtime with a real image upload; Firebase Storage is intentionally not a launch dependency because it is unavailable on the current plan.
2. Verify production Dodo product configuration, webhook endpoint/signing secret, and payment behavior without exposing credentials.
3. Run integration/e2e coverage against Dodo test mode and the Firebase emulator, including duplicate/retry/failure paths.
4. Complete the end-to-end launch journeys and verify the deployed production runtime before declaring launch-ready.

## Current production verification

The previously recorded `/api/today` `SERVICE_DISABLED` / `PERMISSION_DENIED` Firestore blocker is cleared at runtime. A fresh production deployment read of `/api/today` returned HTTP 200 with an empty JSON array, confirming the configured server-side Firestore path is reachable. Production runtime error aggregation for the latest verified window also returned no error entries. The live market is currently empty rather than populated with fabricated/demo data.

The production smoke workflow initially exposed a real `/api/products` HTTP 500 on the deployed revision because the ranking query depended on a composite index that was not available at runtime. The public products API and server-rendered leaderboard were changed to use bounded equality-only reads with deterministic in-memory filtering/sorting as a safe fallback. The subsequent `main` smoke run completed successfully, including the products API, confirming the deployed public read path is healthy without requiring that composite index to be present.

A later production smoke run exposed a regression-check failure on `/go/[productId]`: the smoke test used `__production-smoke_invalid_product__` as its invalid Firestore document ID, and Firestore reserves IDs of that form, causing the route to return HTTP 500 before the application could produce its intended 404. The route was hardened to pre-read existence/status before entering the click-counting transaction, and the smoke test was corrected to use a non-reserved invalid ID (`production-smoke-invalid-product-9f6e4d7a`). The corrected smoke run for `main` commit `e2da4a95231b0dcbc0e1709e67caeb6096bd0fb2` completed successfully (GitHub Actions run 13).

## Payment safety

The server never trusts a client-side “success” redirect. A product becomes live and a bid affects ranking only after a verified `payment.succeeded` webhook. Webhook processing is idempotent and Firestore updates are transactional. Dodo's signed webhook product-cart amount is the source used for the recorded bid amount; metadata is only cross-checked for consistency. The webhook also rejects malformed multi-item/quantity payloads and amounts below the applicable minimum. Signature verification failures are now separated from post-verification reconciliation failures so verified-but-invalid business state is not mislabeled as an authentication failure.

## Measurement and privacy safety

Public product responses use explicit allowlists and do not expose submitter email. The homepage stats strip reads only public aggregate fields from `stats/global`. Unavailable configuration shows zeroed stats rather than invented market activity.

## Moderation safety

Reports are accepted only for existing live products and store a bounded reason with an open status. The moderation queue requires the server-side `ADMIN_TOKEN`; no Firestore client access is opened for moderation. Unpublish changes only the product status to `rejected`, while dismissing a report leaves the product live.
