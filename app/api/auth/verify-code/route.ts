import { NextRequest } from "next/server";
import { auth } from "@/lib/server";
import {
  endpoint,
  input,
  requestIP,
  response,
  setSessionCookie,
} from "@/lib/http";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  return endpoint("verify_code", async () => {
    const body = await input(request);
    const cookie = await auth().verifyCode(
      body.email,
      body.code,
      requestIP(request),
    );
    return setSessionCookie(response({ success: true }), cookie);
  });
}
