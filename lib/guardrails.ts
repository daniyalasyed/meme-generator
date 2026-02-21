"use client";

export async function assertRateLimit(action: "post" | "vote", userId: string): Promise<void> {
  const res = await fetch("/api/rate-limit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ action, userId })
  });

  if (res.ok) return;

  let message = "Rate limit reached.";
  try {
    const data = (await res.json()) as { message?: string };
    if (data?.message) message = data.message;
  } catch {
    // Ignore parse errors and keep default message.
  }
  throw new Error(message);
}
