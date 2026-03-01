"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { RightSidebar } from "@/components/layout/RightSidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (!data.session) router.replace("/login");
      else setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/login");
      else setReady(true);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-black">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      <div className="flex min-h-screen">
        <div className="flex-1">
          <header className="h-14 border-b bg-white flex items-center justify-between px-6">
            <div className="text-sm font-semibold">PPC Solutions • Tools</div>
            <button
              className="text-sm underline"
              onClick={async () => {
                await supabase.auth.signOut();
                router.replace("/login");
              }}
            >
              Log out
            </button>
          </header>
          <div>{children}</div>
        </div>
        <RightSidebar />
      </div>
    </div>
  );
}