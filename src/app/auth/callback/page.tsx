"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      // Supabase magic link hits this page with ?code=...
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error("Auth callback error:", error.message);
          router.replace("/login");
          return;
        }
      }

      // If already logged in, or exchange succeeded, send to app
      router.replace("/app");
    };

    run();
  }, [router]);

  return (
    <div className="p-6 text-sm">
      Signing you in…
    </div>
  );
}