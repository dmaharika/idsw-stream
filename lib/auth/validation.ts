export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return null;
  return email;
}

export function validCode(value: unknown): value is string {
  return typeof value === "string" && /^\d{6}$/.test(value);
}

export function validDay(value: unknown): value is 1 | 2 {
  return value === 1 || value === 2;
}
