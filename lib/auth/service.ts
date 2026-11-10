import "server-only";
import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from "node:crypto";
import type { StateStore } from "../store/types";
import type { authConfig } from "../config/server";
import { AccessError, INVALID_CODE, SESSION_EXPIRED } from "./errors";
import { normalizeEmail, validCode, validDay } from "./validation";

export type Member = { email: string; name: string };
export type Playback = {
  playbackId: string;
  tokens: { playback: string; thumbnail: string; storyboard: string };
  expiresAt: number;
};
type Dependencies = {
  store: StateStore;
  config: ReturnType<typeof authConfig>;
  lookup: (email: string) => Promise<Member | null>;
  sendCode: (member: Member, code: string, id: string) => Promise<void>;
  signPlayback: (day: 1 | 2) => Promise<Playback>;
  now?: () => number;
};

export class AuthService {
  private now: () => number;
  constructor(private deps: Dependencies) {
    this.now = deps.now ?? Date.now;
  }
  private digest(purpose: string, value: string) {
    return createHmac("sha256", this.deps.config.secret)
      .update(`${purpose}:${value}`)
      .digest("hex");
  }
  private email(value: unknown) {
    const email = normalizeEmail(value);
    if (!email) throw new AccessError(400, "Enter a valid email address.");
    return email;
  }
  private cookie(value: string | undefined) {
    if (!value || !/^[a-f0-9]{64}\.[a-f0-9]{64}$/.test(value)) return null;
    const [user, token] = value.split(".");
    return {
      user,
      tokenHash: createHash("sha256").update(token).digest("hex"),
    };
  }

  // Admission runs before the generic response. All addresses share these limits.
  async requestCode(
    value: unknown,
    ip: string,
  ): Promise<{ success: true; email: string; deliver: boolean }> {
    const email = this.email(value);
    const user = this.digest("email", email);
    const { store, config } = this.deps;
    if (
      !(await store.limit(
        "request-ip:" + this.digest("ip", ip),
        config.ipRequestsPerHour,
        3600,
      ))
    ) {
      throw new AccessError(
        429,
        "Too many requests. Please try again later.",
        3600,
      );
    }
    const withinEmailLimit = await store.limit(
      "request-email:" + user,
      config.emailRequestsPerHour,
      3600,
    );
    const cooldown = await store.limit(
      "cooldown:" + user,
      1,
      config.cooldownSeconds,
    );
    // Per-email limits stay private; revealing them would leak recent user activity.
    return { success: true, email, deliver: withinEmailLimit && cooldown };
  }

  // Runs with Next.js after(), so provider latency and errors cannot enumerate emails.
  async deliverCode(email: string) {
    const { lookup, store, config, sendCode } = this.deps;
    const member = await lookup(email);
    if (!member) return;
    const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
    const hash = this.digest("otp", `${email}:${code}`);
    const user = this.digest("email", email);
    await store.putOTP(
      user,
      { hash, expiresAt: this.now() + config.otpSeconds * 1000, attempts: 0 },
      config.otpSeconds,
    );
    try {
      await sendCode(member, code, randomBytes(16).toString("hex"));
    } catch {
      await store.deleteOTP(user, hash);
      throw new Error("Code delivery unavailable");
    }
  }

  async verifyCode(value: unknown, code: unknown, ip: string) {
    const email = this.email(value);
    const { store, config } = this.deps;
    if (
      !(await store.limit(
        "verify-ip:" + this.digest("ip", ip),
        config.ipVerificationsPerMinute,
        60,
      ))
    ) {
      throw new AccessError(
        429,
        "Too many attempts. Please wait a minute and try again.",
        60,
      );
    }
    if (!validCode(code)) throw new AccessError(400, INVALID_CODE);
    // Read the allowlist before consuming the code; temporary outages leave it usable.
    if (!(await this.deps.lookup(email)))
      throw new AccessError(400, INVALID_CODE);
    const user = this.digest("email", email);
    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const now = this.now();
    const success = await store.verifyAndCreateSession(
      user,
      this.digest("otp", `${email}:${code}`),
      now,
      config.maxAttempts,
      {
        tokenHash,
        email,
        createdAt: now,
        lastActivity: now,
        expiresAt: now + config.sessionSeconds * 1000,
      },
      config.sessionSeconds,
    );
    if (!success) throw new AccessError(400, INVALID_CODE);
    return `${user}.${token}`;
  }

  async session(cookie: string | undefined) {
    const parsed = this.cookie(cookie);
    if (!parsed) return null;
    const session = await this.deps.store.getSession(parsed.user);
    if (
      !session ||
      session.expiresAt <= this.now() ||
      parsed.user !== this.digest("email", session.email) ||
      !/^[a-f0-9]{64}$/.test(session.tokenHash)
    )
      return null;
    if (
      !timingSafeEqual(
        Buffer.from(session.tokenHash, "hex"),
        Buffer.from(parsed.tokenHash, "hex"),
      )
    )
      return null;
    return { ...session, user: parsed.user };
  }

  async playback(cookie: string | undefined, day: unknown) {
    if (!validDay(day)) throw new AccessError(400, "Select Day 1 or Day 2.");
    const session = await this.session(cookie);
    if (!session) throw new AccessError(401, SESSION_EXPIRED);
    if (!(await this.deps.store.limit("playback:" + session.user, 30, 60))) {
      throw new AccessError(
        429,
        "Please wait a moment before trying again.",
        60,
      );
    }
    if (!(await this.deps.lookup(session.email))) {
      await this.deps.store.deleteSession(session.user, session.tokenHash);
      throw new AccessError(
        403,
        "Access is no longer available. Please contact the event organizers.",
      );
    }
    const playback = await this.deps.signPlayback(day);
    // Recheck ownership atomically after external work. An old request cannot revive a replaced session.
    const refreshed = await this.deps.store.touchSession(
      session.user,
      session.tokenHash,
      this.now(),
      this.deps.config.sessionSeconds,
    );
    if (!refreshed) throw new AccessError(401, SESSION_EXPIRED);
    return playback;
  }

  async logout(cookie: string | undefined) {
    const parsed = this.cookie(cookie);
    if (parsed)
      await this.deps.store.deleteSession(parsed.user, parsed.tokenHash);
  }
}
