"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
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

      router.replace("/app");
    };

    run();
  }, [router]);

  return <div className="p-6 text-sm text-black">Signing you in…</div>;
}