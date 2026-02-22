"use client";

import { useEffect, useRef, useState } from "react";
import { MemeEditor } from "@/components/MemeEditor";
import { assertRateLimit } from "@/lib/guardrails";
import { db } from "@/lib/instant";
import { createMeme } from "@/lib/memes";
import { uploadMemeBlob } from "@/lib/storage";
import { DEFAULT_TEMPLATES, TEMPLATES_QUERY, TemplateRecord, seedTemplates, isAdmin } from "@/lib/templates";
import { validateCaption, validateMemeUpload } from "@/lib/validators";

export default function HomePage() {
  const { user } = db.useAuth();
  const { isLoading: templatesLoading, data } = db.useQuery(TEMPLATES_QUERY);
  const [isPosting, setIsPosting] = useState(false);

  const templateRecords = (data?.templates ?? []) as TemplateRecord[];
  const dbTemplates = templateRecords
    .filter((t) => t.path && t.name)
    .map((t) => ({ path: t.path!, name: t.name! }));
  
  const templates = dbTemplates.length > 0 ? dbTemplates : DEFAULT_TEMPLATES;

  // Auto-seed templates if database is empty and user is admin
  const hasSeeded = useRef(false);
  useEffect(() => {
    if (
      !templatesLoading &&
      templateRecords.length === 0 &&
      isAdmin(user?.email) &&
      !hasSeeded.current
    ) {
      hasSeeded.current = true;
      seedTemplates();
    }
  }, [templatesLoading, templateRecords.length, user?.email]);

  async function handlePost(params: { blob: Blob; caption: string }) {
    if (!user) {
      window.alert("Please sign in first.");
      return;
    }

    const imageError = validateMemeUpload(params.blob);
    if (imageError) {
      window.alert(imageError);
      return;
    }

    const captionError = validateCaption(params.caption);
    if (captionError) {
      window.alert(captionError);
      return;
    }

    try {
      await assertRateLimit("post", user.refresh_token);
      setIsPosting(true);
      const upload = await uploadMemeBlob(params.blob, user.id);
      await createMeme({
        imageUrl: upload.url,
        imagePath: upload.path,
        caption: params.caption.trim(),
        authorId: user.id,
        authorName: getDisplayName(user.email, user.id)
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not post meme.";
      window.alert(msg);
    } finally {
      setIsPosting(false);
    }
  }

  return (
    <div className="app">
      <MemeEditor
        canPost={Boolean(user)}
        isPosting={isPosting}
        onPost={handlePost}
        templates={templates}
        templatesLoading={templatesLoading}
      />
    </div>
  );
}

function getDisplayName(email?: string, fallback?: string) {
  if (email) return email.split("@")[0];
  return fallback ?? "user";
}
