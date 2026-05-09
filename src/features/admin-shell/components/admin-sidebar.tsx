"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "后台首页" },
  { href: "/admin/events", label: "赛事管理" },
  { href: "/admin/schedule", label: "赛程管理" },
  { href: "/admin/matches", label: "对局管理" },
];

export function AdminSidebar() {
  const currentPath = usePathname();

  return (
    <aside className="admin-card rounded-[28px] border p-5">
      <div className="mb-8">
        <p className="display-font text-xs font-semibold uppercase tracking-[0.28em] text-brand">
          Admin Shell
        </p>
        <h2 className="mt-3 text-xl font-semibold text-admin-ink">赛事后台壳子</h2>
      </div>

      <nav className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block rounded-2xl px-4 py-3 text-sm transition-colors",
              currentPath === item.href
                ? "bg-admin-ink text-white"
                : "text-slate-600 hover:bg-slate-100",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
