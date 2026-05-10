import type { MatchRecord } from "@/shared/data/types";
import { getTeamColor } from "@/shared/data/team-colors";
import { SectionHeading } from "@/shared/ui/section-heading";

const placementLabels = ["一位", "二位", "三位", "四位"] as const;

export function MatchRecordsTable({ matches }: { matches: MatchRecord[] }) {
  return (
    <section className="surface-card rounded-[30px] border border-line p-6">
      <SectionHeading eyebrow="对局记录" title="近期完成对局" />

      <div className="mt-8 overflow-hidden rounded-[24px] border border-line">
        <table className="min-w-full divide-y divide-line text-left text-sm">
          <thead className="bg-black/[0.03] text-[#6f675d]">
            <tr>
              <th className="px-4 py-3 font-medium">轮次</th>
              <th className="px-4 py-3 font-medium">桌次</th>
              {placementLabels.map((label) => (
                <th key={label} className="px-4 py-3 font-medium">
                  {label}
                </th>
              ))}
              <th className="px-4 py-3 font-medium">完成时间</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-white/80">
            {matches.length ? (
              matches.map((match) => (
                <tr key={match.id}>
                  <td className="px-4 py-4 text-[#6f675d]">{match.roundLabel}</td>
                  <td className="px-4 py-4 font-semibold">{match.tableName}</td>
                  {match.placements.map((placement) => (
                    <td key={placement.placement} className="relative px-4 py-4 align-top">
                      <div
                        className="absolute inset-x-0 top-0 h-1.5"
                        style={{ backgroundColor: getTeamColor(placement.team) }}
                      />
                      <div className="font-semibold text-foreground">{placement.team}</div>
                      <div className="mt-1 text-xs text-[#6f675d]">{placement.player}</div>
                      <div className="mt-2 font-semibold text-brand">{placement.scoreLabel}</div>
                    </td>
                  ))}
                  <td className="px-4 py-4 text-[#6f675d]">{match.finishedAt}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[#6f675d]">
                  当前赛事尚未产生对局记录。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
