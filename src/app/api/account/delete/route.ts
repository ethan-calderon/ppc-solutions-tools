import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getBearerToken(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth) return null;
  const [type, token] = auth.split(" ");
  if (type?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export async function POST(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !serviceRoleKey) {
    return new NextResponse("Missing server env vars", { status: 500 });
  }

  // We must identify which user is calling this endpoint.
  // We do that by requiring the user's access token in Authorization header.
  const accessToken = getBearerToken(req);
  if (!accessToken) {
    return new NextResponse("Missing Authorization Bearer token", {
      status: 401,
    });
  }

  // Create a Supabase client that can verify the calling user (with their token)
  const userClient = createClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    }
  );

  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const userId = userData.user.id;

  // Use admin (service role) client to delete the auth user
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { error: delErr } = await adminClient.auth.admin.deleteUser(userId);
  if (delErr) {
    return new NextResponse(delErr.message, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}