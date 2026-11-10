import type { OTP, Session, StateStore } from "../../lib/store/types";

// Test fixture only. Production always uses shared Redis; there is no memory fallback.
export class MemoryStore implements StateStore {
  otps = new Map<string, OTP>();
  sessions = new Map<string, Session>();
  values = new Map<string, { value: string; until: number }>();
  constructor(private now = Date.now) {}
  async limit(key: string, maximum: number, seconds: number) {
    const cacheKey = "limit:" + key;
    const count = Number((await this.getCache(cacheKey)) || 0) + 1;
    const previous = this.values.get(cacheKey);
    this.values.set(cacheKey, {
      value: String(count),
      until: count === 1 ? this.now() + seconds * 1000 : previous!.until,
    });
    return count <= maximum;
  }
  async putOTP(user: string, otp: OTP) {
    this.otps.set(user, { ...otp });
  }
  async deleteOTP(user: string, hash: string) {
    if (this.otps.get(user)?.hash === hash) this.otps.delete(user);
  }
  async verifyAndCreateSession(
    user: string,
    hash: string,
    now: number,
    attempts: number,
    session: Session,
  ) {
    const otp = this.otps.get(user);
    if (!otp) return false;
    if (otp.expiresAt <= now || otp.attempts >= attempts) {
      this.otps.delete(user);
      return false;
    }
    if (otp.hash !== hash) {
      otp.attempts++;
      if (otp.attempts >= attempts) this.otps.delete(user);
      return false;
    }
    this.otps.delete(user);
    this.sessions.set(user, { ...session });
    return true;
  }
  async getSession(user: string) {
    const session = this.sessions.get(user);
    return session ? { ...session } : null;
  }
  async touchSession(
    user: string,
    tokenHash: string,
    now: number,
    seconds: number,
  ) {
    const session = this.sessions.get(user);
    if (!session || session.tokenHash !== tokenHash || session.expiresAt <= now)
      return false;
    session.lastActivity = now;
    session.expiresAt = now + seconds * 1000;
    return true;
  }
  async deleteSession(user: string, tokenHash: string) {
    if (this.sessions.get(user)?.tokenHash === tokenHash)
      this.sessions.delete(user);
  }
  async getCache(key: string) {
    const cached = this.values.get(key);
    if (!cached || cached.until <= this.now()) return null;
    return cached.value;
  }
  async setCache(key: string, value: string, seconds: number) {
    this.values.set(key, { value, until: this.now() + seconds * 1000 });
  }
  async acquireLock(key: string, owner: string, seconds: number) {
    if (await this.getCache("lock:" + key)) return false;
    await this.setCache("lock:" + key, owner, seconds);
    return true;
  }
  async releaseLock(key: string, owner: string) {
    if ((await this.getCache("lock:" + key)) === owner)
      this.values.delete("lock:" + key);
  }
}
