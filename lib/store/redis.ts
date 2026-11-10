import "server-only";
import type { OTP, Session, StateStore } from "./types";

export type RedisCommand = <T>(args: (string | number)[]) => Promise<T>;

// No retries for mutations: an ambiguous network timeout may have committed.
export function restCommand(url: string, token: string): RedisCommand {
  if (new URL(url).protocol !== "https:")
    throw new Error("Redis REST URL must use HTTPS");
  return async <T>(args: (string | number)[]) => {
    const response = await fetch(url, {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
    });
    if (!response.ok) throw new Error("State store unavailable");
    const data = (await response.json()) as { result: T; error?: string };
    if (data.error) throw new Error("State store command failed");
    return data.result;
  };
}

export class RedisStore implements StateStore {
  constructor(
    private command: RedisCommand,
    private prefix = "event-stream:",
  ) {}
  private key(value: string) {
    return this.prefix + value;
  }
  private eval<T>(
    script: string,
    keys: string[],
    args: (string | number)[] = [],
  ) {
    return this.command<T>([
      "EVAL",
      script,
      keys.length,
      ...keys.map((k) => this.key(k)),
      ...args,
    ]);
  }
  async limit(key: string, maximum: number, seconds: number) {
    return (
      (await this.eval<number>(
        `
      local n = redis.call('INCR', KEYS[1])
      if n == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
      return n
    `,
        ["limit:" + key],
        [seconds],
      )) <= maximum
    );
  }
  async putOTP(user: string, otp: OTP, seconds: number) {
    await this.command([
      "SET",
      this.key(`otp:{${user}}`),
      JSON.stringify(otp),
      "EX",
      seconds,
    ]);
  }
  async deleteOTP(user: string, hash: string) {
    await this.eval(
      `
      local raw = redis.call('GET', KEYS[1])
      if raw and cjson.decode(raw).hash == ARGV[1] then redis.call('DEL', KEYS[1]) end
      return 1
    `,
      [`otp:{${user}}`],
      [hash],
    );
  }
  async verifyAndCreateSession(
    user: string,
    hash: string,
    now: number,
    attempts: number,
    session: Session,
    seconds: number,
  ) {
    return (
      (await this.eval<number>(
        `
      local raw = redis.call('GET', KEYS[1])
      if not raw then return 0 end
      local otp = cjson.decode(raw)
      if otp.expiresAt <= tonumber(ARGV[2]) or otp.attempts >= tonumber(ARGV[3]) then
        redis.call('DEL', KEYS[1]); return 0
      end
      if otp.hash ~= ARGV[1] then
        otp.attempts = otp.attempts + 1
        if otp.attempts >= tonumber(ARGV[3]) then redis.call('DEL', KEYS[1])
        else redis.call('SET', KEYS[1], cjson.encode(otp), 'KEEPTTL') end
        return 0
      end
      redis.call('SET', KEYS[2], ARGV[4], 'EX', ARGV[5])
      redis.call('DEL', KEYS[1])
      return 1
    `,
        [`otp:{${user}}`, `session:{${user}}`],
        [hash, now, attempts, JSON.stringify(session), seconds],
      )) === 1
    );
  }
  async getSession(user: string) {
    const raw = await this.command<string | null>([
      "GET",
      this.key(`session:{${user}}`),
    ]);
    return raw ? (JSON.parse(raw) as Session) : null;
  }
  async touchSession(
    user: string,
    tokenHash: string,
    now: number,
    seconds: number,
  ) {
    return (
      (await this.eval<number>(
        `
      local raw = redis.call('GET', KEYS[1])
      if not raw then return 0 end
      local s = cjson.decode(raw)
      if s.tokenHash ~= ARGV[1] or s.expiresAt <= tonumber(ARGV[2]) then return 0 end
      s.lastActivity = tonumber(ARGV[2]); s.expiresAt = tonumber(ARGV[2]) + tonumber(ARGV[3]) * 1000
      redis.call('SET', KEYS[1], cjson.encode(s), 'EX', ARGV[3])
      return 1
    `,
        [`session:{${user}}`],
        [tokenHash, now, seconds],
      )) === 1
    );
  }
  async deleteSession(user: string, tokenHash: string) {
    await this.eval(
      `
      local raw = redis.call('GET', KEYS[1])
      if raw and cjson.decode(raw).tokenHash == ARGV[1] then redis.call('DEL', KEYS[1]) end
      return 1
    `,
      [`session:{${user}}`],
      [tokenHash],
    );
  }
  getCache(key: string) {
    return this.command<string | null>(["GET", this.key("cache:" + key)]);
  }
  async setCache(key: string, value: string, seconds: number) {
    await this.command(["SET", this.key("cache:" + key), value, "EX", seconds]);
  }
  async acquireLock(key: string, owner: string, seconds: number) {
    return (
      (await this.command([
        "SET",
        this.key("lock:" + key),
        owner,
        "NX",
        "EX",
        seconds,
      ])) === "OK"
    );
  }
  async releaseLock(key: string, owner: string) {
    await this.eval(
      `
      if redis.call('GET', KEYS[1]) == ARGV[1] then redis.call('DEL', KEYS[1]) end
      return 1
    `,
      ["lock:" + key],
      [owner],
    );
  }
}
