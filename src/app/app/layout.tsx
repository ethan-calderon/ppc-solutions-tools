"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { RightSidebar } from "@/components/layout/RightSidebar";

type AppUser = {
  id: string;
  email?: string | null;
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string>("");

  async function loadAppData() {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) {
      console.error(sessionError);
      router.replace("/login");
      return;
    }

    const session = sessionData.session;
    if (!session) {
      router.replace("/login");
      return;
    }

    const u: AppUser = {
  id: session.user.id,
  email: session.user.email ?? null,
};

// If email isn't present on the session, fetch it from profiles
if (!u.email) {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", u.id)
    .maybeSingle();

  if (profileError) {
    console.error("Profile fetch error:", profileError.message);
  } else {
    u.email = profile?.email ?? null;
  }
}

setUser(u);

    // Fetch the user's default workspace (MVP: owner’s first workspace)
    const { data: ws, error: wsError } = await supabase
      .from("workspaces")
      .select("name")
      .eq("owner_id", u.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (wsError) {
      console.error("Workspace fetch error:", wsError.message);
      // We’ll still let them into the app; just show fallback label.
      setWorkspaceName("Workspace");
    } else {
      setWorkspaceName(ws?.name || "Workspace");
    }

    setReady(true);
  }

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!mounted) return;
      await loadAppData();
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/login");
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
            <div className="flex items-center gap-3">
              <div className="text-sm font-semibold">PPC Solutions • Tools</div>
              <span className="text-xs text-black/70">•</span>
              <div className="text-sm">{workspaceName}</div>
            </div>

            <div className="flex items-center gap-4">
              {user?.email ? (
                <div className="text-xs text-black/70">{user.email}</div>
              ) : null}

              <button
                className="text-sm underline"
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.replace("/login");
                }}
              >
                Log out
              </button>
            </div>
          </header>

          <div>{children}</div>
        </div>

        <RightSidebar />
      </div>
    </div>
  );
}