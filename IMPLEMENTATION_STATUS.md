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
- Dodo Payments hosted checkout integration using the current `/checkouts` payload shape
- Signed Dodo webhook verification
- Idempotent payment reconciliation using payment ID
- Webhook ranking totals derived from the signed Dodo product-cart amount rather than client metadata
- Atomic Firestore bid totals and daily rollups
- Public product API field allowlist that keeps submitter email private
- `/api/today` now also uses an explicit public field allowlist; it does not spread private Firestore fields
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
- Production pages no longer fall back to demo products or fabricated market activity; unavailable/empty Firestore states render honest empty or configuration states
- Daily leaderboard and product pages fail safely when Firestore is unavailable instead of breaking prerendering
- Homepage hero CTAs now use one consistent arrow glyph and non-kicker section labels

## Remaining launch requirements from PRD v3

1. Consolidate all UI CSS into `app/globals.css`, remove the extra stylesheet imports/files, and eliminate every `!important`; preserve both intentional light and dark themes while satisfying `AGENTS.md` constraints.
2. Add the product report link and reactive admin/moderation/unpublish tooling with a real protected admin boundary.
3. Add logo upload through Firebase Storage.
4. Verify and wire submission-time URL-resolution and profanity checks.
5. Verify production Firebase project, Storage bucket, indexes, and rules deployment using the configured environment without exposing credentials.
6. Verify production Dodo product configuration, webhook endpoint/signing secret, and payment behavior without exposing credentials.
7. Run integration/e2e coverage against Dodo test mode and the Firebase emulator, including duplicate/retry/failure paths.
8. Verify the deployed production runtime after the latest changes and complete the end-to-end launch journeys before declaring launch-ready.

## Current production verification blocker

The latest Vercel production runtime audit reached the configured Firebase project but Firestore returned `SERVICE_DISABLED` / `PERMISSION_DENIED` because the Cloud Firestore API is disabled or not yet enabled for that project. This is a production Google Cloud configuration issue, not a missing client-side environment variable. Until Firestore is enabled for the configured project (and propagation completes), `/api/today` cannot read the live market and the production launch cannot be declared healthy.

## Payment safety

The server never trusts a client-side “success” redirect. A product becomes live and a bid affects ranking only after a verified `payment.succeeded` webhook. Webhook processing is idempotent and Firestore updates are transactional. Dodo's signed webhook product-cart amount is the source used for the recorded bid amount; metadata is only cross-checked for consistency.

## Measurement and privacy safety

Public product responses use explicit allowlists and do not expose submitter email. The homepage stats strip reads only public aggregate fields from `stats/global`. Unavailable configuration shows zeroed stats rather than invented market activity.
