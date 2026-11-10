import "server-only";
import { required } from "../config/server";
import type { Member } from "../auth/service";

export async function sendCode(member: Member, code: string, id: string) {
  const event = "IDSW Stream";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
    headers: {
      Authorization: `Bearer ${required("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `otp-${id}`,
    },
    body: JSON.stringify({
      from: required("RESEND_FROM_EMAIL"),
      to: [member.email],
      subject: `Your access code for ${event}`,
      text: `Hello ${member.name || "there"},\n\nYour access code for ${event} is:\n\n${code}\n\nThis code expires in 5 minutes. Only your newest code will work.\n\nIf you did not request this code, you can ignore this email.`,
    }),
  });
  if (!response.ok) throw new Error("Email delivery unavailable");
}
