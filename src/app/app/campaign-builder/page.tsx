import { RequireToolAccess } from "@/components/auth/RequireToolAccess";

export default function CampaignBuilderPage() {
  return (
    <RequireToolAccess toolSlug="campaign-builder">
      <div className="p-6">
        <h1 className="text-lg font-semibold mb-4">Campaign Builder</h1>
        <p>Coming soon.</p>
      </div>
    </RequireToolAccess>
  );
}