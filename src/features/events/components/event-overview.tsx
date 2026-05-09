import type { EventDetail } from "@/shared/data/types";
import { SectionHeading } from "@/shared/ui/section-heading";
import { StatCard } from "@/shared/ui/stat-card";

export function EventOverview({ detail }: { detail: EventDetail }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="space-y-6">
        <section className="surface-card rounded-[30px] border border-line p-6">
          <SectionHeading
            eyebrow="赛事简介"
            title={detail.event.shortName}
            description={detail.story}
          />
        </section>

        <section className="surface-card rounded-[30px] border border-line p-6">
          <SectionHeading
            eyebrow="赛事规则"
            title="核心规则摘要"
            description="第一版先以摘要形式展示，后续可以扩展成完整规则文档页面。"
          />
          <ul className="mt-6 space-y-3 text-sm leading-7 text-[#6f675d]">
            {detail.rules.map((rule) => (
              <li key={rule} className="rounded-2xl bg-black/[0.02] px-4 py-3">
                {rule}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="space-y-6">
        <section className="surface-card rounded-[30px] border border-line p-6">
          <SectionHeading
            eyebrow="概览统计"
            title="当前赛事摘要"
            description="概览页保留少量高价值摘要，详细信息分别进入统计、赛程与排行子页。"
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {detail.stats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>
        </section>

        <section className="surface-card rounded-[30px] border border-line p-6">
          <SectionHeading
            eyebrow="赛程预览"
            title="最近节点"
            description="展示最近几个关键赛程节点，完整赛程在独立子页查看。"
          />
          <div className="mt-5 space-y-4">
            {detail.schedule.map((round) => (
              <div key={round.id} className="rounded-2xl border border-line bg-white/70 p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-semibold">{round.title}</p>
                  <span className="text-xs uppercase tracking-[0.16em] text-brand">
                    {round.stage}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[#6f675d]">{round.date}</p>
                <p className="mt-3 text-sm leading-7 text-[#6f675d]">{round.summary}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
