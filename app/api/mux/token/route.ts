import { NextRequest } from "next/server";
import { auth } from "@/lib/server";
import { isDay2Hidden } from "@/config/video";
import { AccessError } from "@/lib/auth/errors";
import {
  COOKIE_NAME,
  endpoint,
  input,
  response,
  setSessionCookie,
} from "@/lib/http";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  return endpoint("playback", async () => {
    const body = await input(request);
    if (body.day === 2 && isDay2Hidden())
      throw new AccessError(404, "Day 2 recording is not available yet.");
    const cookie = request.cookies.get(COOKIE_NAME)?.value;
    const playback = await auth().playback(cookie, body.day);
    return setSessionCookie(response(playback), cookie!);
  });
}
