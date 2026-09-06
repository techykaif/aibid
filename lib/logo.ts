import sharp from "sharp";

const MAX_INPUT_BYTES = 5 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 180 * 1024;
const MAX_INPUT_PIXELS = 40_000_000;
const DIMENSIONS = [256, 192, 160, 128];
const QUALITIES = [82, 72, 62, 52, 44];

const ACCEPTED_TYPES = new Set(["image/png", "image/jpeg", "image/svg+xml"]);

export type OptimizedLogo = {
  data: Buffer;
  contentType: "image/webp";
  width: number;
  height: number;
  sizeBytes: number;
};

export async function optimizeLogo(file: File): Promise<OptimizedLogo> {
  if (!ACCEPTED_TYPES.has(file.type)) {
    throw new Error("Logo must be a PNG, JPG, or SVG image.");
  }
  if (file.size <= 0 || file.size > MAX_INPUT_BYTES) {
    throw new Error("Logo must be 5MB or smaller before compression.");
  }

  const input = Buffer.from(await file.arrayBuffer());
  const source = sharp(input, { limitInputPixels: MAX_INPUT_PIXELS, sequentialRead: true });
  const metadata = await source.metadata();
  if (!metadata.width || !metadata.height || metadata.width < 1 || metadata.height < 1) {
    throw new Error("Logo dimensions could not be read.");
  }
  if (metadata.width > 4096 || metadata.height > 4096) {
    throw new Error("Logo dimensions must be 4096px or smaller.");
  }

  for (const dimension of DIMENSIONS) {
    for (const quality of QUALITIES) {
      const { data, info } = await sharp(input, {
        limitInputPixels: MAX_INPUT_PIXELS,
        sequentialRead: true,
      })
        .rotate()
        .resize({ width: dimension, height: dimension, fit: "inside", withoutEnlargement: true })
        .webp({ quality, effort: 6 })
        .toBuffer({ resolveWithObject: true });

      if (data.byteLength <= MAX_OUTPUT_BYTES) {
        return {
          data,
          contentType: "image/webp",
          width: info.width,
          height: info.height,
          sizeBytes: data.byteLength,
        };
      }
    }
  }

  throw new Error("Logo could not be compressed to a safe size. Please choose a simpler image.");
}
