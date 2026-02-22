import { describe, it, expect } from "vitest";
import {
  validateCaption,
  validateMemeUpload,
  MAX_CAPTION_LENGTH,
  MAX_UPLOAD_BYTES,
} from "./validators";

describe("validateCaption", () => {
  it("returns null for valid caption", () => {
    expect(validateCaption("Hello world")).toBeNull();
  });

  it("returns null for caption at max length", () => {
    const caption = "a".repeat(MAX_CAPTION_LENGTH);
    expect(validateCaption(caption)).toBeNull();
  });

  it("returns error for caption over max length", () => {
    const caption = "a".repeat(MAX_CAPTION_LENGTH + 1);
    expect(validateCaption(caption)).toBe(
      `Caption must be ${MAX_CAPTION_LENGTH} characters or less.`
    );
  });

  it("trims whitespace before validating", () => {
    const caption = "  " + "a".repeat(MAX_CAPTION_LENGTH) + "  ";
    expect(validateCaption(caption)).toBeNull();
  });

  it("returns null for empty caption (after trim)", () => {
    expect(validateCaption("   ")).toBeNull();
  });
});

describe("validateMemeUpload", () => {
  function createMockBlob(size: number, type: string): Blob {
    const buffer = new ArrayBuffer(size);
    return new Blob([buffer], { type });
  }

  it("returns null for valid image", () => {
    const blob = createMockBlob(1024, "image/png");
    expect(validateMemeUpload(blob)).toBeNull();
  });

  it("returns error for null/undefined file", () => {
    expect(validateMemeUpload(null as unknown as Blob)).toBe("No image selected.");
  });

  it("returns error for empty file", () => {
    const blob = createMockBlob(0, "image/png");
    expect(validateMemeUpload(blob)).toBe("Image is empty.");
  });

  it("returns error for file over max size", () => {
    const blob = createMockBlob(MAX_UPLOAD_BYTES + 1, "image/png");
    expect(validateMemeUpload(blob)).toBe("Image is too large. Max size is 8MB.");
  });

  it("returns error for non-image file", () => {
    const blob = createMockBlob(1024, "application/pdf");
    expect(validateMemeUpload(blob)).toBe("Only image uploads are supported.");
  });

  it("accepts various image types", () => {
    const types = ["image/png", "image/jpeg", "image/gif", "image/webp"];
    types.forEach((type) => {
      const blob = createMockBlob(1024, type);
      expect(validateMemeUpload(blob)).toBeNull();
    });
  });

  it("accepts file at exactly max size", () => {
    const blob = createMockBlob(MAX_UPLOAD_BYTES, "image/png");
    expect(validateMemeUpload(blob)).toBeNull();
  });
});
