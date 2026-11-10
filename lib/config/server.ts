import "server-only";
import { createPrivateKey } from "node:crypto";

export function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing configuration: ${name}`);
  return value;
}

export function integer(
  name: string,
  fallback: number,
  min: number,
  max: number,
): number {
  const value = process.env[name] ? Number(process.env[name]) : fallback;
  if (!Number.isInteger(value) || value < min || value > max)
    throw new Error(`Invalid configuration: ${name}`);
  return value;
}

export function authConfig() {
  const secret = required("SESSION_SECRET");
  if (secret.length < 32)
    throw new Error("SESSION_SECRET must contain at least 32 characters");
  return {
    secret,
    otpSeconds: 300,
    cooldownSeconds: 60,
    sessionSeconds: 86_400,
    maxAttempts: integer("OTP_MAX_ATTEMPTS", 5, 3, 10),
    emailRequestsPerHour: integer("OTP_EMAIL_REQUESTS_PER_HOUR", 10, 1, 100),
    ipRequestsPerHour: integer("OTP_IP_REQUESTS_PER_HOUR", 600, 10, 10_000),
    ipVerificationsPerMinute: integer(
      "OTP_IP_VERIFICATIONS_PER_MINUTE",
      120,
      10,
      5_000,
    ),
  };
}

export function appOrigin() {
  const url = new URL(required("APP_URL"));
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:")
    throw new Error("APP_URL must use HTTPS");
  return url.origin;
}

export function pem(value: string) {
  const normalized = value.replace(/\\n/g, "\n").trim();
  if (normalized.includes("-----BEGIN")) return normalized;
  const decoded = Buffer.from(normalized.replace(/\s/g, ""), "base64");
  const asText = decoded.toString("utf8");
  if (asText.includes("-----BEGIN")) return asText.trim();
  // Google keys may be supplied as a base64 PKCS#8 body without PEM headers.
  return createPrivateKey({ key: decoded, format: "der", type: "pkcs8" })
    .export({ format: "pem", type: "pkcs8" })
    .toString();
}
