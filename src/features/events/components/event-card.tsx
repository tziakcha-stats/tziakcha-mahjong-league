import Link from "next/link";
import type { LeagueEvent } from "@/shared/data/types";
import { formatDateRange } from "@/lib/utils";
import { StatusBadge } from "@/shared/ui/status-badge";

export function EventCard({ event }: { event: LeagueEvent }) {
  return (
    <article className="surface-card flex h-full flex-col rounded-[28px] border border-line p-6 transition-transform duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="display-font text-xs uppercase tracking-[0.28em] text-brand">
            {event.season}
          </p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight">
            {event.name}
          </h3>
        </div>
        <StatusBadge status={event.status} />
      </div>

      <p className="mt-4 flex-1 text-sm leading-7 text-[#6f675d]">{event.tagline}</p>

      <dl className="mt-5 space-y-2 text-sm text-[#6f675d]">
        <div className="flex items-center justify-between gap-4">
          <dt>时间</dt>
          <dd>{formatDateRange(event.startDate, event.endDate)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt>地点</dt>
          <dd>{event.city}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt>规模</dt>
          <dd>{event.players} 名选手</dd>
        </div>
      </dl>

      <div className="mt-6 flex items-center justify-between border-t border-line pt-5">
        <span className="text-sm text-[#6f675d]">{event.venue}</span>
        <Link
          href={`/events/${event.slug}`}
          className="rounded-full bg-[#16120f] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand"
          style={{ color: "#ffffff" }}
        >
          查看赛事
        </Link>
      </div>
    </article>
  );
}
