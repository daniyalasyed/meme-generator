import { NextRequest, NextResponse } from "next/server";

type LimitAction = "post" | "vote";
type BucketMap = Map<string, number[]>;

const LIMITS: Record<LimitAction, { maxInWindow: number; windowMs: number }> = {
  post: { maxInWindow: 5, windowMs: 60_000 },
  vote: { maxInWindow: 20, windowMs: 60_000 }
};

const globalForRateLimit = globalThis as unknown as {
  __memeRateBucket?: BucketMap;
};

const bucket: BucketMap = globalForRateLimit.__memeRateBucket ?? new Map<string, number[]>();
globalForRateLimit.__memeRateBucket = bucket;

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { action?: LimitAction; userId?: string };
  const action = body.action;
  const userId = body.userId?.trim();

  if (!action || !LIMITS[action] || !userId) {
    return NextResponse.json(
      { allowed: false, message: "Invalid rate-limit request payload." },
      { status: 400 }
    );
  }

  const key = `${action}:${userId}`;
  const now = Date.now();
  const start = now - LIMITS[action].windowMs;
  const existing = bucket.get(key) ?? [];
  const active = existing.filter((ts) => ts >= start);

  if (active.length >= LIMITS[action].maxInWindow) {
    bucket.set(key, active);
    return NextResponse.json(
      { allowed: false, message: "Rate limit reached. Please retry in about a minute." },
      { status: 429 }
    );
  }

  active.push(now);
  bucket.set(key, active);
  return NextResponse.json({ allowed: true });
}
