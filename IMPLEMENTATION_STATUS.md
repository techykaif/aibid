# Ai-Bid MVP — Implementation Status

The README and PRD v2 define the product requirements. The implementation is scaffolded in `main` with the core public-market, trust, measurement, and sharing paths in place.

## Implemented

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

## Still required before production

1. Enable/configure the production Firebase project, service account, Storage bucket, and indexes/rules deployment. The current Vercel build reaches compilation successfully, but the configured Firebase project currently reports Firestore API disabled during server reads.
2. Create/configure the Dodo one-time Pay What You Want product and set its product ID. The checkout routes now use Dodo's current `product_cart[].amount` field for dynamic USD pricing.
3. Configure Dodo webhook endpoint at `/api/webhooks/dodo` and its signing secret.
4. Add logo upload through Firebase Storage.
5. Add reactive report/moderation admin tooling.
6. Add production integration/e2e tests against Dodo test mode and Firebase emulator.
7. Deploy to Vercel with production Firebase/Dodo configuration and run the first real payment flow before launch.

## Payment safety

The server never trusts a client-side “success” redirect. A product becomes live and a bid affects ranking only after a verified `payment.succeeded` webhook. Webhook processing is idempotent and Firestore updates are transactional. Dodo's signed webhook product-cart amount is the source used for the recorded bid amount; metadata is only cross-checked for consistency.

## Measurement safety

The homepage stats strip reads only the public aggregate fields from `stats/global`. It does not expose submitter email or other private product fields, and unavailable configuration shows zeroed stats rather than invented market activity.
