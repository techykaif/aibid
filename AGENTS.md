# Ai-Bid interface principles

Ai-Bid is a pay-to-rank public market for AI products. The UI should feel like a market/leaderboard first, not a generic AI SaaS dashboard.

## Design direction

- Prioritize scanability: rank, product, bid count, and bid total should read in one pass.
- Use restrained neutrals with one warm accent. Never introduce neon purple/pink AI gradients or heavy glow.
- Treat light and dark themes as equally designed surfaces. Theme initialization must be hydration-safe and avoid a flash.
- Both themes must be fully functional and visually intentional: maintain readable contrast, clear surfaces and borders, accessible controls, visible focus states, and consistent interaction states in light and dark mode. Never treat light mode as an afterthought or merely an inverted dark theme.
- Prefer crisp borders, subtle layered elevation, compact controls, and consistent radii over decorative effects.
- Typography is part of the identity: strong editorial display type for market moments, compact UI type for metadata, and tabular numerals for money/rankings.
- Keep navigation short and purposeful. Preserve obvious paths to Today, categories, product pages, and listing submission.
- Make conversion moments explicit: users should understand what they can bid, what rank means, and where to continue.
- Design mobile first for touch targets and one-handed scanning. Never hide essential actions behind hover.

## Interaction and accessibility

- Use native links, buttons, labels, inputs, and headings before custom ARIA.
- Every form control needs an associated label, useful name/autocomplete, and visible focus state.
- Use `:focus-visible`; never remove keyboard focus indicators.
- Respect `prefers-reduced-motion` and prefer CSS transitions over JavaScript animation.
- Avoid `transition: all`; animate only deliberate properties such as opacity and transform.
- Keep user-generated product names resilient to long text and mark brand/product names `translate="no"` where appropriate.

## Performance

- Keep pages server-rendered and CDN/ISR friendly where possible.
- Do not add client polling for market data. Prefer revalidation and server reads.
- Avoid unnecessary dependencies and client-side JavaScript for presentational behavior.
- Reserve image dimensions and avoid layout shift.

## Product decisions

- Do not invent live market statistics. Demo values must remain clearly identifiable as preview data.
- Never touch production credentials or payment secrets during UI work.
- Keep Ai-Bid's existing SVG logo identity; do not generate replacement imagery for the brand.

## Design system constraints

These constraints are non-negotiable. Do not reinterpret, extend, or "improve" them arbitrarily. If a new component needs a color, radius, or spacing value, use the established design tokens and patterns rather than creating ad-hoc variants.

- One stylesheet: app/globals.css. Do not create additional CSS files (no *-polish.css, *-primer.css, *-premium.css, etc.). If globals.css is getting hard to navigate, split it by section comment, not by file.
- Zero `!important` anywhere. If you're reaching for `!important`, a selector elsewhere is wrong — fix that selector instead.
- Dual-theme system. Light and dark modes are both supported and must be designed and tested as first-class experiences. Do not remove the theme toggle or replace theme support with a dark-only implementation. Theme switching must be hydration-safe and avoid a flash of the wrong theme.
- Keep the documented dark palette as the source of truth for dark mode:
  --bg:#080808  --bg-glow:#2a1700 (hero only, once)  --surface:#0d0d0d
  --border:#292929  --text-primary:#f5f5f5  --text-secondary:#a9a9a9
  --text-tertiary:#767676  --accent:#ff7a00  --accent-ink:#090909
  --danger:#ff6b6b  --success:#75e6a1
  Light mode should use a deliberately designed light palette with equivalent semantic roles and accessible contrast; do not use raw dark tokens unchanged or simply invert them mechanically.
- No box-shadow on any element. Borders and surface changes do the separation job.
- No monospace font anywhere. One sans stack for everything, no exceptions for labels, tickers, or step numbers.
- Radius: 8px (inputs, pills, thumbnails) / 12px (buttons, tabs) / 16px (cards). No other radius value.
- The eyebrow/kicker label style is used exactly once, in the hero. Do not add a `.section-kicker` or reuse it elsewhere.
- No new hero widgets (charts, previews, stat graphics) without this being explicitly requested first — describe the plan before building it.
- No hover-underline animations on nav links, no sticky/blurred header, no backdrop-filter, unless explicitly requested.
