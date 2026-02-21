"use client";

import { FormEvent, useMemo, useState } from "react";
import { db } from "@/lib/instant";

export function AuthPanel() {
  const { isLoading, user, error } = db.useAuth();
  const [emailInput, setEmailInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [sentEmail, setSentEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const isCodeStep = useMemo(() => Boolean(sentEmail), [sentEmail]);

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
      setCodeInput("");
      setSentEmail("");
      setMessage("Signed in.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid code.";
      setMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignOut() {
    setIsSubmitting(true);
    setMessage("");
    try {
      await db.auth.signOut();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <div className="card auth-panel">Checking your session...</div>;
  }

  if (user) {
    return (
      <div className="card auth-panel">
        <div className="auth-row">
          <div>
            <p className="auth-label">Signed in</p>
            <p className="auth-value">{user.email || user.id}</p>
          </div>
          <button type="button" className="secondary-btn" onClick={handleSignOut} disabled={isSubmitting}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card auth-panel">
      <h2 className="panel-title">Account</h2>
      {!isCodeStep ? (
        <form className="auth-form" onSubmit={handleSendCode}>
          <label htmlFor="emailInput">Email</label>
          <input
            id="emailInput"
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="you@example.com"
            required
          />
          <button type="submit" className="add-block-btn" disabled={isSubmitting}>
            Send magic code
          </button>
        </form>
      ) : (
        <form className="auth-form" onSubmit={handleVerifyCode}>
          <label htmlFor="codeInput">6-digit code</label>
          <input
            id="codeInput"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            placeholder="Enter code"
            required
          />
          <button type="submit" className="add-block-btn" disabled={isSubmitting}>
            Verify code
          </button>
          <button type="button" className="secondary-btn" onClick={() => setSentEmail("")} disabled={isSubmitting}>
            Back
          </button>
        </form>
      )}
      {(message || error) && <p className="auth-message">{message || error?.message}</p>}
    </div>
  );
}
