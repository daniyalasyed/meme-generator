"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { db } from "@/lib/instant";

export default function AuthPage() {
  const router = useRouter();
  const { user } = db.useAuth();
  const [emailInput, setEmailInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [sentEmail, setSentEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const isCodeStep = useMemo(() => Boolean(sentEmail), [sentEmail]);

  if (user) {
    router.replace("/");
    return null;
  }

  async function handleSendCode(e: FormEvent) {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setIsSubmitting(true);
    setMessage("");
    try {
      await db.auth.sendMagicCode({ email: emailInput.trim() });
      setSentEmail(emailInput.trim());
      setMessage("Code sent. Check your email.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send code.";
      setMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyCode(e: FormEvent) {
    e.preventDefault();
    if (!sentEmail || !codeInput.trim()) return;
    setIsSubmitting(true);
    setMessage("");
    try {
      await db.auth.signInWithMagicCode({
        email: sentEmail,
        code: codeInput.trim()
      });
      router.replace("/");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid code.";
      setMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleBack() {
    if (isCodeStep) {
      setSentEmail("");
      setCodeInput("");
      setMessage("");
    } else {
      router.back();
    }
  }

  return (
    <div className="auth-page">
      <button type="button" className="auth-back-btn" onClick={handleBack}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back
      </button>

      <div className="auth-card">
        <h1 className="auth-title">Welcome</h1>

        {!isCodeStep ? (
          <>
            <p className="auth-subtitle">
              Sign in with your email to create and vote on memes
            </p>
            <form className="auth-form" onSubmit={handleSendCode}>
              <input
                type="email"
                className="auth-input"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Enter your email"
                required
                autoFocus
              />
              <button
                type="submit"
                className="auth-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Magic Code"}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="auth-subtitle">
              Enter the 6-digit code sent to your email
            </p>
            <form className="auth-form" onSubmit={handleVerifyCode}>
              <input
                type="text"
                className="auth-input auth-code-input"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
                required
                autoFocus
              />
              <button
                type="submit"
                className="auth-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Verifying..." : "Verify Code"}
              </button>
              <button
                type="button"
                className="auth-secondary-btn"
                onClick={() => {
                  setSentEmail("");
                  setCodeInput("");
                  setMessage("");
                }}
                disabled={isSubmitting}
              >
                Use Different Email
              </button>
            </form>
            <p className="auth-hint">Check your email for a 6-digit code!</p>
          </>
        )}

        {message && <p className="auth-message">{message}</p>}
      </div>
    </div>
  );
}
