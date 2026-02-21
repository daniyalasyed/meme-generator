"use client";

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
    <section className="card feed-card">
      <div className="feed-header">
        <h2 className="panel-title">Community feed</h2>
        <p className="pane-help">Newest memes appear first with live vote updates.</p>
      </div>
      {sorted.length === 0 ? (
        <p className="pane-help">No memes posted yet.</p>
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
                  src={meme.imageUrl || "/templates/two-buttons.jpg"}
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
