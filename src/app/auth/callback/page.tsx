"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  useEffect(() => {
    const run = async () => {
      // Supabase OAuth returns a "code" in the URL. Exchange it for a session.
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (code) {
        await supabase.auth.exchangeCodeForSession(window.location.href);
      }

      // After session is established, send user into the app.
      window.location.replace("/app");
    };

    run();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-white text-black p-6">
      <div className="text-sm">Signing you in…</div>
    </main>
  );
}