import type { EventScheduleRound } from "@/shared/data/types";
import { getTeamColor } from "@/shared/data/team-colors";
import { SectionHeading } from "@/shared/ui/section-heading";

export function ScheduleRoundList({ rounds }: { rounds: EventScheduleRound[] }) {
  const currentStage = rounds[0]?.stage ?? "赛事";

  return (
    <section className="surface-card rounded-[30px] border border-line p-6">
      <SectionHeading eyebrow="赛程" title={`${currentStage}实际对局日程`} />

      <div className="mt-8 space-y-4">
        {rounds.length ? (
          rounds.map((round) => (
            <div key={round.id} className="grid gap-4 rounded-[24px] border border-line bg-white/75 p-5 md:grid-cols-[180px_1fr]">
              <div>
                <p className="display-font text-sm font-semibold uppercase tracking-[0.24em] text-brand">
                  {round.stage}
                </p>
                <p className="mt-2 text-sm text-[#6f675d]">{round.date}</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold tracking-tight">{round.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#6f675d]">{round.summary}</p>
                {round.tables?.length ? (
                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    {round.tables.map((table) => (
                      <div key={table.id} className="rounded-2xl border border-line bg-white px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold">{table.tableName}</p>
                          {table.replayUrl ? (
                            <a
                              href={table.replayUrl}
                              className="text-xs font-medium text-blue-600 underline underline-offset-4"
                              target="_blank"
                              rel="noreferrer"
                            >
                              牌谱
                            </a>
                          ) : null}
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
                          {table.teams.map((team) => (
                            <div
                              key={team}
                              className="relative min-h-16 overflow-hidden rounded-xl border border-line bg-black/[0.02] px-3 pb-3 pt-4"
                            >
                              <div
                                className="absolute inset-x-0 top-0 h-1.5"
                                style={{ backgroundColor: getTeamColor(team) }}
                              />
                              <p className="break-words text-sm font-semibold leading-5 text-foreground">
                                {team}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-2xl bg-black/[0.03] px-4 py-8 text-center text-sm text-[#6f675d]">
            当前赛事尚未公布完整赛程。
          </p>
        )}
      </div>
    </section>
  );
}
