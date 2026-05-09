import type { LeagueEvent } from "@/shared/data/types";
import { formatDateRange } from "@/lib/utils";
import { StatusBadge } from "@/shared/ui/status-badge";

export function EventDetailHeader({ event }: { event: LeagueEvent }) {
  return (
    <section className="data-gradient overflow-hidden rounded-[36px] border border-white/8 px-6 py-8 text-white shadow-[0_28px_72px_rgba(17,24,39,0.22)] sm:px-10 sm:py-12">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-4">
            <p className="display-font text-sm font-semibold uppercase tracking-[0.32em] text-gold">
              {event.season}
            </p>
            <StatusBadge status={event.status} />
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              {event.name}
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-white/74 sm:text-base">
              {event.tagline}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <DetailPill label="时间" value={formatDateRange(event.startDate, event.endDate)} />
          <DetailPill label="地点" value={`${event.city} · ${event.venue}`} />
          <DetailPill label="参赛" value={`${event.players} 名选手`} />
          <DetailPill label="赛程" value={`${event.rounds} 轮`} />
        </div>
      </div>
    </section>
  );
}

function DetailPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/7 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-white/52">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white/92">{value}</p>
    </div>
  );
}
