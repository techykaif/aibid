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
- Production smoke coverage checks homepage, Today, public APIs, AI category routes, homepage/sitemap exclusion of deferred Games, deferred Games route inactivity (`404` + `noindex`), canonical apex-to-www redirect behavior, canonical URLs and Open Graph/Twitter metadata on representative indexable pages, SEO/legal routes, invalid product/redirect/logo/badge IDs, checkout cancellation, private-email leakage, malformed checkout requests, unsigned Dodo webhooks, removed Games checkout requests, SSRF boundary handling, and one real live product's public page/SEO metadata/badge/logo when production has live data
- Production smoke never creates a real payment or mutates production click/payment state
- ESLint is pinned to the ESLint 9 major so the Next.js 16 ESLint configuration's React rules remain compatible with the lint rule API
- Vercel Web Analytics is installed globally through the Next.js root layout
- 404 responses have an explicit `noindex,nofollow` boundary rather than inheriting a root index directive
- Malformed Dodo webhook requests missing required signature headers are rejected with HTTP 401 before verification
- `/today` uses the established `board-label` treatment for the market label instead of an undeclared/reused `section-kicker` style
- `/submit` uses the established `board-label` treatment for its non-hero section labels instead of reusing the hero-only `eyebrow` style

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

- **2026-09-10 14:38 IST:** latest `main` commit is `5c95eaba403b320efd748c59316de837509ff6d3` (`docs: record latest production audit`), and Vercel production deployment `dpl_CXhU87gvsj8nY4kSVt8FLtnSeQqt` is `READY` from that exact commit. It is aliased to `www.ai-bid.lol`, `ai-bid.lol`, and the project's Vercel aliases.
- **2026-09-10 14:38 IST:** Vercel reports no runtime error clusters in the preceding two hours. This is a bounded observability result, not a claim of complete application health.
- **2026-09-10 14:38 IST:** the production deployment's `/robots.txt` was fetched successfully from the protected Vercel deployment URL and returned HTTP 200 with `Sitemap: https://www.ai-bid.lol/sitemap.xml`; Vercel also adds `X-Robots-Tag: noindex` to the robots resource. The deployment root and `/sitemap.xml` are protected by Vercel SSO in this execution environment, so no crawler-visible HTML or sitemap body is claimed from those protected responses.
- **2026-09-10 14:38 IST:** recurring source audit rechecked `AGENTS.md`, PRD v3, PRD v3.1, implementation status, recent commits, and product-spec search results. No newer product-spec document was identified. The source tree has no remaining `section-kicker`, `transition: all`, `!important`, `box-shadow`, or monospace-style matches in the repository search used for this audit; remaining `eyebrow` usage is limited to intended hero surfaces.
- **2026-09-10 14:38 IST:** active-market regression remains AI-only. Games/Open Source/Music are future roadmap items and are not exposed as active categories or submission markets. Existing production smoke coverage explicitly checks deferred Games exclusion.
- **2026-09-10 14:38 IST:** the payment implementation remains server-authoritative in source: checkout intents bind server-derived USD amounts and product/flow context, signed Dodo settlement data is independently validated, metadata is only cross-checked, webhook processing is idempotent, and verified webhooks—not success redirects—activate bids/products. No real payment was created during this audit.
- **2026-09-10 14:38 IST:** the latest production acceptance blockers remain external execution gates: real Dodo test-mode payment + signed webhook + idempotent Firestore activation, production Dodo configuration verification, and Firebase emulator/integration E2E. No payment, Firestore activation, or Firebase integration result is fabricated.
- **2026-09-10 15:39 IST:** the recurring SEO/feature-wiring audit found the existing production smoke suite did not actually assert canonical metadata, social metadata, or apex-to-www canonical redirect behavior despite those being launch requirements. The smoke contract was expanded in `20470a12057c5541a0416d06ce7757c7f7b456c2` to exercise those production boundaries, plus Today and live-product SEO metadata when a real product exists. No real payment or production mutation is introduced by these checks. The new commit has not yet produced a CI or Vercel status at the time of this verification, so no test result is claimed for it.

- **2026-09-10 13:02 IST:** latest `main` implementation commit remains `7e75de2d68c5c7f45d22dc8ab6d3baf6047f98b1` (`fix: keep eyebrow treatment hero-only`). The current production deployment `dpl_EGqx4GbgY6Zmo5tDnvfipVUG9iWX` is `READY` and is built from that exact commit. GitHub's combined status for the commit is `success` with Vercel as the reported check.
- **2026-09-10 13:02 IST:** Vercel build output for the live deployment completed successfully and includes the expected AI routes, dynamic product/redirect/OG routes, legal pages, `/robots.txt`, `/sitemap.xml`, `/submit`, and `/today`. No build failure is present in the deployment log.
- **2026-09-10 13:02 IST:** Vercel reports no runtime error clusters for the selected two-hour window. This is a bounded observability result, not a claim of complete application health.
- **2026-09-10 13:02 IST:** the latest repository audit rechecked `AGENTS.md`, PRD v3, PRD v3.1, `IMPLEMENTATION_STATUS.md`, recent commit history, and active production taxonomy. No newer product-spec document was identified. The only source `eyebrow` usages outside specification/status text are the intended hero usages on the homepage, `/today`, AI category pages, and 404 hero; the non-hero violations fixed in the preceding commits remain absent.
- **2026-09-10 13:02 IST:** the deployment URL itself is protected by Vercel SSO and returns a 302 to the Vercel SSO endpoint when fetched without the temporary access flow. This execution therefore does not claim fresh crawler-visible HTML/robots/sitemap contents from the deployment URL. No custom-domain DNS evidence was available in this run.
- **2026-09-10 13:02 IST:** the remaining launch blockers are the genuine external acceptance gates: production Dodo configuration/payment behavior, a real Dodo test-mode payment followed by a signed webhook and idempotent Firestore activation, and Firebase emulator/integration E2E. No payment, Firestore activation, or Firebase integration result is fabricated.

## Measurement and privacy safety

Public product responses use explicit allowlists and do not expose submitter email. Homepage stats read only public aggregate fields from `stats/global`. Unavailable configuration shows honest zero/configuration states rather than invented market activity.

## Moderation safety

Reports are accepted only for existing live products and store a bounded reason with an open status. The moderation queue requires the server-side `ADMIN_TOKEN`; no Firestore client access is opened for moderation. Unpublish changes only the product status to `rejected`, while dismissing a report leaves the product live. Rejection and logo cleanup are performed in the same Firestore transaction to avoid leaving inaccessible orphaned logo documents.
