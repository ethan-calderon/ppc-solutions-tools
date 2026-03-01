"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { RightSidebar } from "@/components/layout/RightSidebar";

type AppUser = {
  id: string;
  email?: string | null;
};

type SubscriptionBadge = "Tester" | "Free" | "Silver" | "Gold";

function getBadgeStyles(badge: SubscriptionBadge) {
  // “emerald looking” for Tester, “bronze” for Free, “silver” for Silver, “gold” for Gold
  switch (badge) {
    case "Tester":
      return "border-emerald-300 bg-emerald-50 text-emerald-800";
    case "Free":
      // bronze-ish: warm amber/brown
      return "border-amber-300 bg-amber-50 text-amber-800";
    case "Silver":
      return "border-gray-300 bg-gray-50 text-gray-700";
    case "Gold":
      return "border-yellow-300 bg-yellow-50 text-yellow-800";
    default:
      return "border-gray-300 bg-gray-50 text-gray-700";
  }
}

/**
 * MVP tier logic (correct today):
 * - Tester if internal domain
 * - Otherwise Free
 *
 * Future (when we add entitlements/tools):
 * - Silver: 1–2 tools active
 * - Gold: all tools active
 */
function computeSubscriptionBadge(args: {
  isInternalTester: boolean;
  activeToolCount?: number; // future
  totalToolCount?: number; // future
}): SubscriptionBadge {
  if (args.isInternalTester) return "Tester";

  const active = args.activeToolCount ?? 0;
  const total = args.totalToolCount ?? 0;

  // Only apply Silver/Gold when we actually know counts (future)
  if (total > 0) {
    if (active >= total) return "Gold";
    if (active >= 1 && active <= 2) return "Silver";
    return "Free";
  }

  // Default today (no entitlements wired yet)
  return "Free";
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);

  const [workspaceName, setWorkspaceName] = useState<string>("Workspace");
  const [subscriptionBadge, setSubscriptionBadge] =
    useState<SubscriptionBadge>("Free");

  async function loadAppData() {
    // 1) Session
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

    // 2) Profile (email + internal tester flag)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, is_internal_tester")
      .eq("id", u.id)
      .maybeSingle();

    if (profileError) {
      console.error("Profile fetch error:", profileError.message);
    } else {
      // Prefer profile email if session email is missing
      u.email = u.email ?? profile?.email ?? null;

      const emailForDomainCheck = (u.email ?? profile?.email ?? "").toLowerCase();
const isInternalTester =
  Boolean(profile?.is_internal_tester) ||
  emailForDomainCheck.endsWith("@ogol.net") ||
  emailForDomainCheck.endsWith("@ppc-solutions.com");

      // Today: Tester vs Free
      // Future: compute Silver/Gold once entitlements/tools exist
      const badge = computeSubscriptionBadge({
        isInternalTester,
        // activeToolCount: ??? (future)
        // totalToolCount: ??? (future)
      });

      setSubscriptionBadge(badge);
    }

    setUser(u);

    // 3) Workspace name (owner’s first workspace)
    const { data: ws, error: wsError } = await supabase
      .from("workspaces")
      .select("name")
      .eq("owner_id", u.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (wsError) {
      console.error("Workspace fetch error:", wsError.message);
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
      // If a session appears (login), reload user/workspace/badge
      else loadAppData();
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

            <div className="flex items-center gap-3">
              {/* Badge always shows */}
              <span
                className={`text-[10px] px-2 py-0.5 border rounded-full ${getBadgeStyles(
                  subscriptionBadge
                )}`}
                title="Subscription tier"
              >
                {subscriptionBadge}
              </span>

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