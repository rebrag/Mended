/** Browser-only helpers that shrink photos before upload, so phones send small JPEGs. */

export type ResizedPhoto = { full: Blob; thumb: Blob; width: number; height: number };

async function decode(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file, { imageOrientation: "from-image" });
}

async function encode(bitmap: ImageBitmap, maxSide: number, quality: number) {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) throw new Error("Could not encode image");
  return { blob, width, height };
}

export async function resizePhoto(file: File): Promise<ResizedPhoto> {
  const bitmap = await decode(file);
  try {
    const full = await encode(bitmap, 1600, 0.85);
    const thumb = await encode(bitmap, 480, 0.8);
    return { full: full.blob, thumb: thumb.blob, width: full.width, height: full.height };
  } finally {
    bitmap.close();
  }
}

export function appendPhoto(formData: FormData, photo: ResizedPhoto) {
  formData.set("photo", photo.full, "photo.jpg");
  formData.set("thumb", photo.thumb, "thumb.jpg");
  formData.set("width", String(photo.width));
  formData.set("height", String(photo.height));
}
