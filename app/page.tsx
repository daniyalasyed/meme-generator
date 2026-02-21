"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AuthPanel } from "@/components/AuthPanel";
import { MemeEditor } from "@/components/MemeEditor";
import { MemeFeed } from "@/components/MemeFeed";
import { assertRateLimit } from "@/lib/guardrails";
import { db } from "@/lib/instant";
import { createMeme, FEED_QUERY, MemeRecord, VoteRecord } from "@/lib/memes";
import { uploadMemeBlob } from "@/lib/storage";
import { validateCaption, validateMemeUpload } from "@/lib/validators";

export default function HomePage() {
  const { user } = db.useAuth();
  const { isLoading, error, data } = db.useQuery(FEED_QUERY);
  const [isPosting, setIsPosting] = useState(false);

  const memes = useMemo(() => ((data?.memes as MemeRecord[]) ?? []), [data]);
  const votes = useMemo(() => ((data?.votes as VoteRecord[]) ?? []), [data]);

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
      await assertRateLimit("post", user.id);
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
      <header className="header">
        <h1 className="header-title">Meme Generator</h1>
        <p className="header-tagline">Create, post, and upvote memes in real time.</p>
      </header>

      <div className="top-row">
        <AuthPanel />
        <Link className="card nav-card" href="/feed">
          Open feed-only page
        </Link>
      </div>

      <MemeEditor canPost={Boolean(user)} isPosting={isPosting} onPost={handlePost} />

      {isLoading ? (
        <section className="card feed-card">
          <p className="pane-help">Loading feed...</p>
        </section>
      ) : error ? (
        <section className="card feed-card">
          <p className="pane-help">{error.message || "Failed to load feed."}</p>
        </section>
      ) : (
        <MemeFeed memes={memes} votes={votes} currentUserId={user?.id} />
      )}
    </div>
  );
}

function getDisplayName(email?: string, fallback?: string) {
  if (email) return email.split("@")[0];
  return fallback ?? "user";
}
