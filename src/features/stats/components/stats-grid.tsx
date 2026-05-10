import type { EventStatsSummary } from "@/shared/data/types";
import { SectionHeading } from "@/shared/ui/section-heading";
import { StatCard } from "@/shared/ui/stat-card";

export function StatsGrid({ stats }: { stats: EventStatsSummary[] }) {
  return (
    <section className="surface-card rounded-[30px] border border-line p-6">
      <SectionHeading eyebrow="统计" title="赛事关键指标" />

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="mt-6 rounded-[28px] border border-dashed border-line bg-black/[0.02] px-6 py-10 text-center text-sm text-[#6f675d]">
        图表模块占位区。后续接真实数据后，可扩展为分数走势、对局时长分布、选手表现对比等图表。
      </div>
    </section>
  );
}
