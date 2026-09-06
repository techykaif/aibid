# Ai-Bid — Implementation Status

`PRD v3.md` is the current complete product specification and launch acceptance reference. `AGENTS.md` remains the enforced UI/design-system source of truth.

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
- Firebase Storage logo upload from the submission flow with PNG/JPG/SVG validation and a 2MB limit
- Server-side signed logo URLs with cleanup on failed checkout creation
- Firebase Storage default-deny security rules; browser/client Storage access remains blocked
- Dodo Payments hosted checkout integration using the current `/checkouts` payload shape
- Signed Dodo webhook verification
- Idempotent payment reconciliation using payment ID
- Webhook ranking totals derived from the signed Dodo product-cart amount rather than client metadata
- Webhook cart validation requires exactly one expected product item and quantity 1
- Webhook enforces the $5 new-product / $1 existing-product minimum based on the signed payment context
- Atomic Firestore bid totals and daily rollups
- Public product API field allowlist that keeps submitter email private
- `/api/today` now also uses an explicit public field allowlist; it does not spread private Firestore fields
- Public products API and leaderboard reads remain functional even if the production composite ranking indexes are not deployed yet: bounded equality-only Firestore reads are filtered/sorted server-side
- Tracked outbound product redirects at `/go/[productId]` with click counts
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

## Remaining launch requirements from PRD v3

1. Deploy and verify the configured production Firebase Storage bucket and Storage rules; the code and default-deny rules are present, but live upload behavior still needs deployment/runtime verification.
2. Verify production Dodo product configuration, webhook endpoint/signing secret, and payment behavior without exposing credentials.
3. Run integration/e2e coverage against Dodo test mode and the Firebase emulator, including duplicate/retry/failure paths.
4. Complete the end-to-end launch journeys and verify the deployed production runtime before declaring launch-ready.

## Current production verification

The previously recorded `/api/today` `SERVICE_DISABLED` / `PERMISSION_DENIED` Firestore blocker is cleared at runtime. A fresh production deployment read of `/api/today` returned HTTP 200 with an empty JSON array, confirming the configured server-side Firestore path is reachable. Production runtime error aggregation for the latest verified window also returned no error entries. The live market is currently empty rather than populated with fabricated/demo data.

The production smoke workflow initially exposed a real `/api/products` HTTP 500 on the deployed revision because the ranking query depended on a composite index that was not available at runtime. The public products API and server-rendered leaderboard were changed to use bounded equality-only reads with deterministic in-memory filtering/sorting as a safe fallback. The subsequent `main` smoke run completed successfully, including the products API, confirming the deployed public read path is healthy without requiring that composite index to be present.

The smoke suite now also asserts that a clearly invalid `/go/[productId]` path returns HTTP 404 rather than redirecting, adding a production regression check around the outbound redirect boundary.

## Payment safety

The server never trusts a client-side “success” redirect. A product becomes live and a bid affects ranking only after a verified `payment.succeeded` webhook. Webhook processing is idempotent and Firestore updates are transactional. Dodo's signed webhook product-cart amount is the source used for the recorded bid amount; metadata is only cross-checked for consistency. The webhook also rejects malformed multi-item/quantity payloads and amounts below the applicable minimum.

## Measurement and privacy safety

Public product responses use explicit allowlists and do not expose submitter email. The homepage stats strip reads only public aggregate fields from `stats/global`. Unavailable configuration shows zeroed stats rather than invented market activity.

## Moderation safety

Reports are accepted only for existing live products and store a bounded reason with an open status. The moderation queue requires the server-side `ADMIN_TOKEN`; no Firestore client access is opened for moderation. Unpublish changes only the product status to `rejected`, while dismissing a report leaves the product live.
