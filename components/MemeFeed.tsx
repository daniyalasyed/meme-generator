"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { assertRateLimit } from "@/lib/guardrails";
import { getUserVoteSet, getVoteCountMap, MemeRecord, toggleVote, toSortedFeed, VoteRecord } from "@/lib/memes";

type MemeFeedProps = {
  memes: MemeRecord[];
  votes: VoteRecord[];
  currentUserId?: string;
};

export function MemeFeed({ memes, votes, currentUserId }: MemeFeedProps) {
  const [busyMemeId, setBusyMemeId] = useState<string | null>(null);
  const voteCountMap = useMemo(() => getVoteCountMap(votes), [votes]);
  const userVotes = useMemo(() => getUserVoteSet(votes, currentUserId), [votes, currentUserId]);
  const sorted = useMemo(() => toSortedFeed(memes), [memes]);

  async function handleVote(memeId: string) {
    if (!currentUserId) {
      return;
    }
    setBusyMemeId(memeId);
    try {
      await assertRateLimit("vote", currentUserId);
      await toggleVote({
        memeId,
        userId: currentUserId,
        votes
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not save vote.";
      window.alert(msg);
    } finally {
      setBusyMemeId(null);
    }
  }

  return (
    <section className="feed-section">
      {sorted.length === 0 ? (
        <div className="empty-feed">
          <svg
            className="empty-feed-icon"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <h3 className="empty-feed-title">No memes yet</h3>
          <p className="empty-feed-text">Be the first to create and share a meme!</p>
          <Link href="/" className="empty-feed-cta">
            Create Your First Meme
          </Link>
        </div>
      ) : (
        <div className="feed-list">
          {sorted.map((meme) => {
            const voteCount = voteCountMap[meme.id] ?? 0;
            const liked = userVotes.has(meme.id);
            return (
              <article key={meme.id} className="feed-item">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="feed-image"
                  src={meme.imageUrl}
                  alt={meme.caption || "Posted meme"}
                />
                <div className="feed-meta">
                  <p className="feed-caption">{meme.caption || "Untitled meme"}</p>
                  <p className="feed-author">{meme.authorName || "Anonymous"}</p>
                  <p className="feed-time">{formatRelative(meme.createdAt)}</p>
                </div>
                <button
                  type="button"
                  className={`vote-btn ${liked ? "active" : ""}`}
                  onClick={() => handleVote(meme.id)}
                  disabled={!currentUserId || busyMemeId === meme.id}
                >
                  ▲ {voteCount}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function formatRelative(timestamp?: number) {
  if (!timestamp) return "just now";
  const diffMs = Date.now() - timestamp;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
