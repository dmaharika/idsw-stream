import { normalizeEmail } from "../auth/validation";
import type { Member } from "../auth/service";

export function parseAllowlist(rows: unknown[][]): Record<string, Member> {
  if (!Array.isArray(rows[0])) throw new Error("Allowlist headers missing");
  const headers = rows[0].map((value) => String(value).trim().toLowerCase());
  const emailIndex = headers.indexOf("email");
  const nameIndex = headers.indexOf("name");
  const statusIndex =
    headers.indexOf("enabled") >= 0
      ? headers.indexOf("enabled")
      : headers.indexOf("status");
  if ([emailIndex, nameIndex, statusIndex].includes(-1))
    throw new Error("Allowlist headers invalid");
  if (new Set(headers.filter(Boolean)).size !== headers.filter(Boolean).length)
    throw new Error("Allowlist headers duplicated");
  const members: Record<string, Member> = Object.create(null);
  const disabled = new Set<string>();
  for (const row of rows.slice(1)) {
    if (!Array.isArray(row)) continue;
    const email = normalizeEmail(row[emailIndex]);
    if (!email) continue;
    const enabled = ["true", "enabled", "active", "1", "yes"].includes(
      String(row[statusIndex] ?? "")
        .trim()
        .toLowerCase(),
    );
    // Fail closed for conflicting duplicate rows, regardless of their order.
    if (!enabled) {
      disabled.add(email);
      delete members[email];
    } else if (!disabled.has(email))
      members[email] = { email, name: String(row[nameIndex] ?? "").trim() };
  }
  return members;
}
