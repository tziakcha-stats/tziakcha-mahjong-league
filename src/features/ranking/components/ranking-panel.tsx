"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type {
  PlayerRankingEntry,
  RateLeaderboardEntry,
  TeamRankingEntry,
} from "@/shared/data/types";
import { FractionDisplay } from "@/shared/ui/fraction-display";
import { SectionHeading } from "@/shared/ui/section-heading";
import {
  getNextSortState,
  type LeaderboardSortKey,
  type RankingSortKey,
  sortLeaderboardRows,
  sortRankingRows,
  type SortDirection,
  type SortState,
} from "./ranking-sort";
import { TeamRankCell } from "./team-rank-cell";

type RankingTabKey =
  | "overview"
  | "personal"
  | "huleRate"
  | "zimoRate"
  | "fangchongRate"
  | "beizimoRate";

interface RankingPanelProps {
  ranking: PlayerRankingEntry[];
  teamRanking: TeamRankingEntry[];
  leaderboards: {
    huleRate: RateLeaderboardEntry[];
    zimoRate: RateLeaderboardEntry[];
    fangchongRate: RateLeaderboardEntry[];
    beizimoRate: RateLeaderboardEntry[];
  };
}

const tabConfig: Record<
  RankingTabKey,
  {
    label: string;
    title: string;
    description: string;
    valueLabel?: string;
  }
> = {
  overview: {
    label: "总览",
    title: "队伍排行",
    description: "按队伍标准分排序，队伍出场数按参与桌次数统计。",
  },
  personal: {
    label: "个人排行",
    title: "个人排行",
    description: "按玩家标准分排序，平均标准分用于观察单场效率。",
  },
  huleRate: {
    label: "和牌率",
    title: "和牌率榜单",
    description:
      "统计每位选手的和牌效率，数值越高表示越容易在对局中完成和牌。",
    valueLabel: "和牌率",
  },
  zimoRate: {
    label: "自摸率",
    title: "自摸率榜单",
    description:
      "统计每位选手的自摸和牌占比，适合观察门清推进和收尾能力。",
    valueLabel: "自摸率",
  },
  fangchongRate: {
    label: "放铳率",
    title: "放铳率榜单",
    description:
      "统计每位选手的放铳控制能力，数值越低通常代表防守更稳定。",
    valueLabel: "放铳率",
  },
  beizimoRate: {
    label: "被自摸率",
    title: "被自摸率榜单",
    description:
      "统计每位选手在样本局数中被他家自摸带走的比例，数值越低通常代表局况承压更少。",
    valueLabel: "被自摸率",
  },
};

const orderedTabs: RankingTabKey[] = [
  "overview",
  "personal",
  "huleRate",
  "zimoRate",
  "fangchongRate",
  "beizimoRate",
];

const leaderboardDefaultDirections: Record<
  Exclude<RankingTabKey, "overview" | "personal">,
  SortDirection
> = {
  huleRate: "desc",
  zimoRate: "desc",
  fangchongRate: "asc",
  beizimoRate: "asc",
};

const rankingColumns: { key: RankingSortKey; label: string }[] = [
  { key: "rank", label: "排名" },
  { key: "name", label: "选手" },
  { key: "club", label: "俱乐部" },
  { key: "totalPoints", label: "比赛分" },
  { key: "standardPoints", label: "标准分" },
  { key: "averagePlacement", label: "平均标准分" },
  { key: "bonus", label: "出场数" },
];

const teamRankingColumns = [
  { key: "rank", label: "排名" },
  { key: "name", label: "队伍" },
  { key: "standardPoints", label: "标准分" },
  { key: "averageStandardPoints", label: "平均标准分" },
  { key: "totalPoints", label: "比赛分" },
  { key: "matchCount", label: "出场桌数" },
] as const;

const placementCountColumns = [
  { key: "first", label: "一位" },
  { key: "second", label: "二位" },
  { key: "third", label: "三位" },
  { key: "fourth", label: "四位" },
] as const;

const leaderboardColumns: {
  key: LeaderboardSortKey;
  label: string;
  valueLabel?: true;
}[] = [
  { key: "rank", label: "排名" },
  { key: "name", label: "选手" },
  { key: "team", label: "队伍" },
  { key: "rate", label: "", valueLabel: true },
  { key: "count", label: "数量 / 小局数" },
];

function getSampleSize(note: string) {
  const match = note.match(/(\d+)\s*局样本/);
  return match ? Number(match[1]) : null;
}

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

export function RankingPanel({
  ranking,
  teamRanking,
  leaderboards,
}: RankingPanelProps) {
  const [activeTab, setActiveTab] = useState<RankingTabKey>("overview");
  const [rankingSort, setRankingSort] =
    useState<SortState<RankingSortKey> | null>(null);
  const [leaderboardSorts, setLeaderboardSorts] = useState<
    Record<
      Exclude<RankingTabKey, "overview" | "personal">,
      SortState<LeaderboardSortKey> | null
    >
  >({
    huleRate: null,
    zimoRate: null,
    fangchongRate: null,
    beizimoRate: null,
  });
  const config = tabConfig[activeTab];
  const isOverview = activeTab === "overview";
  const isPersonal = activeTab === "personal";
  const sortedRanking = useMemo(
    () => sortRankingRows(ranking, rankingSort),
    [ranking, rankingSort],
  );
  const activeLeaderboardSort =
    !isOverview && !isPersonal ? leaderboardSorts[activeTab] : null;
  const sortedActiveRows = useMemo(() => {
    if (isOverview || isPersonal) {
      return [];
    }

    const activeRows = leaderboards[activeTab];

    return sortLeaderboardRows(
      activeRows,
      activeLeaderboardSort,
      leaderboardDefaultDirections[activeTab],
    );
  }, [activeLeaderboardSort, activeTab, isOverview, isPersonal, leaderboards]);

  function handleRankingSort(key: RankingSortKey) {
    setRankingSort((currentSort) => getNextSortState(currentSort, key));
  }

  function handleLeaderboardSort(key: LeaderboardSortKey) {
    if (isOverview || isPersonal) {
      return;
    }

    setLeaderboardSorts((currentSorts) => ({
      ...currentSorts,
      [activeTab]: getNextSortState(currentSorts[activeTab], key),
    }));
  }

  return (
    <section className="surface-card rounded-[30px] border border-line p-6">
      <SectionHeading eyebrow="排行" title={config.title} />

      <div className="mt-5 flex flex-wrap gap-3">
        {orderedTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm transition-colors",
              activeTab === tab
                ? "border-brand bg-brand text-white"
                : "border-line bg-white/70 text-[#6f675d] hover:bg-white",
            )}
            style={activeTab === tab ? { color: "#ffffff" } : undefined}
          >
            {tabConfig[tab].label}
          </button>
        ))}
      </div>

      {isOverview ? (
        <div className="mt-8 overflow-hidden rounded-[24px] border border-line">
          <table className="min-w-full divide-y divide-line text-left text-sm">
            <thead className="bg-brand text-white/85">
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
                      <FractionDisplay value={entry.standardPoints} />
                    </td>
                    <td className="px-4 py-4 text-[#6f675d]">
                      {entry.averageStandardPoints}
                    </td>
                    <td className="px-4 py-4 text-[#6f675d]">
                      {entry.totalPoints}
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
      ) : isPersonal ? (
        <div className="mt-8 overflow-hidden rounded-[24px] border border-line">
          <table className="min-w-full divide-y divide-line text-left text-sm">
            <thead className="bg-brand text-white/85">
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
                    <td className="px-4 py-4 text-brand">{entry.totalPoints}</td>
                    <td className="px-4 py-4 text-brand">
                      <FractionDisplay value={entry.standardPoints} />
                    </td>
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
      ) : (
        <div className="mt-8 overflow-hidden rounded-[24px] border border-line">
          <table className="min-w-full divide-y divide-line text-left text-sm">
            <thead className="bg-black/[0.03] text-[#6f675d]">
              <tr>
                {leaderboardColumns.map((column) => (
                  <SortableHeader
                    key={column.key}
                    label={column.valueLabel ? config.valueLabel ?? "" : column.label}
                    columnKey={column.key}
                    sortState={activeLeaderboardSort}
                    onSort={handleLeaderboardSort}
                    className="text-[#6f675d]"
                  />
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-white/80">
              {sortedActiveRows.length ? (
                sortedActiveRows.map((row) => {
                  const sampleSize = getSampleSize(row.note);

                  return (
                    <tr key={`${row.rank}-${row.name}`}>
                      <TeamRankCell rank={row.rank} teamName={row.team} />
                      <td className="px-4 py-4 text-[#16120f]">{row.name}</td>
                      <td className="px-4 py-4 text-[#6f675d]">{row.team}</td>
                      <td className="px-4 py-4 text-brand">
                        {(row.rate * 100).toFixed(1)}%
                      </td>
                      <td className="px-4 py-4 text-[#6f675d]">
                        {sampleSize ? `${row.count} / ${sampleSize}` : row.count}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-[#6f675d]"
                  >
                    当前榜单暂无数据。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
