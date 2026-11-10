import { NextRequest } from "next/server";
import { auth } from "@/lib/server";
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
    const cookie = request.cookies.get(COOKIE_NAME)?.value;
    const playback = await auth().playback(cookie, body.day);
    return setSessionCookie(response(playback), cookie!);
  });
}
