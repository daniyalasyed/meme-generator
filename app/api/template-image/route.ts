import { NextRequest } from "next/server";

const ALLOWED_TEMPLATE_HOSTS = new Set(["files.instantdb.com"]);

export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get("src");
  if (!src) {
    return new Response("Missing src parameter", { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(src);
  } catch {
    return new Response("Invalid src URL", { status: 400 });
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return new Response("Unsupported protocol", { status: 400 });
  }

  if (!ALLOWED_TEMPLATE_HOSTS.has(parsed.hostname)) {
    return new Response("Host not allowed", { status: 403 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(parsed.toString(), { cache: "no-store" });
  } catch (error) {
    return new Response("Could not fetch template image", { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return new Response("Template image unavailable", { status: 502 });
  }

  const headers = new Headers();
  headers.set("Content-Type", upstream.headers.get("content-type") ?? "image/jpeg");
  headers.set("Cache-Control", "private, max-age=60");

  return new Response(upstream.body, {
    status: 200,
    headers
  });
}
