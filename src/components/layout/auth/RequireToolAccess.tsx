"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type ToolRow = {
  id: string;
  slug: string;
  is_free: boolean;
  is_active: boolean;
};

function slugFromPath(pathname: string) {
  // /app/campaign-builder -> campaign-builder
  const parts = pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("app");
  if (idx === -1) return null;
  const slug = parts[idx + 1];
  return slug ?? null;
}

function isTesterEmail(email?: string | null) {
  const e = (email ?? "").toLowerCase();
  return e.endsWith("@ogol.net") || e.endsWith("@ppc-solutions.com");
}

export function RequireToolAccess({
  children,
  toolSlug,
}: {
  children: React.ReactNode;
  toolSlug?: string; // optional override
}) {
  const router = useRouter();
  const pathname = usePathname();

  const resolvedSlug = useMemo(() => toolSlug ?? slugFromPath(pathname), [toolSlug, pathname]);

  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const run = async () => {
      setAllowed(null);

      // Must be logged in
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) {
        router.replace("/login");
        return;
      }

      const userId = session.user.id;
      const email = session.user.email ?? null;

      // Tester bypass (domain + DB flag)
      const { data: prof } = await supabase
        .from("profiles")
        .select("is_internal_tester, email")
        .eq("id", userId)
        .maybeSingle();

      const tester =
        Boolean(prof?.is_internal_tester) ||
        isTesterEmail(prof?.email ?? email);

      if (tester) {
        setAllowed(true);
        return;
      }

      // If we can't resolve a slug, allow (safe default for non-tool routes)
      if (!resolvedSlug) {
        setAllowed(true);
        return;
      }

      // Load tool definition
      const { data: tool, error: toolErr } = await supabase
        .from("tools")
        .select("id, slug, is_free, is_active")
        .eq("slug", resolvedSlug)
        .maybeSingle();

      if (toolErr || !tool?.id || !tool.is_active) {
        // Unknown tool or inactive: send to /app
        router.replace("/app");
        return;
      }

      // Free tool => allowed
      if (tool.is_free) {
        setAllowed(true);
        return;
      }

      // Paid tool => require entitlement for user's workspace
      const { data: membership } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      const wsId = membership?.workspace_id;
      if (!wsId) {
        router.replace("/app/tool-store");
        return;
      }

      const { data: ent } = await supabase
        .from("workspace_entitlements")
        .select("tool_id")
        .eq("workspace_id", wsId)
        .eq("tool_id", tool.id)
        .maybeSingle();

      if (!ent?.tool_id) {
        router.replace("/app/tool-store");
        return;
      }

      setAllowed(true);
    };

    run();
  }, [router, resolvedSlug]);

  if (allowed === null) {
    return (
      <div className="p-6 text-sm text-black">
        Checking access…
      </div>
    );
  }

  return <>{children}</>;
}