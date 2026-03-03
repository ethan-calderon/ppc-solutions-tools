import { RequireToolAccess } from "@/components/auth/RequireToolAccess";

export default function DataPushPage() {
  return (
    <RequireToolAccess toolSlug="data-push">
      <div className="p-6">
        <h1 className="text-lg font-semibold mb-2">Data Push</h1>
        <p className="text-sm">Coming soon.</p>
      </div>
    </RequireToolAccess>
  );
}
