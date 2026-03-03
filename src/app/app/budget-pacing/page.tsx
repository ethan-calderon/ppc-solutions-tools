import { RequireToolAccess } from "@/components/auth/RequireToolAccess";

export default function BudgetPacingPage() {
  return (
    <RequireToolAccess toolSlug="budget-pacing">
      <div className="p-6">
        <h1 className="text-lg font-semibold mb-2">Campaign Budget Pacing</h1>
        <p className="text-sm">Coming soon.</p>
      </div>
    </RequireToolAccess>
  );
}
