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
- Public product projection only exposes live AI-market products; unknown product category filters now return an empty result instead of falling back to the entire live AI market
- Daily leaderboard public projection now also requires `status === "live" && market === "ai"`, preventing future-market documents referenced by daily stats from entering the active public Today surface
- Product detail pages now require `status === "live" && market === "ai"`; their rank calculation also excludes non-AI products
- Product OG images and badges now reject non-AI products and calculate rank only within live AI products
- Server-rendered all-time/category leaderboards and the Today page now filter public projections to the AI market; the all-time tab is explicitly labeled `All AI`
- Existing-product Dodo bid checkout now requires the target product to be live in the AI market
- Verified Dodo webhook reconciliation now rejects any product whose market is not the active AI market before writing a confirmed bid or stats
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
- Sitemap includes live AI product URLs from Firestore, while retaining the static AI category/submit entries and failing safely to those static entries if the optional live-product read is unavailable
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
- Production smoke asserts the rendered `/submit` surface contains AI categories and no Games/Open Source/Music options
- Production smoke asserts the `/report` moderation surface is `noindex, nofollow`
- ESLint is pinned to the ESLint 9 major so the Next.js 16 ESLint configuration's React rules remain compatible with the lint rule API
- Vercel Web Analytics is installed globally through the Next.js root layout
- 404 responses have an explicit `noindex,nofollow` boundary rather than inheriting a root index directive
- Malformed Dodo webhook requests missing required signature headers are rejected with HTTP 401 before verification
- `/today` uses the established `board-label` treatment for the market label instead of an undeclared/reused `section-kicker` style
- `/submit` uses the established `board-label` treatment for its non-hero section labels instead of reusing the hero-only `eyebrow` style
- Production workflow now runs a dedicated SEO-boundary smoke that verifies sitemap XML content, canonical `www.ai-bid.lol` URL hosts, deferred-market exclusion, and the rendered 404 `noindex,nofollow` boundary
- Production workflow now runs an AI-category SEO smoke that verifies every active AI category route returns 200, has its exact canonical URL, emits Open Graph/Twitter metadata, and does not expose deferred-market terms
- AI-category SEO smoke now also verifies HTML title/description plus Open Graph title/description/image and Twitter title/description metadata for every active AI category route
- Production workflow retries the public production smoke up to three times with a five-second delay between attempts, preserving all existing assertions and failing after the final attempt; this is specifically to distinguish transient network/DNS failures from deterministic production failures
- Production workflow now continues the dedicated SEO-boundary and AI-category smoke checks even when public production smoke fails, while preserving the final failure state; this keeps downstream SEO diagnostics available instead of skipping them after an earlier smoke failure
- AI-category SEO smoke now tolerates valid HTML attribute ordering while still requiring non-empty title/description/Open Graph/Twitter metadata
- Production smoke SEO parsing now tolerates valid HTML attribute ordering for canonical links and metadata while still requiring the expected canonical URLs and non-empty metadata; this only hardens test diagnostics and does not relax any production assertion
- Production smoke now independently verifies `/games`, `/category/games`, and `/category/games-action` remain `404` + `noindex`, in addition to the existing sitemap/submission/checkout future-market boundaries
- SEO-boundary smoke now checks all rendered `robots` meta tags for the required `noindex,nofollow` directive rather than assuming the first robots tag is authoritative; Next.js can emit an additional `noindex` robots tag on 404 responses before the explicit `noindex,nofollow` metadata. This preserves the production assertion and prevents a false-negative smoke failure
- `/api/stats` now returns an explicit HTTP 503 error when Firebase is not configured instead of returning cacheable zero-valued stats that could be mistaken for real market activity

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

- **2026-09-11 13:08 IST:** latest `main` before this implementation change was `9af80ac2b657b5656a4b9040784da05c6c317d42`; its combined GitHub status reports Vercel `success`. The commit enforces `status === "live" && market === "ai"` in the public product projection.
- **2026-09-11 13:08 IST:** recurring source/spec audit rechecked `AGENTS.md`, PRD v3, PRD v3.1, implementation status, recent main commits, the production smoke workflow, and the active AI-only taxonomy. No newer product-spec document was identified. The authoritative AI slugs remain `coding`, `writing`, `image`, `video`, `agents`, `productivity`, and `other`; Games/Open Source/Music remain future-only.
- **2026-09-11 13:08 IST:** recurring feature-wiring/SEO source audit confirms the implemented AI category routes, Today, product pages, submission, report/moderation, public projections, tracked redirects, logos, robots/sitemap, API/private/error noindex boundaries, and Dodo server-authoritative flow remain wired in source.
- **2026-09-11 13:08 IST:** concrete launch hardening added on `main`: `/api/products?category=<unknown-or-future-market>` now returns an empty public result instead of treating the unknown filter as absent and returning the entire live AI market. This closes an invalid-category/future-market API boundary and does not change valid AI category queries or payment trust boundaries.
- **2026-09-11 13:08 IST:** the previous production smoke evidence remains the latest available completed runtime evidence; no fresh Actions workflow run for the new commit is currently exposed. Therefore this run does not claim new typecheck, lint, build, smoke, Firebase, or payment results.
- **2026-09-11 13:08 IST:** no live Dodo test payment, Firebase production mutation, live product creation, click-state mutation, or logo upload/read verification was performed or fabricated.
- **2026-09-11 14:46 IST:** recurring sitemap/SEO source audit found that `app/sitemap.ts` queried all `live` products without enforcing `market === "ai"`, which could expose a future-market product URL in the indexable sitemap if such a document existed. The smallest safe fix filters the already-bounded live-product snapshot to `market === "ai"` before emitting product URLs. No future-market data was added.
- **2026-09-11 15:44 IST:** recurring feature-wiring/security audit found that `/api/today` only checked `status === "live"` after resolving daily-stat entries, so a future-market product referenced by `dailyStats` could enter the public Today projection. The smallest safe fix additionally requires `market === "ai"`. No Firestore rules, indexes, payment trust boundaries, or production data were changed.
- **2026-09-11 15:44 IST:** the new runtime change is committed as `6e27fd7c713362a3db17a5360af90184e22c4449`. The inspected diff contains only the one-line Today public-projection guard. No fresh CI workflow result is exposed for this commit, so this run does not claim new typecheck, lint, build, smoke, Firebase, or payment results.
- **2026-09-11 15:52 IST:** recurring AI-only public-surface audit found that server-rendered product pages, product OG images, badges, the all-time/category leaderboard, and the Today page still accepted or ranked `status === "live"` documents without requiring `market === "ai"`. This could expose a future-market document through a direct product URL or rank it into the active AI surface if such a document existed. The smallest safe fix adds the AI-market guard to those public projections and changes the all-time tab label from `All markets` to `All AI`; no future-market data was added.
- **2026-09-11 15:52 IST:** implementation changes are committed on `main` across `app/product/[id]/page.tsx`, `app/product/[id]/opengraph-image.tsx`, `app/api/badge/[productId]/route.ts`, `app/components/Leaderboard.tsx`, and `app/today/page.tsx`. The inspected aggregate diff from the previous verified `main` contains only these five files, with 12 additions and 12 deletions. No Firestore rules, indexes, payment trust boundaries, credentials, or production data were changed.
- **2026-09-11 15:52 IST:** no fresh local typecheck/lint/build or new deployed runtime result is claimed for the new commits. The last verified combined status remains Vercel `success` for `73cce430bbaedddba477a296c4c4e1d1a4a39e4e`; this run does not treat that older deployment as proof of the new code.
- **2026-09-11 15:52 IST:** recurring payment-boundary audit found that the existing-product Dodo bid endpoint accepted any `live` product and the webhook reconciler only checked product status, so a manually present future-market product could potentially receive a confirmed bid if an intent existed. The smallest safe fix now requires `market === "ai"` both before creating a bid checkout and again inside the verified-webhook transaction before any bid/stats write. No payment was executed or fabricated.
- **2026-09-11 15:52 IST:** the current `main` commit is `8228eb894efde51d70bd632244501ec46ed81f0c`, with `IMPLEMENTATION_STATUS.md` updated afterward. Its combined GitHub status is currently Vercel `failure` with the target indicating a build-rate-limit/Pro-upgrade condition; no GitHub Actions workflow run is exposed for the commit. Therefore this run does not claim fresh typecheck, lint, build, smoke, or deployed-runtime success.
- **2026-09-11 16:58 IST:** recurring privacy/measurement audit found that `/api/stats` returned cacheable zero-valued stats when Firebase was not configured, which could mask a configuration failure as genuine zero market activity. The smallest safe fix changes that branch to HTTP 503 with an explicit unavailable error and `no-store`; configured Firebase behavior and real stats aggregation are unchanged. No production Firebase state or market statistics were fabricated.
- **2026-09-11 16:58 IST:** implementation change committed on `main` as `b176b20ff4710a1c55531969b597f12a6ccdc84d`. The inspected diff changes only `app/api/stats/route.ts`. The subsequent status-document update is the next commit; no Firestore rules, payment trust boundaries, credentials, or production data were changed.
- **2026-09-11 16:58 IST:** current `main` Vercel status for the implementation commit reports the existing build-rate-limit/Pro-upgrade failure condition; no GitHub Actions workflow run is exposed. Therefore no fresh typecheck, lint, build, smoke, Firebase, payment, or deployed-runtime success is claimed for the new change.

## Measurement and privacy safety

Public product responses use explicit allowlists and do not expose submitter email. Homepage stats read only public aggregate fields from `stats/global`. Unavailable configuration now returns an explicit stats-unavailable error from `/api/stats` rather than cacheable zero-valued market statistics; this prevents configuration failure from being presented as real activity.

## Moderation safety

Reports are accepted only for existing live products and store a bounded reason with an open status. The moderation queue requires the server-side `ADMIN_TOKEN`; no Firestore client access is opened for moderation. Unpublish changes only the product status to `rejected`, while dismissing a report leaves the product live. Rejection and logo cleanup are performed in the same Firestore transaction to avoid leaving inaccessible orphaned logo documents.
