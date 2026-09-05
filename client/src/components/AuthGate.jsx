import { useState } from "react";

import supabase from "../infrastructure/supabase/client";

/**
 * AuthGate
 *
 * Establishes an authenticated Supabase session before the
 * Decision Journal workspace becomes available.
 *
 * Authentication answers:
 * "Who is making this request?"
 *
 * Authorization remains a separate concern and will be enforced
 * by database policies and application/domain rules.
 */
function AuthGate() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setIsSigningIn(true);
    setErrorMessage("");

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      setErrorMessage(error.message);
      setIsSigningIn(false);
      return;
    }

    setIsSigningIn(false);
  }

  return (
    <div className="auth-gate">
      <div className="auth-card">
        <div className="auth-record-type">
          Organizational Decision Intelligence
        </div>

        <h1>AI Decision Journal</h1>

        <p className="auth-description">
          Sign in to access organizational decision records.
        </p>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <label>
            <span>Email</span>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              autoComplete="email"
              required
            />
          </label>

          <label>
            <span>Password</span>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              autoComplete="current-password"
              required
            />
          </label>

          {errorMessage && (
            <p className="auth-error">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isSigningIn}
          >
            {isSigningIn
              ? "Signing in..."
              : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AuthGate;