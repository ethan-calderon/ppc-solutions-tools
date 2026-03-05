"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        router.replace("/login");
        return;
      }

      // If already onboarded, send to app
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profile?.onboarding_complete) {
        router.replace("/app");
        return;
      }

      setLoading(false);
    };

    run();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white text-black p-6">
        <div className="text-sm">Loading onboarding…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-white text-black p-6">
      <div className="w-full max-w-xl border rounded-lg p-6 bg-white">
        <h1 className="text-xl font-semibold">Account setup</h1>
        <p className="mt-2 text-sm">
          Next we’ll ask: Single vs Business, then collect info, invites, and 2FA.
        </p>

        <div className="mt-5 text-sm">
          Placeholder page is live — next step is building the wizard UI.
        </div>
      </div>
    </main>
  );
}
