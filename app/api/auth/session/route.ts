import { NextRequest } from "next/server";
import { auth } from "@/lib/server";
import { COOKIE_NAME, endpoint, response, setSessionCookie } from "@/lib/http";

export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  return endpoint("session", async () => {
    const cookie = request.cookies.get(COOKIE_NAME)?.value;
    if (!cookie) return response({ authenticated: false });
    const authenticated = Boolean(await auth().session(cookie));
    const result = response({ authenticated });
    return authenticated ? result : setSessionCookie(result, "", true);
  });
}
