import "server-only";
import { isIP } from "node:net";
import { NextRequest, NextResponse } from "next/server";
import { AccessError, TEMPORARY_ERROR } from "./auth/errors";
import { appOrigin } from "./config/server";

export const COOKIE_NAME =
  process.env.NODE_ENV === "production"
    ? "__Host-event-session"
    : "event-session";
export function response(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      Vary: "Cookie",
    },
  });
}
export function setSessionCookie(
  result: NextResponse,
  value: string,
  clear = false,
) {
  result.cookies.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: clear ? 0 : 86_400,
  });
  return result;
}
export function requestIP(request: NextRequest) {
  // Vercel overwrites x-vercel-forwarded-for at its edge. Never trust client-supplied x-forwarded-for.
  if (process.env.VERCEL === "1") {
    const ip = request.headers
      .get("x-vercel-forwarded-for")
      ?.split(",")[0]
      .trim();
    return ip && isIP(ip) ? ip : "unknown";
  }
  return "local";
}
export async function input(
  request: NextRequest,
): Promise<Record<string, unknown>> {
  const origin = request.headers.get("origin");
  let localOrigin = false;
  if (process.env.NODE_ENV !== "production" && origin) {
    try {
      const url = new URL(origin);
      localOrigin =
        url.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) &&
        url.host === request.headers.get("host");
    } catch {
      // A malformed Origin never grants access.
    }
  }
  if (
    (origin !== appOrigin() && !localOrigin) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  ) {
    throw new AccessError(403, "Please reload this page and try again.");
  }
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new AccessError(415, "Expected a JSON request.");
  if (Number(request.headers.get("content-length") ?? 0) > 2048)
    throw new AccessError(413, "Request too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new AccessError(400, "Invalid request.");
  let raw = "";
  let bytes = 0;
  const decoder = new TextDecoder();
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    bytes += part.value.byteLength;
    if (bytes > 2048) {
      await reader.cancel();
      throw new AccessError(413, "Request too large.");
    }
    raw += decoder.decode(part.value, { stream: true });
  }
  raw += decoder.decode();
  try {
    const body: unknown = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new Error();
    return body as Record<string, unknown>;
  } catch {
    throw new AccessError(400, "Invalid request.");
  }
}
export async function endpoint(
  operation: string,
  work: () => Promise<NextResponse>,
) {
  try {
    return await work();
  } catch (error) {
    if (error instanceof AccessError) {
      const result = response({ error: error.message }, error.status);
      if (error.retryAfter)
        result.headers.set("Retry-After", String(error.retryAfter));
      if (
        error.status === 401 ||
        (error.status === 403 && operation === "playback")
      )
        setSessionCookie(result, "", true);
      return result;
    }
    // Deliberately omit provider errors, input, email addresses, and credentials.
    console.error(JSON.stringify({ event: "operation_failed", operation }));
    return response({ error: TEMPORARY_ERROR }, 503);
  }
}
