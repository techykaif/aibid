# Ai-Bid MVP — Implementation Status

The README is the product requirements document. The initial implementation is now scaffolded in `main`.

## Implemented

- Next.js + TypeScript application shell
- Mobile-first leaderboard UI
- All-time leaderboard API with category filtering
- Permanent category board routes
- Daily leaderboard (`/today`) with UTC reset semantics
- Product detail pages and bid history
- Anonymous product submission flow
- Dodo Payments hosted checkout integration
- Signed Dodo webhook verification
- Idempotent payment reconciliation using payment ID
- Atomic Firestore bid totals and daily rollups
- Public product API field allowlist that keeps submitter email private
- Tracked outbound product redirects at `/go/[productId]` with click counts
- Public global market stats API and transactional stats rollup
- Embeddable SVG rank badge endpoint
- Dynamic product Open Graph image route
- SEO sitemap and robots metadata
- Firestore security rules and composite indexes
- Environment variable template
- Public Terms, Privacy, Rules, and FAQ pages

## Still required before production

1. Configure Firebase project, service account, Storage bucket, and indexes/rules deployment.
2. Create the Dodo one-time payment product and set its product ID.
3. Configure Dodo webhook endpoint at `/api/webhooks/dodo` and its signing secret.
4. Add logo upload through Firebase Storage (the current submission flow intentionally leaves logo upload out until Storage credentials are configured).
5. Add reactive report/moderation admin tooling.
6. Add a true Firestore live ticker/onSnapshot layer if traffic economics justify it; current boards use short polling to keep the initial read footprint predictable.
7. Add production integration/e2e tests against Dodo test mode and Firebase emulator.
8. Deploy to Vercel and run the first real payment flow before launch.

## Payment safety

The server never trusts a client-side “success” redirect. A product becomes live and a bid affects ranking only after a verified `payment.succeeded` webhook. Webhook processing is idempotent and Firestore updates are transactional.
