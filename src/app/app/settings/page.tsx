"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type ProfileRow = {
  id: string;
  email: string | null;
  is_internal_tester: boolean | null;
};

type WorkspaceRow = {
  id: string;
  name: string;
};

export default function SettingsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceRow | null>(null);

  // Future fields placeholder (not stored yet — we’ll add columns later)
  const [displayName, setDisplayName] = useState("");
  const [company, setCompany] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [showDelete, setShowDelete] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const canDelete = useMemo(() => deleteInput.trim() === "Delete", [deleteInput]);

  async function loadSettings() {
    setLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session) {
      router.replace("/login");
      return;
    }

    const userId = session.user.id;

    const { data: prof, error: profErr } = await supabase
      .from("profiles")
      .select("id, email, is_internal_tester")
      .eq("id", userId)
      .maybeSingle();

    if (profErr) console.error(profErr.message);
    setProfile((prof as ProfileRow) ?? null);

    // Workspace: fetch via membership (first workspace)
    const { data: membership, error: memErr } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (memErr) console.error(memErr.message);

    if (membership?.workspace_id) {
      const { data: ws, error: wsErr } = await supabase
        .from("workspaces")
        .select("id, name")
        .eq("id", membership.workspace_id)
        .maybeSingle();

      if (wsErr) console.error(wsErr.message);
      setWorkspace((ws as WorkspaceRow) ?? null);
    } else {
      setWorkspace(null);
    }

    setLoading(false);
  }

  async function deleteAccount() {
    if (!canDelete) return;

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;

    if (!session) {
      router.replace("/login");
      return;
    }

    const accessToken = session.access_token;

    const res = await fetch("/api/account/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      const msg = await res.text();
      alert(`Delete failed: ${msg}`);
      return;
    }

    // Sign out locally and go to login
    await supabase.auth.signOut();
    router.replace("/login");
  }

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-sm">Loading settings…</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-lg font-semibold mb-4">Settings</h1>

      <div className="border rounded-lg p-4 bg-white">
        <h2 className="text-sm font-semibold mb-3">Account</h2>

        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Email:</span>{" "}
            <span className="text-black/70">{profile?.email ?? "(unknown)"}</span>
          </div>
          <div>
            <span className="font-medium">Tier:</span>{" "}
            <span className="text-black/70">
              {profile?.is_internal_tester ? "Tester" : "Free"}
            </span>
          </div>
          <div>
            <span className="font-medium">Workspace:</span>{" "}
            <span className="text-black/70">{workspace?.name ?? "(none)"}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 border rounded-lg p-4 bg-white">
        <h2 className="text-sm font-semibold mb-3">Profile (coming next)</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <label className="block text-xs mb-1">User name</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="(not saved yet)"
            />
          </div>
          <div>
            <label className="block text-xs mb-1">Company</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="(not saved yet)"
            />
          </div>
          <div>
            <label className="block text-xs mb-1">Age</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="(not saved yet)"
            />
          </div>
          <div>
            <label className="block text-xs mb-1">Phone</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(not saved yet)"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs mb-1">Address</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder='(not saved yet)'
            />
          </div>
        </div>

        <p className="text-xs text-black/60 mt-3">
          We’ll wire these fields to the database after we finalize the app
          structure.
        </p>
      </div>

      <div className="mt-6 border rounded-lg p-4 bg-white">
        <h2 className="text-sm font-semibold mb-3 text-red-600">Danger zone</h2>

        {!showDelete ? (
          <button
            className="border rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            onClick={() => {
              setDeleteInput("");
              setShowDelete(true);
            }}
          >
            Delete profile
          </button>
        ) : (
          <div className="border rounded-md p-3">
            <p className="text-sm">
              Type <span className="font-semibold">Delete</span> to confirm.
            </p>
            <input
              className="mt-2 w-full border rounded-md px-3 py-2"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder='Type "Delete"'
            />

            <div className="mt-3 flex gap-2">
              <button
                className="border rounded-md px-3 py-2 text-sm hover:bg-gray-50"
                onClick={() => setShowDelete(false)}
              >
                Cancel
              </button>

              <button
                className={`rounded-md px-3 py-2 text-sm text-white ${
                  canDelete ? "bg-red-600" : "bg-red-300"
                }`}
                disabled={!canDelete}
                onClick={deleteAccount}
              >
                Permanently delete
              </button>
            </div>

            <p className="text-xs text-black/60 mt-3">
              This removes your auth user. Your related rows will cascade-delete
              where foreign keys apply.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}