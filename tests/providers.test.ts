import assert from "node:assert/strict";
import { test } from "node:test";
import { generateKeyPairSync } from "node:crypto";
import { jwtVerify } from "jose";
import { sheetsLookup } from "../lib/google-sheets/client";
import { sendCode } from "../lib/resend/client";
import { restCommand } from "../lib/store/redis";
import { MemoryStore } from "./helpers/memory-store";

test("Sheets uses a read-only assertion and shared short cache; revocation is seen after expiry and failures do not serve stale data", async (t) => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  Object.assign(process.env, {
    GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
    GOOGLE_SERVICE_ACCOUNT_EMAIL: "test@serviceaccount.example",
    GOOGLE_SHEET_ID: "test-sheet",
    GOOGLE_SHEET_RANGE: "'Allowlist'!A:D",
    GOOGLE_SHEET_CACHE_SECONDS: "15",
  });
  let now = Date.now();
  let sheetCalls = 0;
  let enabled = true;
  let unavailable = false;
  t.mock.method(globalThis, "fetch", async (url: string, options: RequestInit) => {
    if (url === "https://oauth2.googleapis.com/token") {
      const params = options.body as URLSearchParams;
      const { payload } = await jwtVerify(params.get("assertion")!, publicKey, { audience: "https://oauth2.googleapis.com/token" });
      assert.equal(payload.scope, "https://www.googleapis.com/auth/spreadsheets.readonly");
      return Response.json({ access_token: "test-google-token", expires_in: 3600 });
    }
    assert.match(url, /^https:\/\/sheets.googleapis.com\/v4\/spreadsheets\/test-sheet\/values\//);
    assert.equal(options.cache, "no-store");
    assert.deepEqual(options.headers, { Authorization: "Bearer test-google-token" });
    sheetCalls++;
    return unavailable ? new Response("provider-details", { status: 503 }) : Response.json({ values: [["email", "name", "enabled"], ["john@example.com", "John", enabled]] });
  });
  const store = new MemoryStore(() => now);
  const lookup = sheetsLookup(store);
  assert.equal((await lookup("john@example.com"))?.name, "John");
  enabled = false;
  assert.ok(await sheetsLookup(store)("john@example.com"));
  assert.equal(sheetCalls, 1);
  now += 15001;
  assert.equal(await lookup("john@example.com"), null);
  assert.equal(sheetCalls, 2);
  now += 15001; unavailable = true;
  await assert.rejects(lookup("john@example.com"), /Allowlist unavailable/);
  unavailable = false; enabled = true;
  // Failed refresh releases its lock and never overwrites the cache with stale data.
  assert.ok(await lookup("john@example.com"));
});

test("Resend sends clean plain-text OTP email with idempotency and hides provider failures", async (t) => {
  process.env.RESEND_API_KEY = "test-resend-key";
  process.env.RESEND_FROM_EMAIL = "Event <access@example.com>";
  let fail = false;
  t.mock.method(globalThis, "fetch", async (url: string, options: RequestInit) => {
    assert.equal(url, "https://api.resend.com/emails");
    const payload = JSON.parse(options.body as string);
    assert.deepEqual(payload.to, ["john@example.com"]);
    assert.match(payload.text, /Hello John/);
    assert.match(payload.text, /123456/);
    assert.match(payload.text, /5 minutes/);
    assert.equal((options.headers as Record<string, string>)["Idempotency-Key"], "otp-test-request");
    return new Response(fail ? "private-provider-error" : "{}", { status: fail ? 429 : 200 });
  });
  await sendCode({ email: "john@example.com", name: "John" }, "123456", "test-request");
  fail = true;
  await assert.rejects(sendCode({ email: "john@example.com", name: "John" }, "123456", "test-request"), /^Error: Email delivery unavailable$/);
});

test("Redis REST uses HTTPS and never retries ambiguous mutations or exposes provider errors", async (t) => {
  assert.throws(() => restCommand("http://example.com", "test"));
  let calls = 0;
  t.mock.method(globalThis, "fetch", async (_url: string, options: RequestInit) => {
    calls++;
    assert.equal(options.method, "POST");
    assert.equal(options.cache, "no-store");
    return Response.json({ error: "internal-provider-secret" });
  });
  await assert.rejects(restCommand("https://redis.example", "test")(["SET", "test", "value"]), /^Error: State store command failed$/);
  assert.equal(calls, 1);
});
