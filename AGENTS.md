# Ai-Bid interface principles

Ai-Bid is a pay-to-rank public market for AI products. The UI should feel like a market/leaderboard first, not a generic AI SaaS dashboard.

## Design direction

- Prioritize scanability: rank, product, bid count, and bid total should read in one pass.
- Use restrained neutrals with one warm accent. Never introduce neon purple/pink AI gradients or heavy glow.
- Treat light and dark themes as equally designed surfaces. Theme initialization must be hydration-safe and avoid a flash.
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
