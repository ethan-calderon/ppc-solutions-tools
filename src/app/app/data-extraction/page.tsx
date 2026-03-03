import { RequireToolAccess } from "@/components/auth/RequireToolAccess";

export default function DataExtractionPage() {
  return (
    <RequireToolAccess toolSlug="data-extraction">
      <div className="p-6">
        <h1 className="text-lg font-semibold mb-2">Data Extraction</h1>
        <p className="text-sm">Coming soon.</p>
      </div>
    </RequireToolAccess>
  );
}
