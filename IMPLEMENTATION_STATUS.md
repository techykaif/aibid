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
- Product report form and report persistence endpoint
- Protected admin login and moderation queue using the server-side `ADMIN_TOKEN` boundary
- Admin moderation actions can dismiss reports or set a reported product to `rejected`
- Firestore composite index for open moderation reports

## Remaining launch requirements from PRD v3

1. Consolidate all UI CSS into `app/globals.css`, remove the extra stylesheet imports/files, and eliminate every `!important`; preserve both intentional light and dark themes while satisfying `AGENTS.md` constraints.
2. Deploy and verify the configured production Firebase Storage bucket and Storage rules; the code and default-deny rules are now present, but this run cannot claim the live bucket configuration is verified until the new deployment is serving the upload path.
3. Verify production Dodo product configuration, webhook endpoint/signing secret, and payment behavior without exposing credentials.
4. Run integration/e2e coverage against Dodo test mode and the Firebase emulator, including duplicate/retry/failure paths.
5. Complete the end-to-end launch journeys and verify the deployed production runtime before declaring launch-ready.

## Current production verification

The previously recorded `/api/today` `SERVICE_DISABLED` / `PERMISSION_DENIED` Firestore blocker is cleared at runtime. A fresh production deployment read of `/api/today` returned HTTP 200 with an empty JSON array, confirming the configured server-side Firestore path is reachable. Production runtime error aggregation for the latest verified window also returned no error entries. The live market is currently empty rather than populated with fabricated/demo data.

## Payment safety

The server never trusts a client-side “success” redirect. A product becomes live and a bid affects ranking only after a verified `payment.succeeded` webhook. Webhook processing is idempotent and Firestore updates are transactional. Dodo's signed webhook product-cart amount is the source used for the recorded bid amount; metadata is only cross-checked for consistency.

## Measurement and privacy safety

Public product responses use explicit allowlists and do not expose submitter email. The homepage stats strip reads only public aggregate fields from `stats/global`. Unavailable configuration shows zeroed stats rather than invented market activity.

## Moderation safety

Reports are accepted only for existing live products and store a bounded reason with an open status. The moderation queue requires the server-side `ADMIN_TOKEN`; no Firestore client access is opened for moderation. Unpublish changes only the product status to `rejected`, while dismissing a report leaves the product live.
