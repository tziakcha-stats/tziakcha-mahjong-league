import type { PlayerRankingEntry } from "@/shared/data/types";
import { FractionDisplay } from "@/shared/ui/fraction-display";
import { SectionHeading } from "@/shared/ui/section-heading";
import { TeamRankCell } from "./team-rank-cell";

const placementCountColumns = [
  { key: "first", label: "一位" },
  { key: "second", label: "二位" },
  { key: "third", label: "三位" },
  { key: "fourth", label: "四位" },
] as const;

export function RankingTable({ ranking }: { ranking: PlayerRankingEntry[] }) {
  return (
    <section className="surface-card rounded-[30px] border border-line p-6">
      <SectionHeading
        eyebrow="排行"
        title="当前积分榜"
        description="排行页面保持数据密度，但把字段限制在当前阶段最有价值的几个指标，保证可读性。"
      />

      <div className="mt-8 overflow-hidden rounded-[24px] border border-line">
        <table className="min-w-full divide-y divide-line text-left text-sm">
          <thead className="bg-brand text-white/85">
            <tr>
              <th className="px-4 py-3 font-medium">排名</th>
              <th className="px-4 py-3 font-medium">选手</th>
              <th className="px-4 py-3 font-medium">俱乐部</th>
              <th className="px-4 py-3 font-medium">比赛分</th>
              <th className="px-4 py-3 font-medium">标准分</th>
              <th className="px-4 py-3 font-medium">平均顺位</th>
              <th className="px-4 py-3 font-medium">出场数</th>
              {placementCountColumns.map((column) => (
                <th key={column.key} className="px-4 py-3 font-medium">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-white/80">
            {ranking.length ? (
              ranking.map((entry) => (
                <tr key={entry.name}>
                  <TeamRankCell rank={entry.rank} teamName={entry.club} />
                  <td className="px-4 py-4">{entry.name}</td>
                  <td className="px-4 py-4 text-[#6f675d]">{entry.club}</td>
                  <td className="px-4 py-4 text-brand">{entry.totalPoints}</td>
                  <td className="px-4 py-4 text-brand">
                    <PenaltyAwareFraction entry={entry} />
                  </td>
                  <td className="px-4 py-4 text-[#6f675d]">{entry.averagePlacement}</td>
                  <td className="px-4 py-4 text-[#6f675d]">{entry.bonus}</td>
                  {placementCountColumns.map((column) => (
                    <td key={column.key} className="px-4 py-4 text-[#6f675d]">
                      <FractionDisplay value={entry.placementCounts[column.key]} />
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-[#6f675d]">
                  当前赛事尚未产生排行榜数据。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PenaltyAwareFraction({ entry }: { entry: PlayerRankingEntry }) {
  const hasPenalty = entry.standardPointPenalty.numerator !== 0;

  return (
    <span className="inline-flex items-baseline gap-1">
      <FractionDisplay value={entry.standardPoints} />
      {hasPenalty ? (
        <span className="text-xs text-[#b4503b]">
          (-<FractionDisplay value={entry.standardPointPenalty} />)
        </span>
      ) : null}
    </span>
  );
}
