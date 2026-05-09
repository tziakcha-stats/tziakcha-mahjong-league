import type { TeamInfo } from "@/shared/data/types";
import { SectionHeading } from "@/shared/ui/section-heading";

export function TeamInfoGrid({ teams }: { teams: TeamInfo[] }) {
  return (
    <section className="surface-card rounded-[30px] border border-line p-6">
      <SectionHeading
        eyebrow="队伍信息"
        title="参赛队伍一览"
        description="这里集中展示当前赛事的参赛队伍、队长、成员构成和战绩摘要。后续可以继续扩展成队伍详情页或单独队伍空间。"
      />

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {teams.length ? (
          teams.map((team) => (
            <article
              key={team.id}
              className="rounded-[26px] border border-line bg-white/75 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold tracking-tight text-[#16120f]">
                    {team.name}
                  </h3>
                  <p className="mt-2 text-sm text-[#6f675d]">{team.school}</p>
                </div>
                <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-brand">
                  {team.record}
                </span>
              </div>

              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex gap-3">
                  <dt className="min-w-16 text-[#6f675d]">队长</dt>
                  <dd className="text-[#16120f]">{team.captain}</dd>
                </div>
                <div className="flex gap-3">
                  <dt className="min-w-16 text-[#6f675d]">成员</dt>
                  <dd className="text-[#16120f]">{team.members.join(" / ")}</dd>
                </div>
              </dl>

              <p className="mt-5 rounded-2xl bg-black/[0.03] px-4 py-3 text-sm leading-7 text-[#6f675d]">
                {team.note}
              </p>
            </article>
          ))
        ) : (
          <p className="rounded-2xl bg-black/[0.03] px-4 py-10 text-center text-sm text-[#6f675d]">
            当前赛事尚未录入队伍信息。
          </p>
        )}
      </div>
    </section>
  );
}
