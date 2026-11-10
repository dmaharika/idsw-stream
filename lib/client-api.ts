export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  body?: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(path, {
    method: body === undefined ? "GET" : "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(25_000)])
      : AbortSignal.timeout(25_000),
  });
  const data = await response.json();
  if (!response.ok)
    throw new APIError(
      data.error || "Something went wrong. Please try again.",
      response.status,
    );
  return data as T;
}
export function errorMessage(error: unknown) {
  return error instanceof APIError
    ? error.message
    : "Unable to connect. Please check your connection and try again.";
}
