"use client";

import { id } from "@instantdb/react";
import { db } from "@/lib/instant";

export type MemeRecord = {
  id: string;
  imageUrl?: string;
  imagePath?: string;
  caption?: string;
  authorId?: string;
  authorName?: string;
  createdAt?: number;
};

export type VoteRecord = {
  id: string;
  memeId?: string;
  userId?: string;
  createdAt?: number;
};

export const FEED_QUERY = {
  memes: {},
  votes: {}
};

export async function createMeme(input: {
  imageUrl: string;
  imagePath: string;
  caption: string;
  authorId: string;
  authorName: string;
}): Promise<void> {
  const memeId = id();
  await db.transact(
    db.tx.memes[memeId].update({
      imageUrl: input.imageUrl,
      imagePath: input.imagePath,
      caption: input.caption,
      authorId: input.authorId,
      authorName: input.authorName,
      createdAt: Date.now()
    })
  );
}

export async function toggleVote(params: {
  memeId: string;
  userId: string;
  votes: VoteRecord[];
}): Promise<void> {
  const existingVote = params.votes.find(
    (vote) => vote.memeId === params.memeId && vote.userId === params.userId
  );

  if (existingVote?.id) {
    await db.transact(db.tx.votes[existingVote.id].delete());
    return;
  }

  const voteId = id();
  await db.transact(
    db.tx.votes[voteId].update({
      memeId: params.memeId,
      userId: params.userId,
      createdAt: Date.now()
    })
  );
}

export function toSortedFeed(memes: MemeRecord[]): MemeRecord[] {
  return [...memes].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

export function getVoteCountMap(votes: VoteRecord[]): Record<string, number> {
  const counts: Record<string, number> = {};
  votes.forEach((vote) => {
    if (!vote.memeId) return;
    counts[vote.memeId] = (counts[vote.memeId] ?? 0) + 1;
  });
  return counts;
}

export function getUserVoteSet(votes: VoteRecord[], userId?: string): Set<string> {
  if (!userId) return new Set();
  const set = new Set<string>();
  votes.forEach((vote) => {
    if (vote.userId === userId && vote.memeId) {
      set.add(vote.memeId);
    }
  });
  return set;
}
