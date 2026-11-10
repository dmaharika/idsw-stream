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
  return endpoint("logout", async () => {
    await input(request);
    await auth().logout(request.cookies.get(COOKIE_NAME)?.value);
    return setSessionCookie(response({ success: true }), "", true);
  });
}
