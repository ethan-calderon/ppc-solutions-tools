"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { RightSidebar, type NavTool } from "@/components/layout/RightSidebar";
import { UserMenu } from "@/components/layout/UserMenu";

type AppUser = {
  id: string;
  email?: string | null;
};

type SubscriptionBadge = "Tester" | "Free" | "Silver" | "Gold";

function getBadgeStyles(badge: SubscriptionBadge) {
  switch (badge) {
    case "Tester":
      return "border-emerald-300 bg-emerald-50 text-emerald-800";
    case "Free":
      return "border-amber-300 bg-amber-50 text-amber-800";
    case "Silver":
      return "border-gray-300 bg-gray-50 text-gray-700";
    case "Gold":
      return "border-yellow-300 bg-yellow-50 text-yellow-800";
    default:
      return "border-gray-300 bg-gray-50 text-gray-700";
  }
}

function computeSubscriptionBadge(args: {
  isInternalTester: boolean;
  activePaidToolCount?: number; // future (entitlements)
  totalPaidToolCount?: number; // future (tools registry)
}): SubscriptionBadge {
  if (args.isInternalTester) return "Tester";

  const active = args.activePaidToolCount ?? 0;
  const total = args.totalPaidToolCount ?? 0;

  // Only meaningful once entitlements exist. Still safe to compute now.
  if (total > 0) {
    if (active >= total) return "Gold";
    if (active >= 1 && active <= 2) return "Silver";
  }

  return "Free";
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);

  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [workspaceName, setWorkspaceName] = useState<string>("Workspace");

  const [subscriptionBadge, setSubscriptionBadge] =
    useState<SubscriptionBadge>("Free");

  const [navTools, setNavTools] = useState<NavTool[]>([]);

  async function loadAppData() {
    setReady(false);

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
      u.email = u.email ?? profile?.email ?? null;
    }

    // Domain fallback (even if DB flag is wrong)
    const emailForDomainCheck = (u.email ?? profile?.email ?? "").toLowerCase();
    const isInternalTester =
      Boolean(profile?.is_internal_tester) ||
      emailForDomainCheck.endsWith("@ogol.net") ||
      emailForDomainCheck.endsWith("@ppc-solutions.com");

    setUser(u);

    // 3) Workspace via membership (correct for owners + seats)
    const { data: membership, error: memberError } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", u.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (memberError || !membership?.workspace_id) {
      console.error("Membership fetch error:", memberError?.message);
      setWorkspaceId("");
      setWorkspaceName("Workspace");
      setSubscriptionBadge(computeSubscriptionBadge({ isInternalTester }));
      setNavTools([]);
      setReady(true);
      return;
    }

    const wsId = membership.workspace_id;

    const { data: ws, error: wsError } = await supabase
      .from("workspaces")
      .select("id, name")
      .eq("id", wsId)
      .maybeSingle();

    if (wsError || !ws?.id) {
      console.error("Workspace fetch error:", wsError?.message);
      setWorkspaceId(wsId);
      setWorkspaceName("Workspace");
      setSubscriptionBadge(computeSubscriptionBadge({ isInternalTester }));
      setNavTools([]);
      setReady(true);
      return;
    }

    setWorkspaceId(ws.id);
    setWorkspaceName(ws.name || "Workspace");

    // 4) Tools registry
    const { data: tools, error: toolsError } = await supabase
      .from("tools")
      .select("id, slug, name, is_free, is_active, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (toolsError) {
      console.error("Tools fetch error:", toolsError.message);
      setSubscriptionBadge(computeSubscriptionBadge({ isInternalTester }));
      setNavTools([]);
      setReady(true);
      return;
    }

    const activeTools = tools ?? [];
    const freeTools = activeTools.filter((t) => t.is_free);
    const paidTools = activeTools.filter((t) => !t.is_free);

    // 5) Entitlements for paid tools (skip if tester)
    let entitledToolIds = new Set<string>();

    if (!isInternalTester && paidTools.length > 0) {
      const { data: ents, error: entsError } = await supabase
        .from("workspace_entitlements")
        .select("tool_id")
        .eq("workspace_id", wsId);

      if (entsError) {
        console.error("Entitlements fetch error:", entsError.message);
      } else {
        entitledToolIds = new Set((ents ?? []).map((e) => e.tool_id));
      }
    }

    // 6) Visible tools
    const visibleTools = isInternalTester
      ? activeTools
      : [...freeTools, ...paidTools.filter((t) => entitledToolIds.has(t.id))];

    setNavTools(
      visibleTools.map((t) => ({
        slug: t.slug,
        name: t.name,
      }))
    );

    // Badge now + future readiness
    const activePaidToolCount = isInternalTester
      ? paidTools.length
      : paidTools.filter((t) => entitledToolIds.has(t.id)).length;

    const totalPaidToolCount = paidTools.length;

    setSubscriptionBadge(
      computeSubscriptionBadge({
        isInternalTester,
        activePaidToolCount,
        totalPaidToolCount,
      })
    );

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
              {/* badge stays visible on the button + also available separately if you want later */}
              <span
                className={`text-[10px] px-2 py-0.5 border rounded-full ${getBadgeStyles(
                  subscriptionBadge
                )}`}
                title="Subscription tier"
              >
                {subscriptionBadge}
              </span>

              <UserMenu
                email={user?.email ?? ""}
                badge={subscriptionBadge}
              />
            </div>
          </header>

          <div>{children}</div>
        </div>

        <RightSidebar tools={navTools} />
      </div>
    </div>
  );
}