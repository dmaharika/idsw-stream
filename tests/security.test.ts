import assert from "node:assert/strict";
import { test } from "node:test";
import { createPrivateKey, generateKeyPairSync } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { jwtVerify } from "jose";
import { NextRequest } from "next/server";
import { signPlayback } from "../lib/mux/sign";
import {
  input,
  endpoint,
  response,
  setSessionCookie,
  requestIP,
} from "../lib/http";
import { authConfig, pem } from "../lib/config/server";

test("accepts PEM and base64 PKCS#8 service-account key formats", () => {
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const der = privateKey.export({ type: "pkcs8", format: "der" });
  const bare = der.toString("base64").match(/.{1,64}/g)!.join("\\n");
  assert.equal(createPrivateKey(pem(bare)).asymmetricKeyType, "rsa");
  const encodedPem = Buffer.from(privateKey.export({ type: "pkcs8", format: "pem" })).toString("base64");
  assert.equal(createPrivateKey(pem(encodedPem)).asymmetricKeyType, "rsa");
});

test("Mux signs distinct restricted RS256 tokens with correct audience, ID and short expiry", async () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });
  Object.assign(process.env, {
    MUX_SIGNING_PRIVATE_KEY: privateKey
      .export({ type: "pkcs8", format: "pem" })
      .toString(),
    MUX_SIGNING_KEY_ID: "test-key",
    MUX_PLAYBACK_RESTRICTION_ID: "test-restriction",
    DAY_1_ID: "test-day-1",
    DAY_2_ID: "test-day-2",
    MUX_TOKEN_EXPIRATION_SECONDS: "600",
  });
  for (const day of [1, 2] as const) {
    const result = await signPlayback(day);
    for (const [kind, audience] of [
      ["playback", "v"],
      ["thumbnail", "t"],
      ["storyboard", "s"],
    ] as const) {
      const { payload, protectedHeader } = await jwtVerify(
        result.tokens[kind],
        publicKey,
        { algorithms: ["RS256"], audience },
      );
      assert.equal(payload.sub, `test-day-${day}`);
      assert.equal(protectedHeader.kid, "test-key");
      assert.equal(payload.playback_restriction_id, "test-restriction");
      assert.ok(payload.exp! - Math.floor(Date.now() / 1000) <= 600);
      assert.ok(payload.exp! > Date.now() / 1000);
      assert.equal(result.expiresAt, payload.exp! * 1000);
    }
  }
  delete process.env.MUX_PLAYBACK_RESTRICTION_ID;
  await assert.rejects(signPlayback(1), /Missing configuration/);
});
test("configuration rejects weak secrets and excessive playback lifetimes", async () => {
  process.env.SESSION_SECRET = "short";
  assert.throws(authConfig);
  process.env.MUX_PLAYBACK_RESTRICTION_ID = "test";
  process.env.MUX_TOKEN_EXPIRATION_SECONDS = "999999";
  await assert.rejects(signPlayback(1));
});
test("cookies are HttpOnly, SameSite=Lax, path / with a 24-hour lifetime", () => {
  const header = setSessionCookie(
    response({ success: true }),
    "opaque",
  ).headers.get("set-cookie")!;
  assert.match(header, /HttpOnly/);
  assert.match(header, /SameSite=lax/i);
  assert.match(header, /Path=\//);
  assert.match(header, /Max-Age=86400/);
  assert.match(
    setSessionCookie(response({}), "", true).headers.get("set-cookie")!,
    /Max-Age=0/,
  );
  assert.match(response({}).headers.get("cache-control")!, /no-store/);
  const previous = process.env.NODE_ENV;
  Object.assign(process.env, { NODE_ENV: "production" });
  try {
    assert.match(setSessionCookie(response({}), "opaque").headers.get("set-cookie")!, /Secure/);
  } finally {
    if (previous === undefined) Reflect.deleteProperty(process.env, "NODE_ENV");
    else Object.assign(process.env, { NODE_ENV: previous });
  }
});
test("mutating requests require the configured origin, JSON, small object bodies", async () => {
  process.env.APP_URL = "https://stream.example.com";
  const request = (
    body: string,
    origin = "https://stream.example.com",
    contentType = "application/json",
  ) =>
    new NextRequest("https://stream.example.com/api/auth/request-code", {
      method: "POST",
      headers: { origin, "content-type": contentType },
      body,
    });
  assert.deepEqual(await input(request('{"day":1}')), { day: 1 });
  await assert.rejects(input(request("{}", "https://attacker.example")));
  await assert.rejects(input(request("{}", "")));
  await assert.rejects(
    input(request("{}", "https://stream.example.com", "text/plain")),
  );
  for (const body of [
    "[]",
    "null",
    "{bad}",
    JSON.stringify({ email: "x".repeat(3000) }),
  ])
    await assert.rejects(input(request(body)));
});
test("local development accepts either loopback hostname but production keeps the configured origin", async () => {
  process.env.APP_URL = "https://stream.example.com";
  const local = () => new NextRequest("http://127.0.0.1:3000/api/auth/request-code", {
    method: "POST",
    headers: { origin: "http://127.0.0.1:3000", host: "127.0.0.1:3000", "content-type": "application/json" },
    body: "{}",
  });
  assert.deepEqual(await input(local()), {});
  const previous = process.env.NODE_ENV;
  Object.assign(process.env, { NODE_ENV: "production" });
  try { await assert.rejects(input(local())); }
  finally {
    if (previous === undefined) Reflect.deleteProperty(process.env, "NODE_ENV");
    else Object.assign(process.env, { NODE_ENV: previous });
  }
});
test("errors never return provider details", async () => {
  const result = await endpoint("test", async () => {
    throw new Error("SECRET_API_TOKEN provider email@example.com");
  });
  assert.equal(result.status, 503);
  assert.doesNotMatch(await result.text(), /SECRET|provider|email@example/);
});
test("IP limits trust only Vercel edge headers in Vercel deployments", () => {
  process.env.VERCEL = "1";
  assert.equal(
    requestIP(
      new NextRequest("https://stream.example.com", {
        headers: {
          "x-forwarded-for": "1.2.3.4",
          "x-vercel-forwarded-for": "5.6.7.8",
        },
      }),
    ),
    "5.6.7.8",
  );
  assert.equal(
    requestIP(
      new NextRequest("https://stream.example.com", {
        headers: { "x-forwarded-for": "1.2.3.4" },
      }),
    ),
    "unknown",
  );
  delete process.env.VERCEL;
});
test("secret-bearing modules are server-only and client components contain no secret references", async () => {
  for (const file of [
    "lib/server.ts",
    "lib/config/server.ts",
    "lib/auth/service.ts",
    "lib/google-sheets/client.ts",
    "lib/resend/client.ts",
    "lib/mux/sign.ts",
    "lib/store/redis.ts",
  ]) {
    assert.match(await readFile(file, "utf8"), /import ["']server-only["']/, file);
  }
  for (const file of await readdir("components")) {
    assert.doesNotMatch(
      await readFile(`components/${file}`, "utf8"),
      /process\.env|localStorage|sessionStorage|PRIVATE_KEY|RESEND_API_KEY|SESSION_SECRET|UPSTASH_REDIS_REST_TOKEN/,
      file,
    );
  }
});
