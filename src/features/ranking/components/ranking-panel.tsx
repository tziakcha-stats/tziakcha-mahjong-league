"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type {
  FractionValue,
  PlayerRankingEntry,
  TeamRankingEntry,
} from "@/shared/data/types";
import { FractionDisplay } from "@/shared/ui/fraction-display";
import { SectionHeading } from "@/shared/ui/section-heading";
import {
  getNextSortState,
  type RankingSortKey,
  sortRankingRows,
  type SortState,
} from "./ranking-sort";
import { TeamRankCell } from "./team-rank-cell";

interface RankingPanelProps {
  ranking: PlayerRankingEntry[];
  teamRanking: TeamRankingEntry[];
}

const rankingColumns: { key: RankingSortKey; label: string }[] = [
  { key: "rank", label: "排名" },
  { key: "name", label: "选手" },
  { key: "club", label: "俱乐部" },
  { key: "standardPoints", label: "标准分" },
  { key: "totalPoints", label: "比赛分" },
  { key: "averagePlacement", label: "平均标准分" },
  { key: "bonus", label: "出场数" },
];

const teamRankingColumns = [
  { key: "rank", label: "排名" },
  { key: "name", label: "队伍" },
  { key: "standardPoints", label: "标准分" },
  { key: "totalPoints", label: "比赛分" },
  { key: "averageStandardPoints", label: "平均标准分" },
  { key: "matchCount", label: "出场桌数" },
] as const;

const placementCountColumns = [
  { key: "first", label: "一位" },
  { key: "second", label: "二位" },
  { key: "third", label: "三位" },
  { key: "fourth", label: "四位" },
] as const;

function getSortIndicator<TSortKey extends string>(
  sortState: SortState<TSortKey> | null,
  key: TSortKey,
) {
  if (sortState?.key !== key) {
    return "↕";
  }

  return sortState.direction === "asc" ? "↑" : "↓";
}

function SortableHeader<TSortKey extends string>({
  label,
  columnKey,
  sortState,
  onSort,
  className,
}: {
  label: string;
  columnKey: TSortKey;
  sortState: SortState<TSortKey> | null;
  onSort: (key: TSortKey) => void;
  className?: string;
}) {
  const isActive = sortState?.key === columnKey;

  return (
    <th
      className={cn("px-4 py-3 font-medium", className)}
      aria-sort={
        isActive
          ? sortState.direction === "asc"
            ? "ascending"
            : "descending"
          : "none"
      }
    >
      <button
        type="button"
        onClick={() => onSort(columnKey)}
        className={cn(
          "inline-flex min-h-8 items-center gap-1 rounded-md px-1 text-left transition-colors hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
          isActive && "font-semibold",
        )}
        aria-label={`${label}排序`}
      >
        <span>{label}</span>
        <span aria-hidden="true" className="text-xs opacity-75">
          {getSortIndicator(sortState, columnKey)}
        </span>
      </button>
    </th>
  );
}

export function RankingPanel({ ranking, teamRanking }: RankingPanelProps) {
  const [rankingSort, setRankingSort] =
    useState<SortState<RankingSortKey> | null>(null);
  const sortedRanking = useMemo(
    () => sortRankingRows(ranking, rankingSort),
    [ranking, rankingSort],
  );

  function handleRankingSort(key: RankingSortKey) {
    setRankingSort((currentSort) => getNextSortState(currentSort, key));
  }

  return (
    <div className="space-y-6">
      <section className="surface-card rounded-[30px] border border-line p-6">
        <SectionHeading eyebrow="排行" title="队伍排行" />
        <p className="mt-2 text-sm text-[#6f675d]">
          括号前为未扣罚的标准分，括号内为罚分。
        </p>

        <div className="mt-8 max-h-[780px] overflow-auto rounded-[24px] border border-line">
          <table className="min-w-full divide-y divide-line text-left text-sm">
            <thead className="sticky top-0 z-10 bg-brand text-white/85">
              <tr>
                {teamRankingColumns.map((column) => (
                  <th key={column.key} className="px-4 py-3 font-medium">
                    {column.label}
                  </th>
                ))}
                {placementCountColumns.map((column) => (
                  <th key={column.key} className="px-4 py-3 font-medium">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-white/80">
              {teamRanking.length ? (
                teamRanking.map((entry) => (
                  <tr key={entry.name}>
                    <TeamRankCell rank={entry.rank} teamName={entry.name} />
                    <td className="px-4 py-4 font-semibold">{entry.name}</td>
                    <td className="px-4 py-4 text-brand">
                      <PenaltyAwareFraction
                        standardPoints={entry.standardPoints}
                        standardPointPenalty={entry.standardPointPenalty}
                      />
                    </td>
                    <td className="px-4 py-4 text-[#6f675d]">
                      {entry.totalPoints}
                    </td>
                    <td className="px-4 py-4 text-[#6f675d]">
                      {entry.averageStandardPoints}
                    </td>
                    <td className="px-4 py-4 text-[#6f675d]">
                      {entry.matchCount}
                    </td>
                    {placementCountColumns.map((column) => (
                      <td key={column.key} className="px-4 py-4 text-[#6f675d]">
                        <FractionDisplay value={entry.placementCounts[column.key]} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-10 text-center text-[#6f675d]"
                  >
                    当前赛事尚未产生队伍排行数据。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="surface-card rounded-[30px] border border-line p-6">
        <SectionHeading eyebrow="个人" title="个人排行" />

        <div className="mt-8 max-h-[780px] overflow-auto rounded-[24px] border border-line">
          <table className="min-w-full divide-y divide-line text-left text-sm">
            <thead className="sticky top-0 z-10 bg-brand text-white/85">
              <tr>
                {rankingColumns.map((column) => (
                  <SortableHeader
                    key={column.key}
                    label={column.label}
                    columnKey={column.key}
                    sortState={rankingSort}
                    onSort={handleRankingSort}
                  />
                ))}
                {placementCountColumns.map((column) => (
                  <th key={column.key} className="px-4 py-3 font-medium">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-white/80">
              {ranking.length ? (
                sortedRanking.map((entry) => (
                  <tr key={entry.name}>
                    <TeamRankCell rank={entry.rank} teamName={entry.club} />
                    <td className="px-4 py-4">{entry.name}</td>
                    <td className="px-4 py-4 text-[#6f675d]">{entry.club}</td>
                    <td className="px-4 py-4 text-brand">
                      <PenaltyAwareFraction
                        standardPoints={entry.standardPoints}
                        standardPointPenalty={entry.standardPointPenalty}
                      />
                    </td>
                    <td className="px-4 py-4 text-brand">{entry.totalPoints}</td>
                    <td className="px-4 py-4 text-[#6f675d]">
                      {entry.averagePlacement}
                    </td>
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
                  <td
                    colSpan={10}
                    className="px-4 py-10 text-center text-[#6f675d]"
                  >
                    当前赛事尚未产生排行榜数据。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function PenaltyAwareFraction({
  standardPoints,
  standardPointPenalty,
}: {
  standardPoints: FractionValue;
  standardPointPenalty: FractionValue;
}) {
  const hasPenalty = standardPointPenalty.numerator !== 0;

  return (
    <span className="inline-flex items-baseline gap-1">
      <FractionDisplay value={standardPoints} />
      {hasPenalty ? (
        <span className="text-xs text-[#b4503b]">
          (-<FractionDisplay value={standardPointPenalty} />)
        </span>
      ) : null}
    </span>
  );
}
