import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseFromRequest(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
  if (!supabaseAnonKey) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY");

  // We rely on the caller sending an auth token:
  // Authorization: Bearer <access_token>
  const authHeader = req.headers.get("authorization") ?? "";

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseFromRequest(req);

    // Verify the user is authenticated (via Authorization header)
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new NextResponse("Not authenticated", { status: 401 });
    }

    const user = userData.user;

    // Parse body
    const body = await req.json().catch(() => null);
    if (!body) return new NextResponse("Invalid JSON body", { status: 400 });

    const businessName = String(body.businessName ?? "").trim();
    const website = String(body.website ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const address = String(body.address ?? "").trim();

    // Optional invites: [{ email, role }]
    const invites = Array.isArray(body.invites) ? body.invites : [];

    if (!businessName) {
      return new NextResponse("businessName is required", { status: 400 });
    }

    // 1) Create workspace (owner_id must be the authed user)
    const { data: workspace, error: wsError } = await supabase
      .from("workspaces")
      .insert({
        name: businessName,
        owner_id: user.id,
      })
      .select("id, name, owner_id, created_at")
      .single();

    if (wsError || !workspace?.id) {
      return new NextResponse(
        `Workspace create failed: ${wsError?.message ?? "Unknown error"}`,
        { status: 400 }
      );
    }

    // 2) Create membership row for owner as admin
    const { error: memError } = await supabase.from("workspace_members").insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: "admin",
    });

    if (memError) {
      return new NextResponse(
        `Workspace membership create failed: ${memError.message}`,
        { status: 400 }
      );
    }

    // 3) (Optional) Save business info if you have a table for it
    // If you don't have a "workspace_settings" or similar table yet, this is safe to skip.
    // If you DO have a table, uncomment and adjust columns/table name.

    /*
    const { error: infoErr } = await supabase.from("workspace_settings").insert({
      workspace_id: workspace.id,
      website,
      phone,
      address,
    });
    if (infoErr) {
      return new NextResponse(`Business info save failed: ${infoErr.message}`, { status: 400 });
    }
    */

    // 4) (Optional) Create invite rows (does NOT email yet — that comes later)
    // Only run this if you already have a workspace_invites table.
    // If you don't have it, leave it disabled.
    //
    // Expected shape:
    // workspace_invites: { id, workspace_id, email, role, invited_by, created_at, accepted_at }
    //
    // If you already created it, uncomment this block.

    /*
    const normalizedInvites = invites
      .map((i: any) => ({
        email: String(i?.email ?? "").trim().toLowerCase(),
        role: i?.role === "admin" ? "admin" : "member",
      }))
      .filter((i: any) => i.email);

    if (normalizedInvites.length > 0) {
      const { error: invErr } = await supabase.from("workspace_invites").insert(
        normalizedInvites.map((i: any) => ({
          workspace_id: workspace.id,
          email: i.email,
          role: i.role,
          invited_by: user.id,
        }))
      );

      if (invErr) {
        return new NextResponse(`Invites create failed: ${invErr.message}`, { status: 400 });
      }
    }
    */

    return NextResponse.json({
      ok: true,
      workspace,
      saved: {
        businessName,
        website,
        phone,
        address,
      },
    });
  } catch (e: any) {
    return new NextResponse(e?.message ?? "Server error", { status: 500 });
  }
}