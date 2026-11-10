import assert from "node:assert/strict";
import { test } from "node:test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";
import { AuthService, type Member } from "../lib/auth/service";
import { AccessError } from "../lib/auth/errors";
import { normalizeEmail, validDay } from "../lib/auth/validation";
import { parseAllowlist } from "../lib/google-sheets/parse";
import { RedisStore, type RedisCommand } from "../lib/store/redis";
import { MemoryStore } from "./helpers/memory-store";

const exec = promisify(execFile);
const config = {
  secret: "test-only-secret-never-use-in-production",
  otpSeconds: 300,
  cooldownSeconds: 60,
  sessionSeconds: 86400,
  maxAttempts: 5,
  emailRequestsPerHour: 10,
  ipRequestsPerHour: 600,
  ipVerificationsPerMinute: 120,
};
function fixture() {
  let time = Date.now();
  const now = () => time;
  const redisCommand: RedisCommand = async <T>(args: (string | number)[]) => {
    const { stdout } = await exec(process.env.REDIS_CLI || "redis-cli", [
      "-s",
      process.env.REDIS_TEST_SOCKET!,
      "--json",
      ...args.map(String),
    ]);
    return JSON.parse(stdout) as T;
  };
  const store = process.env.REDIS_TEST_SOCKET
    ? new RedisStore(redisCommand, `test:${randomUUID()}:`)
    : new MemoryStore(now);
  const members = new Map<string, Member>([
    ["john@example.com", { email: "john@example.com", name: "John" }],
  ]);
  const sent: { email: string; code: string }[] = [];
  let lookupFails = false;
  let mailFails = false;
  const signed: number[] = [];
  const settings = { ...config };
  const service = new AuthService({
    store,
    config: settings,
    now,
    lookup: async (email) => {
      if (lookupFails) throw new Error("private-provider-error");
      return members.get(email) ?? null;
    },
    sendCode: async (member, code) => {
      if (mailFails) throw new Error("private-mail-error");
      sent.push({ email: member.email, code });
    },
    signPlayback: async (day) => {
      signed.push(day);
      return {
        playbackId: `day-${day}`,
        tokens: {
          playback: "signed",
          thumbnail: "signed",
          storyboard: "signed",
        },
        expiresAt: now() + 600000,
      };
    },
  });
  async function login() {
    await service.deliverCode("john@example.com");
    return service.verifyCode(
      "john@example.com",
      sent.at(-1)!.code,
      "127.0.0.1",
    );
  }
  return {
    service,
    store,
    members,
    sent,
    signed,
    login,
    now,
    rotateSecret: () => { settings.secret = "another-test-only-secret-for-rotation"; },
    advance: (ms: number) => {
      time += ms;
    },
    failLookup: () => {
      lookupFails = true;
    },
    failMail: () => {
      mailFails = true;
    },
  };
}

test("rotating SESSION_SECRET invalidates existing sessions and pending codes", async () => {
  const f = fixture();
  const cookie = await f.login();
  await f.service.deliverCode("john@example.com");
  const code = f.sent.at(-1)!.code;
  f.rotateSecret();
  assert.equal(await f.service.session(cookie), null);
  await assert.rejects(f.service.verifyCode("john@example.com", code, "ip"));
});

test("normalizes case and whitespace; rejects malformed input", () => {
  for (const value of [
    "JOHN@EXAMPLE.COM",
    " John@example.com ",
    "john@example.com",
  ])
    assert.equal(normalizeEmail(value), "john@example.com");
  for (const value of [
    null,
    {},
    "x",
    "a@@example.com",
    "x y@example.com",
    "a".repeat(255) + "@x.com",
  ])
    assert.equal(normalizeEmail(value), null);
});
test("Sheets handles enabled/status, normalization, missing headers and conflicting duplicates", () => {
  const list = parseAllowlist([
    ["email", "name", "enabled"],
    [" JOHN@example.com ", "John", true],
    ["disabled@example.com", "No", false],
    ["john@example.com", "John", false],
    ["john@example.com", "John", true],
    ["yes@example.com", "Yes", "TRUE"],
  ]);
  assert.equal(list["john@example.com"], undefined);
  assert.equal(list["disabled@example.com"], undefined);
  assert.equal(list["yes@example.com"].name, "Yes");
  assert.ok(
    parseAllowlist([
      ["email", "name", "status"],
      ["a@example.com", "A", "enabled"],
    ])["a@example.com"],
  );
  assert.throws(() => parseAllowlist([["email", "name"]]));
  assert.throws(() => parseAllowlist([["email", "email", "enabled", "name"]]));
});
test("authorized, unknown and disabled email requests have identical public results; only authorized receives mail", async () => {
  const f = fixture();
  for (const email of [
    " JOHN@example.com ",
    "unknown@example.com",
    "disabled@example.com",
  ]) {
    const admission = await f.service.requestCode(email, "1.1.1.1");
    assert.deepEqual({ success: admission.success }, { success: true });
    if (admission.deliver) await f.service.deliverCode(admission.email);
  }
  assert.equal(f.sent.length, 1);
  assert.match(f.sent[0].code, /^\d{6}$/);
  assert.equal(f.sent[0].email, "john@example.com");
});
test("60-second cooldown and hourly per-email limits do not expose authorization", async () => {
  const f = fixture();
  assert.equal(
    (await f.service.requestCode("john@example.com", "ip")).deliver,
    true,
  );
  assert.equal(
    (await f.service.requestCode("JOHN@example.com", "different-ip")).deliver,
    false,
  );
  assert.equal(
    (await f.service.requestCode("unknown@example.com", "ip")).deliver,
    true,
  );
  assert.equal(
    (await f.service.requestCode("unknown@example.com", "ip")).deliver,
    false,
  );
  for (let i = 0; i < 11; i++)
    assert.equal(
      (await f.service.requestCode("john@example.com", "ip")).success,
      true,
    );
});
test("rate counter expires and rejects requests past the limit", async () => {
  const store = new MemoryStore(() => time);
  let time = 0;
  assert.equal(await store.limit("ip", 2, 60), true);
  assert.equal(await store.limit("ip", 2, 60), true);
  assert.equal(await store.limit("ip", 2, 60), false);
  time = 60000;
  assert.equal(await store.limit("ip", 2, 60), true);
});
test("per-IP request limit applies across different emails", async () => {
  const f = fixture();
  // Pre-fill the actual store limit using the same key captured by a wrapper.
  const original = f.store.limit.bind(f.store);
  f.store.limit = (key, maximum, seconds) =>
    original(key, key.startsWith("request-ip:") ? 2 : maximum, seconds);
  await f.service.requestCode("a@example.com", "shared-ip");
  await f.service.requestCode("b@example.com", "shared-ip");
  await assert.rejects(
    f.service.requestCode("c@example.com", "shared-ip"),
    (error: unknown) => error instanceof AccessError && error.status === 429,
  );
});
test("OTP expires at five minutes", async () => {
  const f = fixture();
  await f.service.deliverCode("john@example.com");
  f.advance(300000);
  await assert.rejects(
    f.service.verifyCode("john@example.com", f.sent[0].code, "ip"),
    /invalid or has expired/,
  );
});
test("only the newest OTP works and an OTP is consumed once", async () => {
  const f = fixture();
  await f.service.deliverCode("john@example.com");
  const first = f.sent[0].code;
  do {
    await f.service.deliverCode("john@example.com");
  } while (f.sent.at(-1)!.code === first);
  await assert.rejects(f.service.verifyCode("john@example.com", first, "ip"));
  const newest = f.sent.at(-1)!.code;
  assert.ok(await f.service.verifyCode("john@example.com", newest, "ip"));
  await assert.rejects(f.service.verifyCode("john@example.com", newest, "ip"));
});
test("five incorrect guesses destroy an OTP", async () => {
  const f = fixture();
  await f.service.deliverCode("john@example.com");
  const right = f.sent[0].code;
  const wrong = right === "000000" ? "000001" : "000000";
  for (let i = 0; i < 5; i++)
    await assert.rejects(f.service.verifyCode("john@example.com", wrong, "ip"));
  await assert.rejects(f.service.verifyCode("john@example.com", right, "ip"));
});
test("concurrent verification cannot consume the same code twice", async () => {
  const f = fixture();
  await f.service.deliverCode("john@example.com");
  const results = await Promise.allSettled(
    Array.from({ length: 8 }, () =>
      f.service.verifyCode("john@example.com", f.sent[0].code, "ip"),
    ),
  );
  assert.equal(
    results.filter((result) => result.status === "fulfilled").length,
    1,
  );
});
test("session created with opaque cookie; idle session expires in 24 hours", async () => {
  const f = fixture();
  const cookie = await f.login();
  assert.match(cookie, /^[a-f0-9]{64}\.[a-f0-9]{64}$/);
  const session = await f.service.session(cookie);
  assert.equal(session?.email, "john@example.com");
  f.advance(86400000);
  assert.equal(await f.service.session(cookie), null);
});
test("authenticated token requests slide session expiry; session checks do not", async () => {
  const f = fixture();
  const cookie = await f.login();
  const initial = (await f.service.session(cookie))!.expiresAt;
  f.advance(8 * 3600000);
  assert.equal((await f.service.session(cookie))!.expiresAt, initial);
  await f.service.playback(cookie, 1);
  assert.equal(
    (await f.service.session(cookie))!.expiresAt,
    f.now() + 86400000,
  );
  f.advance(20 * 3600000);
  assert.ok(await f.service.session(cookie));
});
test("new-device login replaces previous session; old logout cannot remove the new session", async () => {
  const f = fixture();
  const first = await f.login();
  const second = await f.login();
  assert.equal(await f.service.session(first), null);
  assert.ok(await f.service.session(second));
  await f.service.logout(first);
  assert.ok(await f.service.session(second));
  await f.service.logout(second);
  assert.equal(await f.service.session(second), null);
});
test("old in-flight session refresh cannot resurrect a replaced session", async () => {
  const f = fixture();
  const first = await f.login();
  const prior = (await f.service.session(first))!;
  const second = await f.login();
  assert.equal(
    await f.store.touchSession(prior.user, prior.tokenHash, f.now(), 86400),
    false,
  );
  assert.ok(await f.service.session(second));
});
test("revocation denies tokens and clears the session", async () => {
  const f = fixture();
  const cookie = await f.login();
  f.members.clear();
  await assert.rejects(
    f.service.playback(cookie, 1),
    (e: unknown) => e instanceof AccessError && e.status === 403,
  );
  assert.equal(f.signed.length, 0);
  assert.equal(await f.service.session(cookie), null);
});
test("revocation between request and verification denies login", async () => {
  const f = fixture();
  await f.service.deliverCode("john@example.com");
  f.members.clear();
  await assert.rejects(
    f.service.verifyCode("john@example.com", f.sent[0].code, "ip"),
  );
});
test("missing, forged and malformed cookies cannot obtain Mux tokens", async () => {
  const f = fixture();
  const cookie = await f.login();
  for (const value of [
    undefined,
    "",
    "bad",
    cookie.slice(0, 65) + "0".repeat(64),
  ]) {
    await assert.rejects(
      f.service.playback(value, 1),
      (e: unknown) => e instanceof AccessError && e.status === 401,
    );
  }
  assert.equal(f.signed.length, 0);
});
test("only integer Day 1 and Day 2 can select server playback IDs", async () => {
  const f = fixture();
  const cookie = await f.login();
  for (const value of [0, 3, "1", null, {}, "arbitrary-id"]) {
    assert.equal(validDay(value), false);
    await assert.rejects(f.service.playback(cookie, value));
  }
  assert.equal((await f.service.playback(cookie, 1)).playbackId, "day-1");
  assert.equal((await f.service.playback(cookie, 2)).playbackId, "day-2");
});
test("Sheets failure issues no token and does not refresh session", async () => {
  const f = fixture();
  const cookie = await f.login();
  const expiry = (await f.service.session(cookie))!.expiresAt;
  f.advance(10000);
  f.failLookup();
  await assert.rejects(f.service.playback(cookie, 1));
  assert.equal(f.signed.length, 0);
  assert.equal((await f.service.session(cookie))!.expiresAt, expiry);
});
test("failed email delivery removes unusable OTP state", async () => {
  const f = fixture();
  f.failMail();
  await assert.rejects(f.service.deliverCode("john@example.com"));
  assert.equal(f.sent.length, 0);
  await assert.rejects(
    f.service.verifyCode("john@example.com", "123456", "ip"),
  );
});
test(
  "atomic rate limiting permits exactly the configured number under concurrency",
  { skip: !process.env.REDIS_TEST_SOCKET },
  async () => {
    const f = fixture();
    const results = await Promise.all(
      Array.from({ length: 30 }, () => f.store.limit("parallel", 5, 60)),
    );
    assert.equal(results.filter(Boolean).length, 5);
  },
);
