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

- **2026-09-10 23:12 IST:** latest `main` is `1f6a7282855a2de2ad459093681b2a3eba39ce4f` (`docs: record SEO boundary smoke coverage`). The three commits since the previously verified `6d00b36804ce76c5f073510fced54acb409d6e83` state are `b58702f32c7209d8bfe90bf7fc247e60b9861288` (`test: harden sitemap and 404 SEO boundaries`), `0b558996c2851ea00cc4923f8399447e9f2443e1d` (`test: run SEO boundary smoke in production workflow`), and this documentation update. The combined Vercel status for `1f6a728...` is `success`; the GitHub connector's commit-workflow endpoint exposes no workflow run for this commit, so no TypeScript, lint, build, or smoke pass is claimed from that endpoint.
- **2026-09-10 23:12 IST:** the latest source-level SEO-boundary smoke is present in `main` and is wired after typecheck, lint, production build, and the existing public production smoke. It verifies sitemap XML, canonical `www.ai-bid.lol` URL hosts, deferred-market exclusion, and the rendered 404 `noindex,nofollow` boundary. No production payment, click, or Firestore state is mutated by the smoke.
- **2026-09-10 23:12 IST:** direct live-domain crawling remains unavailable from this execution environment because DNS resolution for `www.ai-bid.lol` fails. No crawler-visible production HTML, sitemap body, payment success, Firebase state, or production health is claimed without direct evidence.
- **2026-09-10 23:12 IST:** the repository/spec audit rechecked `AGENTS.md`, PRD v3, PRD v3.1, implementation status, recent `main` commits, and the repository tree. No newer product-spec document was identified. The source remains AI-only in the active launch surface; `CATEGORIES` is derived from `AI_CATEGORIES`, `MARKETS` contains only `ai`, and Games/Open Source/Music are future-only.
- **2026-09-10 23:12 IST:** the current production-smoke workflow remains `npm install` → TypeScript no-emit → ESLint → production build → public production smoke → SEO-boundary smoke. No local typecheck/lint/build result is claimed because this execution environment cannot resolve the public GitHub/repository runtime dependencies or live Ai-Bid DNS.
- **2026-09-10 23:12 IST:** the current source sitemap contains the homepage, `/today`, AI category routes, legal routes, and live product URLs only; it does not contain `/submit` despite the stale historical wording below referring to a static AI category/submit entry. This run corrects the status wording drift rather than changing sitemap behavior.
- **2026-09-10 23:12 IST:** the remaining highest-impact launch acceptance gates are external execution requirements: real Dodo test-mode payment → signed webhook → checkout-intent reconciliation → idempotent Firestore activation → totals/rank/daily stats/public visibility; production Dodo configuration verification; a real deployed logo upload/read verification; and Firebase emulator/integration E2E covering duplicate/retry/failure/cancellation. These remain unpassed because no provider/emulator/live Firebase execution evidence is available in this run.
- **2026-09-10 22:50 IST:** latest pre-run implementation state was `0b558996c2851ea00cc4923f8399447e9f2443e1d`, adding the dedicated SEO-boundary smoke to the production workflow. The new smoke was source-level test coverage only and had not yet produced a passing CI/build/smoke result; no successful result was claimed at that time.
- **2026-09-10 20:53 IST:** the report SEO boundary was implemented and smoke-tested in source by `d7ae98b0b198a8f9d58f837877820e524ecd7dd2` and `2f673b5ed4ae80c5e5fe26755b5544e6fa2eb3fd`; the status wording was subsequently corrected by `35efdd9934195fa286ef76be8bf1546ce8435a13` to accurately describe the Vercel deployment limitation.
- **2026-09-10 18:59 IST:** `537861f9c3bee4fe8e52dc917c7c10563c61dbb9` (`test: verify API noindex boundaries`) added the production-smoke assertion for API `X-Robots-Tag: noindex, nofollow`, following the `bedb313d2d7524093bfa32fed322358f013b2f6d` implementation that adds the response header.
- **2026-09-10 17:55 IST:** `75e59975a7cd612c550c5e16d8f77df0b74843d8` added a read-only production-smoke assertion that `/robots.txt` points to the canonical `https://www.ai-bid.lol/sitemap.xml` and contains no deferred Games surface. That implementation was subsequently recorded in status by `5c826345ec366cf2af2d07b3cd98a9fc795e0548`.
- **2026-09-10 16:55 IST:** the recurring AI-only feature-wiring audit found the production smoke suite exercised the Games checkout boundary but did not directly inspect the rendered `/submit` surface for deferred-market options. `c2784d7f176d2c504f01d6dcb2f84619c90b3160` added that read-only production smoke assertion.
- **2026-09-10 15:39 IST:** the recurring SEO/feature-wiring audit found the existing production smoke suite did not actually assert canonical metadata, social metadata, or apex-to-www canonical redirect behavior. `20470a12057c5541a0416d06ce7757c7f7b456c2` expanded those checks.
- **2026-09-10 14:38 IST:** the last previously verified production deployment was `dpl_CXhU87gvsj8nY4kSVt8FLtnSeQqt`, `READY`, from `5c95eaba403b320efd748c59316de837509ff6d3`, aliased to `www.ai-bid.lol` and `ai-bid.lol`. Vercel reported no runtime error clusters in the preceding two hours at that verification point.
- **2026-09-10 14:38 IST:** the production deployment's `/robots.txt` was fetched successfully from the protected Vercel deployment URL and returned HTTP 200 with `Sitemap: https://www.ai-bid.lol/sitemap.xml`; Vercel also added `X-Robots-Tag: noindex` to the robots resource. The deployment root and `/sitemap.xml` were protected by Vercel SSO in that execution environment, so no crawler-visible HTML or sitemap body was claimed.
- **2026-09-10 14:38 IST:** recurring source audit rechecked `AGENTS.md`, PRD v3, PRD v3.1, implementation status, recent commits, and product-spec search results. No newer product-spec document was identified. The source tree had no remaining `section-kicker`, `transition: all`, `!important`, `box-shadow`, or monospace-style matches in the repository search used for that audit; remaining `eyebrow` usage was limited to intended hero surfaces.
- **2026-09-10 14:38 IST:** active-market regression remained AI-only. Games/Open Source/Music are future roadmap items and are not exposed as active categories or submission markets. Existing production smoke coverage explicitly checks deferred Games exclusion.
- **2026-09-10 14:38 IST:** the payment implementation remains server-authoritative in source: checkout intents bind server-derived USD amounts and product/flow context, signed Dodo settlement data is independently validated, metadata is only cross-checked, webhook processing is idempotent, and verified webhooks—not success redirects—activate bids/products. No real payment was created during these audits.
- **2026-09-10 14:38 IST:** the latest production acceptance blockers remain external execution gates: real Dodo test-mode payment + signed webhook + idempotent Firestore activation, production Dodo configuration verification, and Firebase emulator/integration E2E. No payment, Firestore activation, or Firebase integration result is fabricated.

## Measurement and privacy safety

Public product responses use explicit allowlists and do not expose submitter email. Homepage stats read only public aggregate fields from `stats/global`. Unavailable configuration shows honest zero/configuration states rather than invented market activity.

## Moderation safety

Reports are accepted only for existing live products and store a bounded reason with an open status. The moderation queue requires the server-side `ADMIN_TOKEN`; no Firestore client access is opened for moderation. Unpublish changes only the product status to `rejected`, while dismissing a report leaves the product live. Rejection and logo cleanup are performed in the same Firestore transaction to avoid leaving inaccessible orphaned logo documents.
