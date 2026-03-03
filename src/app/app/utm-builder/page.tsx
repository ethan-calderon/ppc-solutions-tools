import { RequireToolAccess } from "@/components/auth/RequireToolAccess";

export default function UTMBuilderPage() {
  return (
    <RequireToolAccess toolSlug="utm-builder">
      <div className="p-6">
        <h1 className="text-lg font-semibold mb-4">UTM Builder</h1>
        <p>Coming soon.</p>
      </div>
    </RequireToolAccess>
  );
}