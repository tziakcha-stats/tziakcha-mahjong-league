import Link from "next/link";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "概览", href: "" },
  { label: "赛程", href: "/schedule" },
  { label: "对局", href: "/matches" },
  { label: "统计", href: "/stats" },
  { label: "排行", href: "/ranking" },
];

export function EventSubnav({
  slug,
  currentPath,
}: {
  slug: string;
  currentPath: string;
}) {
  return (
    <nav className="overflow-x-auto">
      <div className="flex min-w-max gap-3">
        {navItems.map((item) => {
          const href = `/events/${slug}${item.href}`;
          const isActive = currentPath === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-full border px-4 py-2 text-sm transition-colors",
                isActive
                  ? "border-brand bg-brand text-white"
                  : "border-line bg-white/70 text-[#6f675d] hover:bg-white",
              )}
              style={isActive ? { color: "#ffffff" } : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
