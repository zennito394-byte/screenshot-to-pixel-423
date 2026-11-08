// Browser-only: normalises a photo before upload (orientation, max 2048px, JPEG, strips metadata such as GPS).
import { checkSourceFile } from "./generation-rules";

export type PreparedImage = {
  blob: Blob;
  previewUrl: string;
  width: number;
  height: number;
  originalName: string;
};

const MAX_SIDE = 2048;

export async function prepareImage(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<PreparedImage> {
  const check = checkSourceFile(file);
  if (!check.ok) throw new Error(check.reason);

  onProgress?.(10);
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("This file couldn't be read as a photo. It may be damaged or in an unsupported format.");
  }
  onProgress?.(55);

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser couldn't process this photo.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  onProgress?.(80);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  if (!blob) throw new Error("Your browser couldn't process this photo.");
  onProgress?.(100);

  return { blob, previewUrl: URL.createObjectURL(blob), width, height, originalName: file.name };
}
