import type { RateLeaderboardEntry } from "@/shared/data/types";
import { SectionHeading } from "@/shared/ui/section-heading";

export function RateRankingTable({
  title,
  description,
  rows,
  valueLabel,
}: {
  title: string;
  description: string;
  rows: RateLeaderboardEntry[];
  valueLabel: string;
}) {
  return (
    <section className="surface-card rounded-[30px] border border-line p-6">
      <SectionHeading eyebrow="榜单" title={title} description={description} />

      <div className="mt-8 overflow-hidden rounded-[24px] border border-line">
        <table className="min-w-full divide-y divide-line text-left text-sm">
          <thead className="bg-black/[0.03] text-[#6f675d]">
            <tr>
              <th className="px-4 py-3 font-medium">排名</th>
              <th className="px-4 py-3 font-medium">选手</th>
              <th className="px-4 py-3 font-medium">队伍</th>
              <th className="px-4 py-3 font-medium">{valueLabel}</th>
              <th className="px-4 py-3 font-medium">次数</th>
              <th className="px-4 py-3 font-medium">备注</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-white/80">
            {rows.map((row) => (
              <tr key={`${row.rank}-${row.name}`}>
                <td className="px-4 py-4 font-semibold">{row.rank}</td>
                <td className="px-4 py-4 text-[#16120f]">{row.name}</td>
                <td className="px-4 py-4 text-[#6f675d]">{row.team}</td>
                <td className="px-4 py-4 text-brand">
                  {(row.rate * 100).toFixed(1)}%
                </td>
                <td className="px-4 py-4 text-[#6f675d]">{row.count}</td>
                <td className="px-4 py-4 text-[#6f675d]">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
