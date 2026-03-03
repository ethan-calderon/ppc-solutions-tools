"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [mode, setMode] = useState<"magic" | "password">("magic");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    const e = email.trim();
    if (!e) return false;
    if (mode === "magic") return true;
    return password.trim().length > 0;
  }, [email, password, mode]);

  async function signInMagic(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/app` },
    });

    setLoading(false);
    setMessage(error ? error.message : "Check your email for the login link.");
  }

  async function signInPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);
    setMessage(error ? error.message : "Signed in. Redirecting…");

    // Optional: the /app layout will also handle redirect via session,
    // but this makes it feel instant.
    if (!error) {
      window.location.href = "/app";
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-white text-black p-6">
      <div className="w-full max-w-md border rounded-lg p-6 bg-white">
        <h1 className="text-xl font-semibold">Log in</h1>
        <p className="mt-2 text-sm">
          Use a magic link, or sign in with a password (useful for testers).
        </p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setMode("magic");
              setMessage(null);
            }}
            className={`px-3 py-2 rounded-md text-sm border ${
              mode === "magic" ? "bg-black text-white border-black" : "bg-white"
            }`}
          >
            Magic link
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("password");
              setMessage(null);
            }}
            className={`px-3 py-2 rounded-md text-sm border ${
              mode === "password"
                ? "bg-black text-white border-black"
                : "bg-white"
            }`}
          >
            Password
          </button>
        </div>

        <form
          onSubmit={mode === "magic" ? signInMagic : signInPassword}
          className="mt-6 space-y-3"
        >
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              required
              autoComplete="email"
            />
          </div>

          {mode === "password" ? (
            <div>
              <label className="block text-sm font-medium">Password</label>
              <input
                className="w-full border rounded-md px-3 py-2"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading || !canSubmit}
            className={`w-full rounded-md py-2 ${
              loading || !canSubmit ? "bg-black/40" : "bg-black"
            } text-white`}
          >
            {loading
              ? "Please wait…"
              : mode === "magic"
              ? "Send magic link"
              : "Sign in"}
          </button>
        </form>

        {message ? <p className="mt-4 text-sm">{message}</p> : null}

        {mode === "password" ? (
          <p className="mt-4 text-xs text-black/70">
            Tip: For testers, add the user in Supabase Auth → Users, set a
            password, and mark the email as confirmed.
          </p>
        ) : null}
      </div>
    </main>
  );
}