"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  email: string;
  badge: string; // "Tester" | "Free" | ...
};

export function UserMenu({ email, badge }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm border rounded-md px-3 py-1 hover:bg-gray-50"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="text-xs">{badge}</span>
        <span className="text-xs text-black/70">{email}</span>
        <span className="text-xs text-black/50">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 border rounded-md bg-white shadow-md text-sm z-50">
          <button
            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            onClick={() => {
              setOpen(false);
              router.push("/app/settings");
            }}
          >
            Settings
          </button>

          <button
            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            onClick={() => {
              setOpen(false);
              router.push("/app/tool-store");
            }}
          >
            Tool Store
          </button>

          <button
            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            onClick={() => {
              setOpen(false);
              router.push("/app/subscriptions");
            }}
          >
            Subscriptions
          </button>

          <div className="border-t my-1" />

          <button
            className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
            onClick={async () => {
              setOpen(false);
              await supabase.auth.signOut();
              router.replace("/login");
            }}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}