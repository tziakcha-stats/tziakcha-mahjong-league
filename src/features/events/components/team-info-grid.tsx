import type { TeamInfo, TeamRankingEntry } from "@/shared/data/types";
import { getTeamColor } from "@/shared/data/team-colors";
import { FractionDisplay } from "@/shared/ui/fraction-display";
import { SectionHeading } from "@/shared/ui/section-heading";

export function TeamInfoGrid({
  teams,
  teamRanking,
}: {
  teams: TeamInfo[];
  teamRanking: TeamRankingEntry[];
}) {
  const rankingByTeamName = new Map(teamRanking.map((team) => [team.name, team]));

  return (
    <section className="surface-card rounded-[30px] border border-line p-6">
      <SectionHeading eyebrow="组队" title="参赛队伍一览" />

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {teams.length ? (
          teams.map((team) => {
            const ranking = rankingByTeamName.get(team.name);

            return (
              <article
                key={team.id}
                className="rounded-[26px] border border-line bg-white/75 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span
                        className="size-4 shrink-0 rounded-[4px] border border-black/10"
                        style={{ backgroundColor: getTeamColor(team.name) }}
                      />
                      <h3 className="text-2xl font-semibold tracking-tight text-[#16120f]">
                        {team.name}
                      </h3>
                    </div>
                    <p className="mt-2 text-sm text-[#6f675d]">{team.school}</p>
                  </div>
                  <TeamRankingBadge ranking={ranking} />
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
              </article>
            );
          })
        ) : (
          <p className="rounded-2xl bg-black/[0.03] px-4 py-10 text-center text-sm text-[#6f675d]">
            当前赛事尚未录入队伍信息。
          </p>
        )}
      </div>
    </section>
  );
}

function TeamRankingBadge({ ranking }: { ranking?: TeamRankingEntry }) {
  if (!ranking) {
    return (
      <div className="shrink-0 rounded-2xl bg-black/[0.03] px-4 py-3 text-right">
        <p className="text-xs font-semibold tracking-[0.16em] text-[#6f675d]">暂无排名</p>
      </div>
    );
  }

  return (
    <div className="shrink-0 rounded-full bg-brand/10 px-3 py-1 text-sm font-semibold tabular-nums text-brand">
      <span>暂 #{ranking.rank}</span>{" "}
      <span>标分</span>{" "}
      <FractionDisplay value={ranking.standardPoints} />
    </div>
  );
}
