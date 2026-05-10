"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { RateLeaderboardEntry } from "@/shared/data/types";
import { SectionHeading } from "@/shared/ui/section-heading";
import {
  getNextSortState,
  type LeaderboardSortKey,
  sortLeaderboardRows,
  type SortDirection,
  type SortState,
} from "./ranking-sort";
import { TeamRankCell } from "./team-rank-cell";

type LeaderboardKey =
  | "huleRate"
  | "zimoRate"
  | "fangchongRate"
  | "beizimoRate"
  | "averageWinFan"
  | "averageDealInFan";
type AnalysisTabKey = "winDealRate" | "drawAroundRate" | "averageFan";

interface AnalysisPanelProps {
  leaderboards: Record<LeaderboardKey, RateLeaderboardEntry[]>;
}

const leaderboardConfig: Record<
  LeaderboardKey,
  {
    title: string;
    valueLabel: string;
    defaultDirection: SortDirection;
    valueKind: "percent" | "number";
    countLabel: string;
  }
> = {
  huleRate: {
    title: "和牌率",
    valueLabel: "和牌率",
    defaultDirection: "desc",
    valueKind: "percent",
    countLabel: "盘数",
  },
  fangchongRate: {
    title: "放铳率",
    valueLabel: "放铳率",
    defaultDirection: "asc",
    valueKind: "percent",
    countLabel: "盘数",
  },
  zimoRate: {
    title: "自摸率",
    valueLabel: "自摸率",
    defaultDirection: "desc",
    valueKind: "percent",
    countLabel: "盘数",
  },
  beizimoRate: {
    title: "被摸率",
    valueLabel: "被摸率",
    defaultDirection: "asc",
    valueKind: "percent",
    countLabel: "盘数",
  },
  averageWinFan: {
    title: "平均打点",
    valueLabel: "平均打点",
    defaultDirection: "desc",
    valueKind: "number",
    countLabel: "盘数",
  },
  averageDealInFan: {
    title: "平均铳点",
    valueLabel: "平均铳点",
    defaultDirection: "asc",
    valueKind: "number",
    countLabel: "盘数",
  },
};

const analysisTabs: Record<
  AnalysisTabKey,
  {
    label: string;
    title: string;
    description: string;
    leaderboards: [LeaderboardKey, LeaderboardKey];
  }
> = {
  winDealRate: {
    label: "和率/铳率",
    title: "和率 / 铳率",
    description: "并排观察选手的进攻完成率与放铳控制表现。",
    leaderboards: ["huleRate", "fangchongRate"],
  },
  drawAroundRate: {
    label: "自摸率/被摸率",
    title: "自摸率 / 被摸率",
    description: "并排观察自摸和牌占比，以及被他家自摸带走的比例。",
    leaderboards: ["zimoRate", "beizimoRate"],
  },
  averageFan: {
    label: "打点/铳点",
    title: "打点 / 铳点",
    description: "并排观察选手和牌番数产出，以及点炮时给出的番数压力。",
    leaderboards: ["averageWinFan", "averageDealInFan"],
  },
};

const orderedTabs: AnalysisTabKey[] = ["winDealRate", "drawAroundRate", "averageFan"];

const leaderboardColumns: {
  key: LeaderboardSortKey;
  label: string;
  valueLabel?: true;
}[] = [
  { key: "rank", label: "排名" },
  { key: "name", label: "选手" },
  { key: "rate", label: "", valueLabel: true },
  { key: "count", label: "" },
];

function getSampleSize(note: string) {
  const match = note.match(/(\d+)\s*局样本/);
  return match ? Number(match[1]) : null;
}

function formatLeaderboardValue(row: RateLeaderboardEntry, valueKind: "percent" | "number") {
  if (valueKind === "percent") {
    return `${(row.rate * 100).toFixed(1)}%`;
  }

  return row.rate.toFixed(1);
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
}: {
  label: string;
  columnKey: TSortKey;
  sortState: SortState<TSortKey> | null;
  onSort: (key: TSortKey) => void;
}) {
  const isActive = sortState?.key === columnKey;

  return (
    <th
      className="px-4 py-3 font-medium"
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
          "inline-flex min-h-8 items-center gap-1 rounded-md px-1 text-left transition-colors hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
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

function AnalysisTable({
  title,
  rows,
  valueLabel,
  valueKind,
  countLabel,
  sortState,
  onSort,
}: {
  title: string;
  rows: RateLeaderboardEntry[];
  valueLabel: string;
  valueKind: "percent" | "number";
  countLabel: string;
  sortState: SortState<LeaderboardSortKey> | null;
  onSort: (key: LeaderboardSortKey) => void;
}) {
  return (
    <section className="min-w-0">
      <h3 className="text-base font-semibold text-[#16120f]">{title}</h3>
      <div className="mt-3 max-h-[780px] overflow-auto rounded-[18px] border border-line">
        <table className="min-w-full divide-y divide-line text-left text-sm">
          <thead className="sticky top-0 z-10 bg-black/[0.03] text-[#6f675d]">
            <tr>
              {leaderboardColumns.map((column) => (
                <SortableHeader
                  key={column.key}
                  label={
                    column.valueLabel
                      ? valueLabel
                      : column.key === "count"
                        ? countLabel
                        : column.label
                  }
                  columnKey={column.key}
                  sortState={sortState}
                  onSort={onSort}
                />
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-white/80">
            {rows.length ? (
              rows.map((row) => {
                const sampleSize = getSampleSize(row.note);

                return (
                  <tr key={`${row.rank}-${row.name}`}>
                    <TeamRankCell rank={row.rank} teamName={row.team} />
                    <td className="px-4 py-4 text-[#16120f]">{row.name}</td>
                    <td className="px-4 py-4 text-brand">
                      {formatLeaderboardValue(row, valueKind)}
                    </td>
                    <td className="px-4 py-4 text-[#6f675d]">
                      {sampleSize ?? row.count}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-[#6f675d]">
                  当前榜单暂无数据。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function AnalysisPanel({ leaderboards }: AnalysisPanelProps) {
  const [activeTab, setActiveTab] = useState<AnalysisTabKey>("winDealRate");
  const [leaderboardSorts, setLeaderboardSorts] = useState<
    Record<LeaderboardKey, SortState<LeaderboardSortKey> | null>
  >({
    huleRate: null,
    zimoRate: null,
    fangchongRate: null,
    beizimoRate: null,
    averageWinFan: null,
    averageDealInFan: null,
  });
  const config = analysisTabs[activeTab];
  const [leftKey, rightKey] = config.leaderboards;
  const sortedLeaderboards = useMemo(() => {
    const sortLeaderboard = (key: LeaderboardKey) =>
      sortLeaderboardRows(
        leaderboards[key],
        leaderboardSorts[key],
        leaderboardConfig[key].defaultDirection,
      );

    return {
      [leftKey]: sortLeaderboard(leftKey),
      [rightKey]: sortLeaderboard(rightKey),
    };
  }, [leaderboardSorts, leaderboards, leftKey, rightKey]);

  function handleLeaderboardSort(key: LeaderboardKey, sortKey: LeaderboardSortKey) {
    setLeaderboardSorts((currentSorts) => ({
      ...currentSorts,
      [key]: getNextSortState(currentSorts[key], sortKey),
    }));
  }

  return (
    <section className="surface-card rounded-[30px] border border-line p-6">
      <SectionHeading
        eyebrow="分析"
        title={config.title}
        description={config.description}
      />

      <div className="mt-5 flex flex-wrap gap-3" aria-label="分析榜单">
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
            {analysisTabs[tab].label}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        {[leftKey, rightKey].map((key) => (
          <AnalysisTable
            key={key}
            title={leaderboardConfig[key].title}
            rows={sortedLeaderboards[key]}
            valueLabel={leaderboardConfig[key].valueLabel}
            valueKind={leaderboardConfig[key].valueKind}
            countLabel={leaderboardConfig[key].countLabel}
            sortState={leaderboardSorts[key]}
            onSort={(sortKey) => handleLeaderboardSort(key, sortKey)}
          />
        ))}
      </div>
    </section>
  );
}
