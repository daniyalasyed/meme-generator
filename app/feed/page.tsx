"use client";

import Link from "next/link";
import { MemeFeed } from "@/components/MemeFeed";
import { db } from "@/lib/instant";
import { FEED_QUERY, MemeRecord, VoteRecord } from "@/lib/memes";

export default function FeedPage() {
  const { user } = db.useAuth();
  const { isLoading, error, data } = db.useQuery(FEED_QUERY);
  const memes = ((data?.memes as MemeRecord[]) ?? []);
  const votes = ((data?.votes as VoteRecord[]) ?? []);

  return (
    <div className="app">
      <header className="header">
        <h1 className="header-title">Community Feed</h1>
        <p className="header-tagline">View the latest memes and vote in real time.</p>
      </header>

      <div className="top-row">
        <Link className="card nav-card" href="/">
          Back to editor
        </Link>
      </div>

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
