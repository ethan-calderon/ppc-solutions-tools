import Link from "next/link";

const navItems = [
  { href: "/app/campaign-builder", label: "Campaign Builder", badge: "MVP" },
  { href: "/app/utm-builder", label: "UTM Builder" },
  { href: "/app/settings", label: "Settings" },
];

export function RightSidebar() {
  return (
    <aside className="hidden lg:flex lg:w-72 lg:flex-col border-l bg-white text-black">
      <div className="p-4 border-b">
        <div className="text-sm font-semibold">PPC Tools</div>
        <div className="text-xs mt-1">Choose a tool</div>
      </div>

      <nav className="p-3 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-gray-100"
          >
            <span>{item.label}</span>
            {item.badge ? (
              <span className="text-[10px] rounded-full bg-black text-white px-2 py-0.5">
                {item.badge}
              </span>
            ) : null}
          </Link>
        ))}
      </nav>

      <div className="mt-auto p-4 border-t text-xs">
        v0.0.1 • Local dev
      </div>
    </aside>
  );
}