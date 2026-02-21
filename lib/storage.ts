"use client";

import { db } from "@/lib/instant";

type UploadedFileResult = {
  path: string;
  url: string;
};

export async function uploadMemeBlob(blob: Blob, userId: string): Promise<UploadedFileResult> {
  const extension = blob.type === "image/jpeg" ? "jpg" : "png";
  const path = `memes/${userId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const uploadResult = (await db.storage.uploadFile(path, blob, {
    contentType: blob.type || "image/png",
    contentDisposition: "inline"
  })) as { path?: string; url?: string } | undefined;

  return {
    path: uploadResult?.path ?? path,
    url: uploadResult?.url ?? ""
  };
}

export async function deleteMemeFile(path: string): Promise<void> {
  if (!path) return;
  await db.storage.delete(path);
}
