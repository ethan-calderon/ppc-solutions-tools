"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/app` },
    });

    setLoading(false);
    setMessage(error ? error.message : "Check your email for the login link.");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-white text-black p-6">
      <div className="w-full max-w-md border rounded-lg p-6">
        <h1 className="text-xl font-semibold">Log in</h1>
        <p className="mt-2 text-sm">We’ll email you a magic link.</p>

        <form onSubmit={signInWithEmail} className="mt-6 space-y-3">
          <label className="block text-sm font-medium">Email</label>
          <input
            className="w-full border rounded-md px-3 py-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@domain.com"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-black text-white py-2"
          >
            {loading ? "Sending..." : "Send magic link"}
          </button>
        </form>

        {message ? <p className="mt-4 text-sm">{message}</p> : null}
      </div>
    </main>
  );
}