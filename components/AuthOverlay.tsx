"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { api, errorMessage } from "@/lib/client-api";

export function LockIcon() {
  return (
    <svg
      width="22"
      height="24"
      viewBox="0 0 24 26"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="11"
        width="18"
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M7 11V7a5 5 0 0 1 10 0v4"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M12 16v3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export default function AuthOverlay({
  onAuthenticated,
  notice,
}: {
  onAuthenticated: () => void;
  notice: string;
}) {
  const [step, setStep] = useState<"locked" | "email" | "otp">("locked");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendAt, setResendAt] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const emailInput = useRef<HTMLInputElement>(null);
  const codeInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (step === "email") emailInput.current?.focus();
    if (step === "otp") codeInput.current?.focus();
  }, [step]);
  useEffect(() => {
    if (!resendAt) return;
    const tick = () =>
      setRemaining(Math.max(0, Math.ceil((resendAt - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [resendAt]);

  async function requestCode(event?: FormEvent) {
    event?.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      await api("/api/auth/request-code", { email });
      setEmail(email.trim().toLowerCase());
      setCode("");
      setResendAt(Date.now() + 60_000);
      setRemaining(60);
      setStep("otp");
      codeInput.current?.focus();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function verify(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      await api("/api/auth/verify-code", { email, code });
      onAuthenticated();
    } catch (error) {
      setError(errorMessage(error));
      setBusy(false);
    }
  }
  return (
    <section className="auth-overlay" aria-labelledby="access-title">
      <div className="auth-card">
        <span className="lock-icon">
          <LockIcon />
        </span>
        {step === "locked" ? (
          <>
            <p className="eyebrow">A seat saved for you</p>
            <h2 id="access-title">You’re in the right place.</h2>
            <p>
              Enter your event email to watch the talks,
              <br className="desktop-break" /> live or on your own time.
            </p>
            {notice && (
              <p className="form-error" role="status">
                {notice}
              </p>
            )}
            <button className="primary-button" onClick={() => setStep("email")}>
              Enter email <span aria-hidden="true">↗</span>
            </button>
            <span className="quiet-note">
              Private access for event attendees
            </span>
          </>
        ) : (
          <>
            <p className="eyebrow">Your event access</p>
            <h2 id="access-title">
              {step === "email" ? "Take your seat." : "Check your email."}
            </h2>
            {step === "email" ? (
              <>
                <p>Use the email you registered for the event.</p>
                <form onSubmit={requestCode} aria-busy={busy}>
                  <label htmlFor="email">Email address</label>
                  <input
                    ref={emailInput}
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    required
                    maxLength={254}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-describedby={error ? "auth-error" : undefined}
                    disabled={busy}
                    placeholder="you@example.com"
                  />
                  {error && (
                    <p className="form-error" id="auth-error" role="alert">
                      {error}
                    </p>
                  )}
                  <button className="primary-button" disabled={busy}>
                    {busy ? "Requesting code…" : "Send access code"}{" "}
                    <span aria-hidden="true">↗</span>
                  </button>
                </form>
                <button
                  className="text-button"
                  onClick={() => {
                    setStep("locked");
                    setError("");
                  }}
                  disabled={busy}
                >
                  Back to stream
                </button>
              </>
            ) : (
              <>
                <p>
                  If <strong className="email-address">{email}</strong> is
                  registered for the event, an access code has been sent.
                </p>
                <form onSubmit={verify} aria-busy={busy}>
                  <label htmlFor="code">6-digit access code</label>
                  <input
                    ref={codeInput}
                    className="code-input"
                    id="code"
                    name="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    required
                    minLength={6}
                    maxLength={6}
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    aria-describedby={
                      error ? "auth-error code-help" : "code-help"
                    }
                    disabled={busy}
                    placeholder="000000"
                  />
                  <p className="field-note" id="code-help">
                    Valid for 5 minutes. Use your newest code.
                  </p>
                  {error && (
                    <p className="form-error" id="auth-error" role="alert">
                      {error}
                    </p>
                  )}
                  <button
                    className="primary-button"
                    disabled={busy || code.length !== 6}
                  >
                    {busy ? "Please wait…" : "Unlock stream"}{" "}
                    <span aria-hidden="true">↗</span>
                  </button>
                </form>
                <div className="form-actions">
                  <button
                    className="text-button"
                    disabled={busy || remaining > 0}
                    onClick={() => requestCode()}
                  >
                    {remaining > 0
                      ? `Resend code in ${remaining}s`
                      : "Resend code"}
                  </button>
                  <button
                    className="text-button"
                    disabled={busy}
                    onClick={() => {
                      setStep("email");
                      setError("");
                      setCode("");
                    }}
                  >
                    Change email
                  </button>
                </div>
                <p className="quiet-note">
                  No code? Check spam, wait a minute, then try again.
                </p>
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}
