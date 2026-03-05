"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.trim().length > 0;
  }, [email, password]);

  async function signInWithGoogle() {
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setLoading(false);
      setMessage(error.message);
    }
    // If no error, browser redirects to Google automatically.
  }

  async function signInWithPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);
    setMessage(error ? error.message : "Signed in. Redirecting…");

    if (!error) window.location.href = "/app";
  }

  async function signUpWithPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    // With email confirmations OFF, user gets a session immediately.
    // We'll route them to onboarding later; for now send to /app.
    setMessage("Account created. Redirecting…");
    window.location.href = "/app";
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-white text-black p-6">
      <div className="w-full max-w-md border rounded-lg p-6 bg-white">
        <h1 className="text-xl font-semibold">Log in</h1>
        <p className="mt-2 text-sm">
          Continue with Google, or use email + password.
        </p>

        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={loading}
          className="mt-5 w-full rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
        >
          Continue with Google
        </button>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px bg-black/10 flex-1" />
          <div className="text-xs text-black/60">OR</div>
          <div className="h-px bg-black/10 flex-1" />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setMessage(null);
            }}
            className={`px-3 py-2 rounded-md text-sm border ${
              mode === "signin" ? "bg-black text-white border-black" : "bg-white"
            }`}
          >
            Sign in
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setMessage(null);
            }}
            className={`px-3 py-2 rounded-md text-sm border ${
              mode === "signup" ? "bg-black text-white border-black" : "bg-white"
            }`}
          >
            Sign up
          </button>
        </div>

        <form
          onSubmit={mode === "signin" ? signInWithPassword : signUpWithPassword}
          className="mt-4 space-y-3"
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

          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !canSubmit}
            className={`w-full rounded-md py-2 ${
              loading || !canSubmit ? "bg-black/40" : "bg-black"
            } text-white`}
          >
            {loading
              ? "Please wait…"
              : mode === "signin"
              ? "Sign in"
              : "Create account"}
          </button>
        </form>

        {message ? <p className="mt-4 text-sm">{message}</p> : null}
      </div>
    </main>
  );
}