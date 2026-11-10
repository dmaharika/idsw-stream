import { after, NextRequest } from "next/server";
import { auth } from "@/lib/server";
import { endpoint, input, requestIP, response } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: NextRequest) {
  return endpoint("request_code", async () => {
    const body = await input(request);
    const service = auth();
    const admission = await service.requestCode(body.email, requestIP(request));
    if (admission.deliver)
      after(async () => {
        try {
          await service.deliverCode(admission.email);
        } catch {
          console.error(JSON.stringify({ event: "code_delivery_failed" }));
        }
      });
    return response({ success: true });
  });
}
