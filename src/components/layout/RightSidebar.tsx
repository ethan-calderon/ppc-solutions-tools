import Link from "next/link";

export type NavTool = {
  slug: string;
  name: string;
};

function toolPath(slug: string) {
  switch (slug) {
    case "campaign-builder":
      return "/app/campaign-builder";
    case "utm-builder":
      return "/app/utm-builder";
    default:
      return "/app";
  }
}

export function RightSidebar({ tools }: { tools: NavTool[] }) {
  return (
    <aside className="w-72 flex flex-col border-l bg-white text-black">
      <div className="p-4 border-b">
        <div className="text-sm font-semibold">PPC Tools</div>
        <div className="text-xs mt-1">Choose a tool</div>
      </div>

      <nav className="p-3 space-y-1">
        {tools.length === 0 ? (
          <div className="text-sm p-3 border rounded-md">
            No tools available.
          </div>
        ) : (
          tools.map((t) => (
            <Link
              key={t.slug}
              href={toolPath(t.slug)}
              className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-gray-100"
            >
              <span>{t.name}</span>
            </Link>
          ))
        )}
      </nav>

      <div className="mt-auto p-4 border-t text-xs">
        v0.0.1 • Dev build
      </div>
    </aside>
  );
}