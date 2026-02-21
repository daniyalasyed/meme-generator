const bucket = new Map<string, number[]>();

export function canRunAction(key: string, maxInWindow: number, windowMs: number): boolean {
  const now = Date.now();
  const start = now - windowMs;
  const prev = bucket.get(key) ?? [];
  const next = prev.filter((ts) => ts >= start);
  if (next.length >= maxInWindow) {
    bucket.set(key, next);
    return false;
  }
  next.push(now);
  bucket.set(key, next);
  return true;
}
