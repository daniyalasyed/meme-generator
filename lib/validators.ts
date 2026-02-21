export const MAX_CAPTION_LENGTH = 140;
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export function validateCaption(caption: string): string | null {
  const value = caption.trim();
  if (value.length > MAX_CAPTION_LENGTH) {
    return `Caption must be ${MAX_CAPTION_LENGTH} characters or less.`;
  }
  return null;
}

export function validateMemeUpload(file: Blob): string | null {
  if (!file) return "No image selected.";
  if (file.size <= 0) return "Image is empty.";
  if (file.size > MAX_UPLOAD_BYTES) return "Image is too large. Max size is 8MB.";

  const type = file.type.toLowerCase();
  if (!type.startsWith("image/")) return "Only image uploads are supported.";
  return null;
}
