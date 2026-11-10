import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { importPKCS8, SignJWT } from "jose";
import { integer, pem, required } from "../config/server";
import type { StateStore } from "../store/types";
import type { Member } from "../auth/service";
import { parseAllowlist } from "./parse";

let accessToken: { token: string; expiresAt: number } | undefined;
async function googleToken() {
  if (accessToken && accessToken.expiresAt > Date.now() + 60_000)
    return accessToken.token;
  const key = await importPKCS8(
    pem(required("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY")),
    "RS256",
  );
  const assertion = await new SignJWT({
    scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
  })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer(required("GOOGLE_SERVICE_ACCOUNT_EMAIL"))
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(key);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    cache: "no-store",
    signal: AbortSignal.timeout(6_000),
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!response.ok) throw new Error("Google authentication unavailable");
  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };
  if (!data.access_token || !data.expires_in)
    throw new Error("Google authentication invalid");
  accessToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return accessToken.token;
}

export function sheetsLookup(store: StateStore) {
  return async (email: string): Promise<Member | null> => {
    const sheetId = required("GOOGLE_SHEET_ID");
    const range = required("GOOGLE_SHEET_RANGE");
    const key =
      "allowlist:" +
      createHash("sha256").update(`${sheetId}:${range}`).digest("hex");
    const cacheSeconds = integer("GOOGLE_SHEET_CACHE_SECONDS", 15, 0, 60);
    async function fetchRows() {
      const token = await googleToken();
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(range)}`,
        {
          cache: "no-store",
          signal: AbortSignal.timeout(6_000),
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) throw new Error("Allowlist unavailable");
      const data = (await response.json()) as { values?: unknown[][] };
      return parseAllowlist(data.values ?? []);
    }
    if (cacheSeconds === 0) return (await fetchRows())[email] ?? null;
    const owner = randomUUID();
    // One shared snapshot + distributed lock prevents cold starts from exhausting Sheets quota.
    const deadline = Date.now() + 8_000;
    while (Date.now() < deadline) {
      const cached = await store.getCache(key);
      if (cached)
        return (JSON.parse(cached) as Record<string, Member>)[email] ?? null;
      if (await store.acquireLock(key, owner, 20)) {
        try {
          const current = await store.getCache(key);
          if (current)
            return (
              (JSON.parse(current) as Record<string, Member>)[email] ?? null
            );
          const members = await fetchRows();
          await store.setCache(key, JSON.stringify(members), cacheSeconds);
          return members[email] ?? null;
        } finally {
          await store.releaseLock(key, owner);
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    throw new Error("Allowlist refresh busy");
  };
}
