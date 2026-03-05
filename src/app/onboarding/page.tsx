"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type AccountType = "single" | "business";

export default function OnboardingPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [accountType, setAccountType] = useState<AccountType | "">("");

  // Single fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  // Business fields
  const [businessName, setBusinessName] = useState("");
  const [businessWebsite, setBusinessWebsite] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");

  // Confirmation
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [notificationOptIn, setNotificationOptIn] = useState(true);

  const canContinue = useMemo(() => {
    if (!accountType) return false;
    if (!acceptTerms) return false;

    if (accountType === "single") {
      return (
        firstName.trim().length > 0 &&
        lastName.trim().length > 0 &&
        phone.trim().length > 0
      );
    }

    // business
    return (
      businessName.trim().length > 0 &&
      businessWebsite.trim().length > 0 &&
      businessPhone.trim().length > 0 &&
      businessAddress.trim().length > 0
    );
  }, [
    accountType,
    acceptTerms,
    firstName,
    lastName,
    phone,
    businessName,
    businessWebsite,
    businessPhone,
    businessAddress,
  ]);

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select(
          "onboarding_complete, account_type, first_name, last_name, phone, business_name, business_website, business_phone, business_address, notification_opt_in"
        )
        .eq("id", session.user.id)
        .maybeSingle();

      if (profile?.onboarding_complete) {
        router.replace("/app");
        return;
      }

      // Prefill if user partially filled before
      if (profile?.account_type) setAccountType(profile.account_type as AccountType);
      if (profile?.first_name) setFirstName(profile.first_name);
      if (profile?.last_name) setLastName(profile.last_name);
      if (profile?.phone) setPhone(profile.phone);
      if (profile?.business_name) setBusinessName(profile.business_name);
      if (profile?.business_website) setBusinessWebsite(profile.business_website);
      if (profile?.business_phone) setBusinessPhone(profile.business_phone);
      if (profile?.business_address) setBusinessAddress(profile.business_address);
      if (typeof profile?.notification_opt_in === "boolean")
        setNotificationOptIn(profile.notification_opt_in);

      setLoading(false);
    };

    run();
  }, [router]);

  async function submit() {
    if (!canContinue) return;

    setSaving(true);

    const { data } = await supabase.auth.getSession();
    const session = data.session;

    if (!session) {
      router.replace("/login");
      return;
    }

    const userId = session.user.id;

    const baseUpdate: any = {
      account_type: accountType,
      notification_opt_in: notificationOptIn,
      accepted_terms_at: new Date().toISOString(),
      onboarding_complete: true, // In 2.5 we'll gate this until workspace is created for business
    };

    if (accountType === "single") {
      baseUpdate.first_name = firstName.trim();
      baseUpdate.last_name = lastName.trim();
      baseUpdate.phone = phone.trim();

      baseUpdate.business_name = null;
      baseUpdate.business_website = null;
      baseUpdate.business_phone = null;
      baseUpdate.business_address = null;
    } else {
      baseUpdate.business_name = businessName.trim();
      baseUpdate.business_website = businessWebsite.trim();
      baseUpdate.business_phone = businessPhone.trim();
      baseUpdate.business_address = businessAddress.trim();

      baseUpdate.first_name = null;
      baseUpdate.last_name = null;
      baseUpdate.phone = null;
    }

    const { error } = await supabase.from("profiles").update(baseUpdate).eq("id", userId);

    setSaving(false);

    if (error) {
      alert(`Save failed: ${error.message}`);
      return;
    }

    // Next step: we'll add 2FA + business workspace setup
    router.replace("/app");
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white text-black p-6">
        <div className="text-sm">Loading onboarding…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-black p-6">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="text-xl font-semibold">Account setup</h1>
        <p className="mt-2 text-sm text-black/70">
          Choose how you’ll use PPC Solutions Tools.
        </p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setAccountType("single")}
            className={`border rounded-lg p-4 text-left ${
              accountType === "single" ? "border-black" : "border-black/20"
            }`}
          >
            <div className="font-medium">Single account</div>
            <div className="text-sm text-black/70 mt-1">
              One person using tools (no seats).
            </div>
          </button>

          <button
            type="button"
            onClick={() => setAccountType("business")}
            className={`border rounded-lg p-4 text-left ${
              accountType === "business" ? "border-black" : "border-black/20"
            }`}
          >
            <div className="font-medium">Business account</div>
            <div className="text-sm text-black/70 mt-1">
              Workspace with seats, roles, and shared subscriptions.
            </div>
          </button>
        </div>

        {accountType === "single" ? (
          <div className="mt-6 border rounded-lg p-4">
            <h2 className="text-sm font-semibold mb-3">Your info</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <label className="block text-xs mb-1">First name</label>
                <input
                  className="w-full border rounded-md px-3 py-2"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs mb-1">Last name</label>
                <input
                  className="w-full border rounded-md px-3 py-2"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs mb-1">Phone</label>
                <input
                  className="w-full border rounded-md px-3 py-2"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(for account security and support)"
                />
              </div>
            </div>
          </div>
        ) : null}

        {accountType === "business" ? (
          <div className="mt-6 border rounded-lg p-4">
            <h2 className="text-sm font-semibold mb-3">Business info</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="sm:col-span-2">
                <label className="block text-xs mb-1">Business name</label>
                <input
                  className="w-full border rounded-md px-3 py-2"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs mb-1">Business website</label>
                <input
                  className="w-full border rounded-md px-3 py-2"
                  value={businessWebsite}
                  onChange={(e) => setBusinessWebsite(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-xs mb-1">Business phone</label>
                <input
                  className="w-full border rounded-md px-3 py-2"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs mb-1">Business address</label>
                <input
                  className="w-full border rounded-md px-3 py-2"
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                />
              </div>

              <p className="sm:col-span-2 text-xs text-black/60 mt-1">
                Seats + invitations + roles will be configured next.
              </p>
            </div>
          </div>
        ) : null}

        <div className="mt-6 border rounded-lg p-4">
          <h2 className="text-sm font-semibold mb-3">Confirmation</h2>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
            />
            <span>
              I agree to the Terms and Conditions.
              <span className="text-black/60"> (we’ll add the link next)</span>
            </span>
          </label>

          <label className="mt-3 flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={notificationOptIn}
              onChange={(e) => setNotificationOptIn(e.target.checked)}
            />
            <span>
              I want to receive notification emails (no marketing).
            </span>
          </label>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={submit}
            disabled={!canContinue || saving}
            className={`rounded-md px-4 py-2 text-sm text-white ${
              !canContinue || saving ? "bg-black/40" : "bg-black"
            }`}
          >
            {saving ? "Saving…" : "Continue"}
          </button>
        </div>
      </div>
    </main>
  );
}