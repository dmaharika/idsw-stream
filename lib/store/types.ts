export type OTP = { hash: string; expiresAt: number; attempts: number };
export type Session = {
  tokenHash: string;
  email: string;
  createdAt: number;
  lastActivity: number;
  expiresAt: number;
};

// Implementations MUST make rate limits, OTP consumption/session replacement,
// conditional refresh, and conditional deletion atomic across all app instances.
export interface StateStore {
  limit(key: string, maximum: number, seconds: number): Promise<boolean>;
  putOTP(user: string, otp: OTP, seconds: number): Promise<void>;
  deleteOTP(user: string, hash: string): Promise<void>;
  verifyAndCreateSession(
    user: string,
    hash: string,
    now: number,
    attempts: number,
    session: Session,
    seconds: number,
  ): Promise<boolean>;
  getSession(user: string): Promise<Session | null>;
  touchSession(
    user: string,
    tokenHash: string,
    now: number,
    seconds: number,
  ): Promise<boolean>;
  deleteSession(user: string, tokenHash: string): Promise<void>;
  getCache(key: string): Promise<string | null>;
  setCache(key: string, value: string, seconds: number): Promise<void>;
  acquireLock(key: string, owner: string, seconds: number): Promise<boolean>;
  releaseLock(key: string, owner: string): Promise<void>;
}
