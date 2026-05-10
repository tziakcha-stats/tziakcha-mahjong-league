"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { label: "总览", href: "" },
  { label: "和牌率", href: "/hule" },
  { label: "自摸率", href: "/zimo" },
  { label: "放铳率", href: "/fangchong" },
];

export function RankingSubnav({ slug }: { slug: string }) {
  const pathname = usePathname();

  return (
    <nav className="overflow-x-auto">
      <div className="flex min-w-max gap-3">
        {items.map((item) => {
          const href = `/events/${slug}/ranking${item.href}`;
          const isActive = pathname === href;
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
