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
- Submission-time URL resolver blocks localhost, private/link-local IP targets, embedded credentials, IPv4-mapped private/loopback targets, and revalidates each HTTP(S) redirect target against public DNS/IP space
- Submission-time basic profanity filter for product name and tagline
- Firestore-backed logo upload: PNG/JPG/SVG uploads are decoded, resized, metadata-stripped, converted to WebP, and compressed to a conservative sub-180KB payload before persistence
- Firestore logo documents use a dedicated `productLogos/{productId}` record and are served through a live-product-checked `/api/logo/[id]` route
- Logo API responses enforce the same sub-180KB WebP safety bound and reject unexpected stored content types before serving bytes
- Logo upload cleanup on failed checkout creation; direct browser Firestore access remains blocked by default-deny rules
- Dodo Payments hosted checkout integration using the current `/checkouts` payload shape
- Dodo checkout requests keep Ai-Bid bid amounts denominated in USD while allowing Dodo Adaptive Currency to localize eligible customer checkout currencies and payment methods
- Signed Dodo webhook verification
- Idempotent payment reconciliation using payment ID
- Dodo webhook product cart is validated from the signed payload for the expected product and quantity; the webhook does not currently expose a per-line amount, so the server-created checkout amount is retained as the Ai-Bid ledger amount and signed metadata is cross-checked for consistency
- Webhook enforces the $5 new-product / $1 existing-product minimum based on the server-created bid amount and signed payment context
- Webhook returns 401 only for signature/parse failures and 400 for verified-but-unreconcilable payment payloads or product state, avoiding misleading auth failures and unnecessary webhook retry pressure
- Atomic Firestore bid totals and daily rollups
- Public product API field allowlist that keeps submitter email private
- `/api/today` now also uses an explicit public field allowlist; it does not spread private Firestore fields
- Public products API and leaderboard reads remain functional even if the production composite ranking indexes are not deployed yet: bounded equality-only Firestore reads are filtered/sorted server-side
- Product pages, rank badges, and product OG rank reads also avoid required composite ranking indexes by using bounded equality-only reads with deterministic server-side sorting
- Product pages preserve real 404 responses for missing/non-live IDs instead of converting `notFound()` into a false 200 error state
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
- Public production smoke coverage checks the homepage, public APIs, SEO endpoints, legal pages, JSON content types, absence of private email fields, invalid outbound product IDs, invalid product pages, invalid logo IDs, invalid badge IDs, and representative AI/Games category routes; it runs on every main-branch push and can be dispatched manually
- Production smoke coverage now also exercises the payment security boundaries without creating a real payment: malformed checkout requests must return HTTP 400 and unsigned Dodo webhook requests must return HTTP 401 JSON
- Production smoke coverage now also verifies that AI/Games market-category mismatches are rejected with HTTP 400 before any payment or external product URL work is attempted
- Production smoke coverage now verifies an IPv4-mapped loopback URL (`http://[::ffff:127.0.0.1]/`) is rejected with HTTP 400
- Main-branch CI now runs a TypeScript no-emit typecheck and production build before the public production smoke suite
- Launch-base market model now defines separate AI and Games market taxonomies with shared category typing
- Submission flow now lets a submitter explicitly choose AI or Games and dynamically selects only that market's categories
- Server checkout validation enforces that the submitted category belongs to the selected market and persists the market with the pending product
- Leaderboard/category navigation now exposes both AI and Games categories without creating separate payment/ranking systems
- Public product and Today projections explicitly expose the public `market` field while preserving the email/private-field allowlist
- Homepage messaging now accurately presents AI + Games as the launch-base markets

## Launch-base scope and product expansion roadmap

The complete initial launch base is **AI + Games**. AI remains the current implementation focus; Games is required before the overall launch-base acceptance. Open Source and Music remain post-launch expansion phases. Do not add dormant/mock/fabricated production listings or categories for future markets.

1. **AI** — launch-base market, current implementation focus
2. **Games** — launch-base market, required before complete launch-base acceptance
3. **Open Source** — post-launch expansion
4. **Music** — post-launch expansion
5. Additional markets only after the core mechanic and earlier phases are validated

AI and Games should reuse the verified submission, payment, ranking, product-page, sharing, stats, click-tracking, and moderation primitives rather than creating separate payment/ranking systems.

## Remaining launch-base requirements

1. Verify production Dodo product configuration, webhook endpoint/signing secret, Adaptive Currency setting, and payment behavior without exposing credentials.
2. Run integration/e2e coverage against Dodo test mode and the Firebase emulator, including duplicate/retry/failure paths.
3. Complete the AI launch-base end-to-end journeys and runtime audit.
4. Complete the Games launch-base acceptance: verify the new Games taxonomy/navigation, real submission flow, paid ranking, permanent product pages, sharing, stats, click tracking, moderation, and the same verified payment/security foundations in deployed runtime.
5. Run the combined AI + Games E2E/security/payment/moderation/SEO/mobile/theme acceptance audit before declaring the complete launch base ready.

## Current production verification

The previously recorded `/api/today` `SERVICE_DISABLED` / `PERMISSION_DENIED` Firestore blocker is cleared at runtime. Fresh production reads of `/api/today` and `/api/products` returned HTTP 200 from the configured server-side Firestore path with real live documents present. The live market is currently populated only by actual Firestore data; no fabricated/demo fallback is being used.

A real deployed logo read has now been verified in production: a live product's `/api/logo/{id}` route returned HTTP 200 with `Content-Type: image/webp`, `X-Content-Type-Options: nosniff`, `Cache-Control: public, max-age=86400`, and an actual 1.6KB stored WebP payload. This clears the previously documented real-image upload/read verification gate for the Firestore-backed logo architecture.

The production smoke workflow initially exposed a real `/api/products` HTTP 500 on a deployed revision because the ranking query depended on a composite index that was not available at runtime. The public products API and server-rendered leaderboard were changed to use bounded equality-only reads with deterministic in-memory filtering/sorting as a safe fallback. The deployed public read path is now healthy without requiring that composite index to be present.

A later production smoke run exposed a regression-check failure on `/go/[productId]`: the smoke test used `__production-smoke_invalid_product__` as an invalid Firestore document ID, and Firestore reserves IDs of that form, causing the route to return HTTP 500 before the application could produce its intended 404. The route was hardened to pre-read existence/status before entering the click-counting transaction, and the smoke test was corrected to use a non-reserved invalid ID (`production-smoke-invalid-product-9f6e4d7a`).

The production smoke suite now also verifies that a non-existent `/api/logo/[id]` request returns the intended JSON 404 instead of leaking a server error, and covers invalid product-page and badge routes as well.

A live production audit then found two rank-related Firestore composite-index dependencies that were not actually safe in the deployed project: product detail pages and rank-aware OG/badge routes. Those paths were changed to bounded equality-only reads with deterministic server-side sorting. The live product page, rank badge, and product OG image were subsequently verified successfully in production. The product page also now preserves a true HTTP 404 for a missing/non-live product instead of catching Next's `notFound()` control flow and returning HTTP 200 with an error message.

The submission URL resolver treats the destination as an untrusted server-side fetch target: it rejects private/link-local/local destinations, credential-bearing URLs, and IPv4-mapped loopback/private targets, disables automatic redirect following, bounds redirects, and revalidates every redirect target before fetching it. This closes an additional SSRF bypass through IPv4-mapped IPv6 URL literals while preserving normal public HTTP(S) product URLs.

The production smoke suite probes the payment trust boundaries without creating a charge: a malformed checkout request must be rejected with HTTP 400, and an unsigned Dodo webhook must be rejected with HTTP 401 JSON. These checks improve regression coverage for the payment boundary but do not substitute for a real Dodo test-mode payment and signed webhook reconciliation.

The checkout routes no longer force `billing_currency: "USD"`. Ai-Bid amounts remain USD-denominated internally and are sent as the dynamic product amount, while Dodo Adaptive Currency can localize the customer-facing currency and expose eligible regional methods such as INR/UPI when the merchant setting is enabled. This is intentional because Dodo documents UPI as INR-only while global credit/debit cards support all currencies.

## Payment safety

The server never trusts a client-side “success” redirect. A product becomes live and a bid affects ranking only after a verified `payment.succeeded` webhook. Webhook processing is idempotent and Firestore updates are transactional. Current Dodo payment webhook payloads expose the purchased `product_cart` item as `product_id` + `quantity`, not a per-line amount; therefore the Ai-Bid ledger uses the server-created checkout amount and only uses signed webhook metadata as a consistency cross-check. Customer-facing `currency`, `total_amount`, and settlement fields are not used as the leaderboard bid amount because Adaptive Currency and tax can make them differ from the intended USD bid. The webhook rejects malformed multi-item/quantity payloads and amounts below the applicable minimum. Signature verification failures are separated from post-verification reconciliation failures so verified-but-invalid business state is not mislabeled as an authentication failure.

## Measurement and privacy safety

Public product responses use explicit allowlists and do not expose submitter email. The homepage stats strip reads only public aggregate fields from `stats/global`. Unavailable configuration shows zeroed stats rather than invented market activity.

## Moderation safety

Reports are accepted only for existing live products and store a bounded reason with an open status. The moderation queue requires the server-side `ADMIN_TOKEN`; no Firestore client access is opened for moderation. Unpublish changes only the product status to `rejected`, while dismissing a report leaves the product live.
