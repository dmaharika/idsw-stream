export class AccessError extends Error {
  constructor(
    public status: number,
    message: string,
    public retryAfter?: number,
  ) {
    super(message);
  }
}
export const INVALID_CODE =
  "The code is invalid or has expired. Please request a new code.";
export const SESSION_EXPIRED =
  "Your access session has expired. Please request a new access code.";
export const TEMPORARY_ERROR =
  "We're temporarily unable to verify access. Please try again shortly.";
