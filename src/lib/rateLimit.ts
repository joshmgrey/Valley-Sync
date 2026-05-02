import { NextResponse } from "next/server";

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

function allow(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

// Returns a 429 Response if the limit is exceeded, otherwise null.
export function rateLimit(
  userId: string,
  action: string,
  limit = 60,
  windowMs = 60_000
): NextResponse | null {
  if (!allow(`${userId}:${action}`, limit, windowMs)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  return null;
}
