import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : "";

    if (!token) {
      return new NextResponse("Missing auth token", { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new NextResponse("Invalid session", { status: 401 });
    }

    const userId = userData.user.id;
    const body = await req.json();

    const {
      businessName,
      businessWebsite,
      businessPhone,
      businessAddress,
      invites,
      notificationOptIn,
    } = body as {
      businessName: string;
      businessWebsite: string;
      businessPhone: string;
      businessAddress: string;
      notificationOptIn: boolean;
      invites?: Array<{ email: string; role: "admin" | "member" }>;
    };

    // 1) Create workspace
    const { data: ws, error: wsErr } = await supabase
      .from("workspaces")
      .insert([{ name: businessName?.trim() || "Workspace" }])
      .select("id, name")
      .single();

    if (wsErr || !ws?.id) {
      return new NextResponse(`Workspace create failed: ${wsErr?.message}`, {
        status: 400,
      });
    }

    // 2) Create membership (admin)
    const { error: memErr } = await supabase.from("workspace_members").insert([
      {
        workspace_id: ws.id,
        user_id: userId,
        role: "admin",
      },
    ]);

    if (memErr) {
      return new NextResponse(`Membership create failed: ${memErr.message}`, {
        status: 400,
      });
    }

    // 3) Set active workspace + write business fields + mark onboarding complete
    const { error: profErr } = await supabase
      .from("profiles")
      .update({
        account_type: "business",
        business_name: businessName?.trim() || null,
        business_website: businessWebsite?.trim() || null,
        business_phone: businessPhone?.trim() || null,
        business_address: businessAddress?.trim() || null,
        notification_opt_in: Boolean(notificationOptIn),
        onboarding_complete: true,
        active_workspace_id: ws.id,
      })
      .eq("id", userId);

    if (profErr) {
      return new NextResponse(`Profile update failed: ${profErr.message}`, {
        status: 400,
      });
    }

    // 4) Create invites (records only; emailing later)
    if (Array.isArray(invites) && invites.length > 0) {
      const cleaned = invites
        .map((i) => ({
          workspace_id: ws.id,
          email: (i.email || "").trim().toLowerCase(),
          role: i.role === "admin" ? "admin" : "member",
        }))
        .filter((i) => i.email.includes("@"));

      if (cleaned.length > 0) {
        // Generate tokens in app (simple random token)
        const rows = cleaned.map((i) => ({
          ...i,
          token: crypto.randomUUID().replace(/-/g, ""),
          created_by: userId,
        }));

        const { error: invErr } = await supabase
          .from("workspace_invites")
          .insert(rows);

        if (invErr) {
          return new NextResponse(`Invites create failed: ${invErr.message}`, {
            status: 400,
          });
        }
      }
    }

    return NextResponse.json({ ok: true, workspaceId: ws.id });
  } catch (e: any) {
    return new NextResponse(e?.message ?? "Unknown error", { status: 500 });
  }
}