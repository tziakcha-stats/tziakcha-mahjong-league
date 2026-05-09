import type { EventStatus } from "@/shared/data/types";
import { cn } from "@/lib/utils";

const statusStyles: Record<EventStatus, string> = {
  报名中: "bg-emerald-100 text-emerald-700",
  进行中: "bg-amber-100 text-amber-700",
  已结束: "bg-zinc-200 text-zinc-700",
  即将开始: "bg-sky-100 text-sky-700",
};

export function StatusBadge({ status }: { status: EventStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-[0.16em]",
        statusStyles[status],
      )}
    >
      {status}
    </span>
  );
}
