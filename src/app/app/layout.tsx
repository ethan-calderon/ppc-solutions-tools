import { RightSidebar } from "@/components/layout/RightSidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        <div className="flex-1">
          <header className="h-14 border-b bg-white flex items-center px-6">
            <div className="text-sm font-semibold">PPC Solutions • Tools</div>
          </header>
          <div>{children}</div>
        </div>
        <RightSidebar />
      </div>
    </div>
  );
}
