import type { MatchRecord } from "@/shared/data/types";
import { SectionHeading } from "@/shared/ui/section-heading";

export function MatchRecordsTable({ matches }: { matches: MatchRecord[] }) {
  return (
    <section className="surface-card rounded-[30px] border border-line p-6">
      <SectionHeading
        eyebrow="对局记录"
        title="近期完成对局"
        description="后续接后端时，这里可以自然扩展为分页表格、筛选器、单对局详情抽屉等能力。"
      />

      <div className="mt-8 overflow-hidden rounded-[24px] border border-line">
        <table className="min-w-full divide-y divide-line text-left text-sm">
          <thead className="bg-black/[0.03] text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">桌次</th>
              <th className="px-4 py-3 font-medium">轮次</th>
              <th className="px-4 py-3 font-medium">选手</th>
              <th className="px-4 py-3 font-medium">胜者</th>
              <th className="px-4 py-3 font-medium">得点</th>
              <th className="px-4 py-3 font-medium">完成时间</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-white/80">
            {matches.length ? (
              matches.map((match) => (
                <tr key={match.id}>
                  <td className="px-4 py-4 font-semibold">{match.tableName}</td>
                  <td className="px-4 py-4 text-muted">{match.roundLabel}</td>
                  <td className="px-4 py-4 text-muted">{match.players.join(" / ")}</td>
                  <td className="px-4 py-4">{match.winner}</td>
                  <td className="px-4 py-4 text-brand">{match.points}</td>
                  <td className="px-4 py-4 text-muted">{match.finishedAt}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
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
