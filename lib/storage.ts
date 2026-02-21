"use client";

import { db } from "@/lib/instant";

type UploadedFileResult = {
  path: string;
  url: string;
};

export async function uploadMemeBlob(blob: Blob, userId: string): Promise<UploadedFileResult> {
  const extension = blob.type === "image/jpeg" ? "jpg" : "png";
  const path = `memes/${userId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const uploadResult = await db.storage.uploadFile(path, blob, {
    contentType: blob.type || "image/png",
    contentDisposition: "inline"
  });

  const fileId = uploadResult?.data?.id;
  if (!fileId) {
    throw new Error("Upload failed: no file ID returned");
  }

  const filesQuery = await db.queryOnce({ $files: { $: { where: { id: fileId } } } });
  const fileRecord = filesQuery.data?.$files?.[0];

  if (!fileRecord?.url) {
    throw new Error("Upload succeeded but could not retrieve file URL");
  }

  return {
    path: fileRecord.path ?? path,
    url: fileRecord.url
  };
}

export async function deleteMemeFile(path: string): Promise<void> {
  if (!path) return;
  await db.storage.delete(path);
}

export async function uploadTemplateImage(blob: Blob): Promise<UploadedFileResult> {
  const extension = blob.type === "image/jpeg" ? "jpg" : "png";
  const path = `templates/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const uploadResult = await db.storage.uploadFile(path, blob, {
    contentType: blob.type || "image/png",
    contentDisposition: "inline"
  });

  const fileId = uploadResult?.data?.id;
  if (!fileId) {
    throw new Error("Upload failed: no file ID returned");
  }

  const filesQuery = await db.queryOnce({ $files: { $: { where: { id: fileId } } } });
  const fileRecord = filesQuery.data?.$files?.[0];

  if (!fileRecord?.url) {
    throw new Error("Upload succeeded but could not retrieve file URL");
  }

  return {
    path: fileRecord.path ?? path,
    url: fileRecord.url
  };
}
