# Ai-Bid — PRD v3.1 Architecture Addendum

**Supersedes for logo storage only:** the Firebase Storage logo-upload requirements in PRD v3 are replaced by this decision. All other PRD v3 requirements remain authoritative.

## Logo architecture decision

Firebase Storage is not a launch dependency for Ai-Bid. Product logos are stored in Firestore because the current Firebase plan does not provide the required Storage capability.

### Upload contract

- Accept PNG, JPG/JPEG, and SVG uploads.
- Reject empty, unsupported, or oversized source files.
- Decode the image server-side with a bounded pixel limit.
- Reject source dimensions above 4096px on either axis.
- Resize logos to a compact maximum display size.
- Strip source metadata by re-encoding.
- Convert to WebP for compact delivery.
- Reduce quality and dimensions progressively until the encoded payload is no larger than 180KB while remaining a usable logo.
- Never persist the original upload.

### Firestore representation

Store one dedicated `productLogos/{productId}` document containing:

- `data`: Firestore bytes containing the optimized WebP
- `contentType`: `image/webp`
- `width`, `height`, `sizeBytes`
- `updatedAt`

The 180KB application ceiling is intentionally far below Firestore's 1 MiB document limit. Firestore bytes are used instead of base64 so the encoded representation does not add string expansion overhead.

### Delivery and privacy

- `products.logoUrl` points to `/api/logo/{productId}`.
- `/api/logo/{productId}` only serves a logo when the associated product is currently `live`.
- The route returns the stored binary with `nosniff` and cache headers.
- Public product projections continue to expose only the allowlisted `logoUrl` string; logo bytes and submitter email are never exposed through product JSON.
- Browser Firestore access remains denied. Logo reads/writes use the trusted server-side Firebase Admin SDK.

### Cleanup

If Dodo checkout creation fails after a logo was stored, both the pending product and its `productLogos/{productId}` document are deleted. The product/logo identifiers are intentionally one-to-one so cleanup is deterministic.

### Launch acceptance

The remaining logo gate is a real deployed upload/read verification using a representative image. Firebase Storage bucket configuration is no longer a launch requirement.
