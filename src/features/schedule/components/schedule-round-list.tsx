import type { EventScheduleRound } from "@/shared/data/types";
import { SectionHeading } from "@/shared/ui/section-heading";

export function ScheduleRoundList({ rounds }: { rounds: EventScheduleRound[] }) {
  return (
    <section className="surface-card rounded-[30px] border border-line p-6">
      <SectionHeading
        eyebrow="赛程"
        title="轮次与关键节点"
        description="每个赛事页面都以独立路由承载完整赛程，后续可在此扩展筛选、轮次切换和赛制视图。"
      />

      <div className="mt-8 space-y-4">
        {rounds.length ? (
          rounds.map((round) => (
            <div key={round.id} className="grid gap-4 rounded-[24px] border border-line bg-white/75 p-5 md:grid-cols-[180px_1fr]">
              <div>
                <p className="display-font text-sm font-semibold uppercase tracking-[0.24em] text-brand">
                  {round.stage}
                </p>
                <p className="mt-2 text-sm text-muted">{round.date}</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold tracking-tight">{round.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted">{round.summary}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-2xl bg-black/[0.03] px-4 py-8 text-center text-sm text-muted">
            当前赛事尚未公布完整赛程。
          </p>
        )}
      </div>
    </section>
  );
}
