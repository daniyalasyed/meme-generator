import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/instant-admin";

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
  const body = (await req.json()) as { action?: LimitAction; token?: string };
  const action = body.action;
  const token = body.token?.trim();

  if (!action || !LIMITS[action] || !token) {
    return NextResponse.json(
      { allowed: false, message: "Invalid rate-limit request payload." },
      { status: 400 }
    );
  }

  // Verify the token server-side to get the real user ID
  let userId: string;
  try {
    const user = await adminDb.auth.verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { allowed: false, message: "Invalid authentication token." },
        { status: 401 }
      );
    }
    userId = user.id;
  } catch {
    return NextResponse.json(
      { allowed: false, message: "Failed to verify authentication." },
      { status: 401 }
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
