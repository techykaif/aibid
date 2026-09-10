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
- Production smoke coverage checks homepage, public APIs, AI category routes, homepage/sitemap exclusion of deferred Games, deferred Games route inactivity (`404` + `noindex`), SEO/legal routes, invalid product/redirect/logo/badge IDs, checkout cancellation, private-email leakage, malformed checkout requests, unsigned Dodo webhooks, removed Games checkout requests, SSRF boundary handling, and one real live product's public page/badge/logo when production has live data
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

- **2026-09-10 11:08 IST:** latest `main` implementation commit is `6d8c22be7b419ea58cfba4201024fd15038c828e` (`fix: use board labels outside hero on submit`). The change replaces the two non-hero `eyebrow` uses on `/submit` with the established `board-label` treatment; no CSS, dependency, route, or payment behavior changed.
- **2026-09-10 11:08 IST:** Vercel production deployment `dpl_Bhfyi4giAGyFMM5zabet7i8jUSXC` is building from `6d8c22be7b419ea58cfba4201024fd15038c828e`. The observed build has cloned `main`, installed dependencies, compiled successfully, completed TypeScript successfully, and reached static-page generation. No final READY state is claimed yet.
- **2026-09-10 11:08 IST:** GitHub combined status and commit workflow lookup returned no workflow checks for `6d8c22be7b419ea58cfba4201024fd15038c828e`; no CI result is fabricated beyond the live Vercel build output above.
- **2026-09-10 08:19 IST:** latest `main` commit is `db7dbd0ffdc7981d7381b06e5c33ae407841e71f` (`docs: record latest main and production deployment state`). The preceding implementation commit `b4c32c5d4dcf5c2e9d3c08b800d0bce671284f87` hardens malformed Dodo webhook rejection before signature verification. The latest `main` commit is now deployed to Vercel production as `dpl_Ha7YgRtdyv62TKBXBDzEjBf4dp9C`, state `READY`.
- **2026-09-10 08:19 IST:** Vercel build for `db7dbd0` completed successfully: Next.js production build compiled, TypeScript completed successfully, 31 static pages were generated, and deployment completed. GitHub Production smoke run `162` for `db7dbd0` completed successfully.
- **2026-09-10 08:19 IST:** production runtime status aggregation for the preceding two hours on the latest deployment showed 200, 404, 400, and 401 responses, with no 5xx response group observed. This verifies only the visible Vercel runtime window, not payment success or complete application health.
- **2026-09-10 08:19 IST:** the latest Vercel deployment is serving `main` commit `db7dbd0`; the previous build-rate-limit deployment blocker is therefore cleared for this deployment. No direct custom-domain crawler verification is claimed from this execution environment.
- **2026-09-10 08:19 IST:** the current production smoke contract still covers homepage, public APIs, AI categories, SEO/legal routes, invalid IDs, checkout cancellation, privacy, malformed/unsigned payment boundaries, SSRF protections, and deferred Games exclusion. No real payment or production payment/click mutation is created by the smoke suite.
- **2026-09-09 23:24 IST:** previous production verification found no 5xx route groups in the preceding two hours. The only aggregated runtime error was the known Dodo webhook verification boundary error (`Missing required headers`) on `/api/webhooks/dodo`; this is an expected rejection path for unsigned/malformed webhook probes and does not establish a payment failure.
- **2026-09-09 23:24 IST:** production log status counts in the preceding two hours were 200, 304, 400, and 401 responses with no 5xx responses observed. Vercel confirms the project has both `www.ai-bid.lol` and `ai-bid.lol` attached, with `www.ai-bid.lol` intended as canonical host.
- **2026-09-09 23:24 IST:** live-domain body verification of `/robots.txt`, `/sitemap.xml`, and representative metadata could not be independently completed from the current execution environment because direct DNS resolution for `www.ai-bid.lol` is unavailable here and the web fetcher could not open the domain without a search result. The Vercel deployment status therefore verifies deployment completion, not crawler-visible response contents; this remains an explicit verification limitation rather than a fabricated pass.
- **2026-09-09 07:44 IST:** GitHub Actions run `114` for `6819cdf75347ae56bf4358547131db9b00906d07` completed successfully: dependency install, TypeScript typecheck, ESLint, production build, and public production smoke all passed. This validates the ESLint 9 compatibility fix recorded above.
- **2026-09-09 07:44 IST:** the deployed `/api/today` route returned HTTP 200 JSON with an empty daily list. An empty daily board is treated as real current state, not fabricated activity. The custom production domain redirects from `ai-bid.lol` to the canonical `www.ai-bid.lol` host through Vercel.
- **2026-09-09 06:20 IST:** production-smoke regression coverage was added preventing deferred Games from appearing on the homepage or sitemap. The deferred Games category route remains outside the active launch taxonomy.
- Previous fresh production reads of `/api/products?limit=1` returned a real live AI product; no fabricated/demo fallback was observed.
- The live AI category route `/category/coding` returned HTTP 200 with the expected AI-only category navigation and server-rendered leaderboard.
- The deferred Games category route `/category/games-action` returned HTTP 404 with `noindex`, confirming it is not an active launch surface.
- The live product's Firestore-backed logo route returned HTTP 200 with `Content-Type: image/webp`, `X-Content-Type-Options: nosniff`, `Cache-Control: public, max-age=86400`, and a 1,590-byte binary payload, well below the 180KB application ceiling.
- The previously recorded `/api/today` `SERVICE_DISABLED` / `PERMISSION_DENIED` Firestore blocker is cleared at runtime. Fresh production reads confirm the configured server-side Firestore path is responding.

Production smoke previously exposed composite-index failures on public ranking/product/OG paths. Those reads were changed to bounded equality-only reads with deterministic server-side sorting, and the live product page, rank badge, and product OG image were subsequently verified successfully.

The production smoke suite probes payment trust boundaries without creating a charge: malformed checkout requests return HTTP 400 and unsigned Dodo webhook requests return HTTP 401 JSON. These checks do not substitute for a real Dodo test-mode payment and signed webhook reconciliation.

The server never trusts a client-side success redirect. A product becomes live and a bid affects ranking only after a verified `payment.succeeded` webhook. Webhook processing is idempotent and Firestore updates are transactional. The server-created checkout intent is the authoritative USD bid amount; signed Dodo product/quantity and settlement data are independently verified, while metadata is only cross-checked.

- **2026-09-09 09:39 IST:** identified and fixed a payment-reliability race in new-product checkout creation. If Dodo successfully created a checkout session but Firestore checkout-intent persistence then failed, the previous catch path deleted the pending product/logo even though Dodo could still deliver a signed success webhook. The checkout route now retains the pending product when a checkout session has been created, returns a retryable HTTP 503, and logs the condition so a later provider webhook can still reconcile safely. Cleanup remains unchanged for failures before a Dodo session exists.
- **2026-09-09 16:52 IST:** identified and fixed the equivalent payment-reliability race in existing-product bids. If Dodo created the bid checkout but checkout-intent persistence failed, the bid route previously returned a generic 400 even though a legitimate signed webhook could still arrive. The bid route now marks the Dodo session as created before persisting the intent and returns retryable HTTP 503 when intent persistence fails, preserving the existing live product and avoiding a false client-success/error classification.
- **2026-09-09 20:45 IST:** SEO audit found that product pages had no explicit per-product canonical, robots, Open Graph/Twitter metadata, or link to the existing rank-aware Next.js `opengraph-image` route. Added live-product-only metadata with canonical URLs, index/follow controls, product-specific title/description, and social cards pointing to the dynamic rank-aware image. Missing/inactive/config-error product metadata is now explicitly noindex rather than accidentally indexable.
- **2026-09-09 20:48 IST:** SEO audit found that the sitemap exposed only the homepage, AI categories, and submission page even though live product pages are permanent SEO surfaces. Updated `app/sitemap.ts` to include only `status == "live"` product URLs from Firestore, with a bounded query and safe static fallback when the optional live-product read is unavailable. No future-market URLs or fabricated listings are added.
- **2026-09-09 21:35 IST:** recurring SEO audit found AI category pages had title/description metadata but lacked explicit canonical, robots, Open Graph, and Twitter metadata. Added category-specific canonical URLs and index/follow directives plus social metadata, while preserving the AI-only category taxonomy and avoiding future-market SEO surfaces.
- **2026-09-09 22:04 IST:** recurring SEO/feature-wiring audit found the daily `/today` board inherited only root metadata and therefore had no explicit canonical/social metadata; it now declares its own canonical `/today`, index/follow directives, and social metadata. The anonymous `/submit` conversion surface is now explicitly `noindex,follow` so it is not treated as a permanent search landing page.
- **2026-09-09 23:24 IST:** recurring SEO audit confirmed the canonical-host implementation is internally consistent in source: `robots.ts`, `sitemap.ts`, root `metadataBase`, category metadata, product metadata, and `.env.example` all use `https://www.ai-bid.lol`. The source tree contains no active Games/Open Source/Music category route or submission market selector, and the existing production smoke contract covers Games exclusion. Live crawler fetch remains unverified from this environment as noted above.
- **2026-09-10 09:57 IST:** recurring feature-wiring/design audit found `/today` was using an undeclared `section-kicker` class even though `AGENTS.md` explicitly prohibits adding/reusing that kicker treatment outside the hero. Replaced the class with the existing `board-label` treatment; no new CSS or dependency was introduced.
- **2026-09-10 10:01 IST:** the `/today` design-system fix commit `1abc99e28df1320000270bede125f7b191f10bbc` built successfully through Vercel production output generation; the resulting deployment is now READY and serves the updated `board-label` treatment. No direct GitHub Actions workflow run was returned for this commit, so no CI result is claimed beyond the Vercel build output.
- **2026-09-10 11:08 IST:** recurring feature-wiring/design audit found `/submit` was reusing the hero-only `eyebrow` style for both “List your AI product” and “How it works”. Replaced both with the established `board-label` treatment in commit `6d8c22be7b419ea58cfba4201024fd15038c828e`. The corresponding Vercel production deployment is currently BUILDING; its observed build has compiled successfully and completed TypeScript before static-page generation. Final deployment readiness is not yet claimed.

## Measurement and privacy safety

Public product responses use explicit allowlists and do not expose submitter email. Homepage stats read only public aggregate fields from `stats/global`. Unavailable configuration shows honest zero/configuration states rather than invented market activity.

## Moderation safety

Reports are accepted only for existing live products and store a bounded reason with an open status. The moderation queue requires the server-side `ADMIN_TOKEN`; no Firestore client access is opened for moderation. Unpublish changes only the product status to `rejected`, while dismissing a report leaves the product live. Rejection and logo cleanup are performed in the same Firestore transaction to avoid leaving inaccessible orphaned logo documents.
