"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type {
  BigWinLeaderboardEntry,
  CollectorLeaderboardEntry,
  MakeupWinLeaderboard,
  MakeupWinLeaderboardEntry,
  RateLeaderboardEntry,
  RoundIncomeLeaderboardEntry,
} from "@/shared/data/types";
import { SectionHeading } from "@/shared/ui/section-heading";
import {
  getNextSortState,
  type LeaderboardSortKey,
  type RoundIncomeSortKey,
  sortLeaderboardRows,
  sortRoundIncomeRows,
  type SortDirection,
  type SortState,
} from "./ranking-sort";
import { TeamRankCell } from "./team-rank-cell";

type LeaderboardKey =
  | "huleRate"
  | "zimoRate"
  | "fangchongRate"
  | "winDealDiff"
  | "beizimoRate"
  | "averageWinFan"
  | "averageDealInFan"
  | "averageFlower"
  | "averageTsumoLossFan";
type PairedLeaderboardKey = Exclude<LeaderboardKey, "winDealDiff">;
type AnalysisTabKey =
  | "winDealRate"
  | "drawAroundRate"
  | "averageFan"
  | "flowerTsumoLoss"
  | "winDealDiff"
  | "roundIncome"
  | "makeupWin"
  | "bigWin"
  | "collector";

interface AnalysisPanelProps {
  leaderboards: Record<LeaderboardKey, RateLeaderboardEntry[]> & {
    bigWin: BigWinLeaderboardEntry[];
    makeupWin: MakeupWinLeaderboard;
    roundIncome: RoundIncomeLeaderboardEntry[];
    collector: CollectorLeaderboardEntry[];
  };
}

const leaderboardConfig: Record<
  PairedLeaderboardKey,
  {
    title: string;
    valueLabel: string;
    defaultDirection: SortDirection;
    valueKind: "percent" | "number";
    countLabel: string;
    relatedRateKey?: PairedLeaderboardKey;
    relatedRateLabel?: string;
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
    relatedRateKey: "huleRate",
    relatedRateLabel: "和率",
  },
  averageDealInFan: {
    title: "平均铳点",
    valueLabel: "平均铳点",
    defaultDirection: "asc",
    valueKind: "number",
    countLabel: "盘数",
    relatedRateKey: "fangchongRate",
    relatedRateLabel: "铳率",
  },
  averageFlower: {
    title: "平均花牌",
    valueLabel: "平均花牌",
    defaultDirection: "desc",
    valueKind: "number",
    countLabel: "盘数",
    relatedRateKey: "huleRate",
    relatedRateLabel: "和率",
  },
  averageTsumoLossFan: {
    title: "被摸点",
    valueLabel: "被摸点",
    defaultDirection: "asc",
    valueKind: "number",
    countLabel: "盘数",
    relatedRateKey: "beizimoRate",
    relatedRateLabel: "被摸率",
  },
};

const analysisTabs: Record<
  AnalysisTabKey,
  {
    label: string;
    title: string;
    description: string;
    leaderboards?: [PairedLeaderboardKey, PairedLeaderboardKey];
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
  flowerTsumoLoss: {
    label: "花牌/被摸点",
    title: "花牌 / 被摸点",
    description: "并排观察和牌时的花牌数量，以及被他家自摸时承受的平均番数。",
    leaderboards: ["averageFlower", "averageTsumoLossFan"],
  },
  winDealDiff: {
    label: "和铳差",
    title: "和铳差",
    description: "观察选手和牌率与放铳率之间的差值。",
  },
  roundIncome: {
    label: "局收支",
    title: "局收支",
    description: "按平均每盘收益拆分点和、放铳、自摸、被摸四个模块。",
  },
  makeupWin: {
    label: "凑番",
    title: "凑番",
    description: "按最大番数不超过 2 的和牌拆分金8、银8、铜8、铁8。",
  },
  bigWin: {
    label: "大牌榜",
    title: "大牌榜",
    description: "截取和牌总番数最高的前 20 小局，并列出 8 番及以上番种。",
  },
  collector: {
    label: "收藏家",
    title: "收藏家",
    description: "统计一局中单个玩家和出不同 4 番及以上番种的种类数。",
  },
};

const orderedTabs: AnalysisTabKey[] = [
  "winDealRate",
  "drawAroundRate",
  "averageFan",
  "flowerTsumoLoss",
  "winDealDiff",
  "roundIncome",
  "makeupWin",
  "bigWin",
  "collector",
];

const leaderboardColumns: {
  key: LeaderboardSortKey;
  label: string;
  valueLabel?: true;
  relatedRateLabel?: true;
}[] = [
  { key: "rank", label: "排名" },
  { key: "name", label: "选手" },
  { key: "rate", label: "", valueLabel: true },
  { key: "relatedRate", label: "", relatedRateLabel: true },
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

function formatRelatedRate(row: RateLeaderboardEntry) {
  return row.relatedRate == null ? "-" : `${(row.relatedRate * 100).toFixed(1)}%`;
}

function formatOptionalRate(value: number | undefined) {
  return value == null ? "-" : `${(value * 100).toFixed(1)}%`;
}

function formatRateDiff(value: number | undefined) {
  if (value == null) {
    return "-";
  }

  const prefix = value > 0 ? "+" : "";
  return `${prefix}${(value * 100).toFixed(1)}%`;
}

function buildRateIndex(rows: RateLeaderboardEntry[]) {
  return new Map(rows.map((row) => [row.name, row.rate]));
}

function attachRelatedRate(
  rows: RateLeaderboardEntry[],
  relatedRows: RateLeaderboardEntry[] | undefined,
) {
  if (!relatedRows) {
    return rows;
  }

  const rateIndex = buildRateIndex(relatedRows);

  return rows.map((row) => ({
    ...row,
    relatedRate: rateIndex.get(row.name),
  }));
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
  relatedRateLabel,
  sortState,
  onSort,
}: {
  title: string;
  rows: RateLeaderboardEntry[];
  valueLabel: string;
  valueKind: "percent" | "number";
  countLabel: string;
  relatedRateLabel?: string;
  sortState: SortState<LeaderboardSortKey> | null;
  onSort: (key: LeaderboardSortKey) => void;
}) {
  const visibleColumns = leaderboardColumns.filter(
    (column) => !column.relatedRateLabel || relatedRateLabel,
  );

  return (
    <section className="min-w-0">
      <h3 className="text-base font-semibold text-[#16120f]">{title}</h3>
      <div className="mt-3 max-h-[780px] overflow-auto rounded-[18px] border border-line">
        <table className="min-w-full divide-y divide-line text-left text-sm">
          <thead className="sticky top-0 z-10 bg-black/[0.03] text-[#6f675d]">
            <tr>
              {visibleColumns.map((column) => (
                <SortableHeader
                  key={column.key}
                  label={
                    column.valueLabel
                      ? valueLabel
                      : column.relatedRateLabel
                        ? relatedRateLabel ?? column.label
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
                    {relatedRateLabel ? (
                      <td className="px-4 py-4 text-[#6f675d]">
                        {formatRelatedRate(row)}
                      </td>
                    ) : null}
                    <td className="px-4 py-4 text-[#6f675d]">
                      {sampleSize ?? row.count}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={visibleColumns.length}
                  className="px-4 py-10 text-center text-[#6f675d]"
                >
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

function BigWinTable({ rows }: { rows: BigWinLeaderboardEntry[] }) {
  return (
    <div className="mt-8 max-h-[780px] overflow-auto rounded-[18px] border border-line">
      <table className="min-w-full divide-y divide-line text-left text-sm">
        <thead className="sticky top-0 z-10 bg-black/[0.03] text-[#6f675d]">
          <tr>
            <th className="px-4 py-3 font-medium">排名</th>
            <th className="px-4 py-3 font-medium">番数</th>
            <th className="px-4 py-3 font-medium">和牌家</th>
            <th className="px-4 py-3 font-medium">队伍</th>
            <th className="px-4 py-3 font-medium">放铳家</th>
            <th className="px-4 py-3 font-medium">番种说明</th>
            <th className="px-4 py-3 font-medium">对局</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line bg-white/80">
          {rows.length ? (
            rows.map((row) => (
              <tr key={`${row.rank}-${row.matchId}-${row.recordId}`}>
                <TeamRankCell rank={row.rank} teamName={row.winnerTeam} />
                <td className="px-4 py-4 text-brand">{row.totalFan}</td>
                <td className="px-4 py-4 text-[#16120f]">{row.winner}</td>
                <td className="px-4 py-4 text-[#6f675d]">{row.winnerTeam}</td>
                <td className="px-4 py-4 text-[#6f675d]">{row.discarder}</td>
                <td className="min-w-48 px-4 py-4 text-[#16120f]">
                  {row.description}
                </td>
                <td className="px-4 py-4 text-[#6f675d]">
                  {row.replayUrl ? (
                    <a
                      href={row.replayUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand underline-offset-4 hover:underline"
                    >
                      {row.roundLabel} {row.tableName}
                    </a>
                  ) : (
                    `${row.roundLabel} ${row.tableName}`
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className="px-4 py-10 text-center text-[#6f675d]">
                当前榜单暂无数据。
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const makeupWinSections: {
  key: keyof MakeupWinLeaderboard;
  title: string;
}[] = [
  { key: "gold", title: "金8" },
  { key: "silver", title: "银8" },
  { key: "bronze", title: "铜8" },
  { key: "iron", title: "铁8" },
];

function MakeupWinTable({
  title,
  rows,
}: {
  title: string;
  rows: MakeupWinLeaderboardEntry[];
}) {
  return (
    <section>
      <h3 className="text-base font-semibold text-[#16120f]">{title}</h3>
      <div className="mt-3 overflow-auto rounded-[18px] border border-line">
        <table className="min-w-full divide-y divide-line text-left text-sm">
          <thead className="bg-black/[0.03] text-[#6f675d]">
            <tr>
              <th className="px-4 py-3 font-medium">和牌家</th>
              <th className="px-4 py-3 font-medium">番种说明</th>
              <th className="px-4 py-3 font-medium">对局</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-white/80">
            {rows.length ? (
              rows.map((row) => (
                <tr key={`${row.matchId}-${row.recordId}-${row.winner}`}>
                  <td className="px-4 py-4 text-[#16120f]">{row.winner}</td>
                  <td className="min-w-48 px-4 py-4 text-[#16120f]">
                    {row.description}
                  </td>
                  <td className="px-4 py-4 text-[#6f675d]">
                    {row.replayUrl ? (
                      <a
                        href={row.replayUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand underline-offset-4 hover:underline"
                      >
                        {row.roundLabel} {row.tableName}
                      </a>
                    ) : (
                      `${row.roundLabel} ${row.tableName}`
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-[#6f675d]">
                  当前暂无数据。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MakeupWinTables({ rows }: { rows: MakeupWinLeaderboard }) {
  return (
    <div className="mt-8 space-y-8">
      {makeupWinSections.map((section) => (
        <MakeupWinTable
          key={section.key}
          title={section.title}
          rows={rows[section.key]}
        />
      ))}
    </div>
  );
}

function CollectorTable({ rows }: { rows: CollectorLeaderboardEntry[] }) {
  return (
    <div className="mt-8 max-h-[780px] overflow-auto rounded-[18px] border border-line">
      <table className="min-w-full divide-y divide-line text-left text-sm">
        <thead className="sticky top-0 z-10 bg-black/[0.03] text-[#6f675d]">
          <tr>
            <th className="px-4 py-3 font-medium">排名</th>
            <th className="px-4 py-3 font-medium">和牌家</th>
            <th className="px-4 py-3 font-medium">队伍</th>
            <th className="px-4 py-3 font-medium">番种数量</th>
            <th className="px-4 py-3 font-medium">番种名称</th>
            <th className="px-4 py-3 font-medium">对局</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line bg-white/80">
          {rows.length ? (
            rows.map((row) => (
              <tr key={`${row.rank}-${row.matchId}-${row.winner}`}>
                <TeamRankCell rank={row.rank} teamName={row.winnerTeam} />
                <td className="px-4 py-4 text-[#16120f]">{row.winner}</td>
                <td className="px-4 py-4 text-[#6f675d]">{row.winnerTeam}</td>
                <td className="px-4 py-4 font-semibold text-brand">{row.yakuCount}</td>
                <td className="min-w-48 px-4 py-4 text-[#16120f]">{row.yakuNames}</td>
                <td className="px-4 py-4 text-[#6f675d]">
                  {row.replayUrl ? (
                    <a
                      href={row.replayUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand underline-offset-4 hover:underline"
                    >
                      {row.roundLabel} {row.tableName}
                    </a>
                  ) : (
                    `${row.roundLabel} ${row.tableName}`
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-[#6f675d]">
                当前榜单暂无数据。
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function formatIncome(value: number) {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(2)}`;
}

function RoundIncomeTable({
  rows,
  sortState,
  onSort,
}: {
  rows: RoundIncomeLeaderboardEntry[];
  sortState: SortState<RoundIncomeSortKey> | null;
  onSort: (key: RoundIncomeSortKey) => void;
}) {
  return (
    <div className="mt-8 max-h-[780px] overflow-auto rounded-[18px] border border-line">
      <table className="min-w-full divide-y divide-line text-left text-sm">
        <thead className="sticky top-0 z-10 bg-black/[0.03] text-[#6f675d]">
          <tr>
            <SortableHeader
              label="排名"
              columnKey="rank"
              sortState={sortState}
              onSort={onSort}
            />
            <SortableHeader
              label="选手"
              columnKey="name"
              sortState={sortState}
              onSort={onSort}
            />
            <SortableHeader
              label="队伍"
              columnKey="team"
              sortState={sortState}
              onSort={onSort}
            />
            <SortableHeader
              label="点和收益"
              columnKey="pointWin"
              sortState={sortState}
              onSort={onSort}
            />
            <SortableHeader
              label="放铳收益"
              columnKey="dealIn"
              sortState={sortState}
              onSort={onSort}
            />
            <SortableHeader
              label="自摸收益"
              columnKey="selfDraw"
              sortState={sortState}
              onSort={onSort}
            />
            <SortableHeader
              label="被摸收益"
              columnKey="drawnByOthers"
              sortState={sortState}
              onSort={onSort}
            />
            <SortableHeader
              label="局收支"
              columnKey="roundIncome"
              sortState={sortState}
              onSort={onSort}
            />
            <SortableHeader
              label="盘数"
              columnKey="rounds"
              sortState={sortState}
              onSort={onSort}
            />
          </tr>
        </thead>
        <tbody className="divide-y divide-line bg-white/80">
          {rows.length ? (
            rows.map((row) => (
              <tr key={`${row.rank}-${row.name}`}>
                <TeamRankCell rank={row.rank} teamName={row.team} />
                <td className="px-4 py-4 text-[#16120f]">{row.name}</td>
                <td className="px-4 py-4 text-[#6f675d]">{row.team}</td>
                <IncomeModuleCell
                  module={row.pointWin}
                  getPointWinValue={(module) => module.averageFan + 24}
                />
                <IncomeModuleCell
                  module={row.dealIn}
                  getPointWinValue={(module) => -(module.averageFan + 8)}
                />
                <IncomeModuleCell
                  module={row.selfDraw}
                  getPointWinValue={(module) => module.averageFan * 3 + 24}
                />
                <IncomeModuleCell
                  module={row.drawnByOthers}
                  getPointWinValue={(module) => -(module.averageFan + 8)}
                />
                <td className="px-4 py-4 font-semibold text-brand">
                  {formatIncome(row.roundIncome)}
                </td>
                <td className="px-4 py-4 text-[#6f675d]">{row.rounds}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={9} className="px-4 py-10 text-center text-[#6f675d]">
                当前榜单暂无数据。
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function IncomeModuleCell({
  module,
  getPointWinValue,
}: {
  module: RoundIncomeLeaderboardEntry["pointWin"];
  getPointWinValue: (module: RoundIncomeLeaderboardEntry["pointWin"]) => number;
}) {
  return (
    <td className="px-4 py-4 font-medium text-[#16120f]">
      {formatIncome(getPointWinValue(module))}
    </td>
  );
}

function WinDealDiffTable({
  rows,
  sortState,
  onSort,
}: {
  rows: RateLeaderboardEntry[];
  sortState: SortState<LeaderboardSortKey> | null;
  onSort: (key: LeaderboardSortKey) => void;
}) {
  return (
    <div className="mt-8 max-h-[780px] overflow-auto rounded-[18px] border border-line">
      <table className="min-w-full divide-y divide-line text-left text-sm">
        <thead className="sticky top-0 z-10 bg-black/[0.03] text-[#6f675d]">
          <tr>
            <SortableHeader
              label="排名"
              columnKey="rank"
              sortState={sortState}
              onSort={onSort}
            />
            <SortableHeader
              label="选手"
              columnKey="name"
              sortState={sortState}
              onSort={onSort}
            />
            <SortableHeader
              label="和牌率"
              columnKey="rate"
              sortState={sortState}
              onSort={onSort}
            />
            <SortableHeader
              label="放铳率"
              columnKey="dealInRate"
              sortState={sortState}
              onSort={onSort}
            />
            <SortableHeader
              label="和铳差"
              columnKey="rateDiff"
              sortState={sortState}
              onSort={onSort}
            />
            <SortableHeader
              label="盘数"
              columnKey="count"
              sortState={sortState}
              onSort={onSort}
            />
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
                    {formatOptionalRate(row.rate)}
                  </td>
                  <td className="px-4 py-4 text-[#6f675d]">
                    {formatOptionalRate(row.dealInRate)}
                  </td>
                  <td className="px-4 py-4 font-semibold text-[#16120f]">
                    {formatRateDiff(row.rateDiff)}
                  </td>
                  <td className="px-4 py-4 text-[#6f675d]">
                    {sampleSize ?? row.count}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-[#6f675d]">
                当前榜单暂无数据。
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function AnalysisPanel({ leaderboards }: AnalysisPanelProps) {
  const [activeTab, setActiveTab] = useState<AnalysisTabKey>("winDealRate");
  const [leaderboardSorts, setLeaderboardSorts] = useState<
    Record<PairedLeaderboardKey, SortState<LeaderboardSortKey> | null>
  >({
    huleRate: null,
    zimoRate: null,
    fangchongRate: null,
    beizimoRate: null,
    averageWinFan: null,
    averageDealInFan: null,
    averageFlower: null,
    averageTsumoLossFan: null,
  });
  const [winDealDiffSort, setWinDealDiffSort] =
    useState<SortState<LeaderboardSortKey> | null>(null);
  const [roundIncomeSort, setRoundIncomeSort] =
    useState<SortState<RoundIncomeSortKey> | null>(null);
  const config = analysisTabs[activeTab];
  const rateKeys = config.leaderboards;
  const sortedLeaderboards = useMemo(() => {
    if (!rateKeys) {
      return null;
    }

    const [leftKey, rightKey] = rateKeys;
    const sortLeaderboard = (key: PairedLeaderboardKey) => {
      const keyConfig = leaderboardConfig[key];
      const rows = attachRelatedRate(
        leaderboards[key],
        keyConfig.relatedRateKey ? leaderboards[keyConfig.relatedRateKey] : undefined,
      );

      return sortLeaderboardRows(
        rows,
        leaderboardSorts[key],
        keyConfig.defaultDirection,
      );
    };

    return {
      [leftKey]: sortLeaderboard(leftKey),
      [rightKey]: sortLeaderboard(rightKey),
    };
  }, [leaderboardSorts, leaderboards, rateKeys]);
  const winDealDiffRows = useMemo(
    () =>
      sortLeaderboardRows(
        leaderboards.winDealDiff,
        winDealDiffSort,
        "desc",
        "rateDiff",
    ),
    [leaderboards.winDealDiff, winDealDiffSort],
  );
  const roundIncomeRows = useMemo(
    () => sortRoundIncomeRows(leaderboards.roundIncome, roundIncomeSort),
    [leaderboards.roundIncome, roundIncomeSort],
  );

  function handleLeaderboardSort(
    key: PairedLeaderboardKey,
    sortKey: LeaderboardSortKey,
  ) {
    setLeaderboardSorts((currentSorts) => ({
      ...currentSorts,
      [key]: getNextSortState(currentSorts[key], sortKey),
    }));
  }

  function handleWinDealDiffSort(sortKey: LeaderboardSortKey) {
    setWinDealDiffSort((currentSort) => getNextSortState(currentSort, sortKey));
  }

  function handleRoundIncomeSort(sortKey: RoundIncomeSortKey) {
    setRoundIncomeSort((currentSort) => getNextSortState(currentSort, sortKey));
  }

  return (
    <section className="surface-card rounded-[30px] border border-line p-6">
      <SectionHeading
        eyebrow="分析"
        title={config.title}
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

      {activeTab === "winDealDiff" ? (
        <WinDealDiffTable
          rows={winDealDiffRows}
          sortState={winDealDiffSort}
          onSort={handleWinDealDiffSort}
        />
      ) : activeTab === "roundIncome" ? (
        <RoundIncomeTable
          rows={roundIncomeRows}
          sortState={roundIncomeSort}
          onSort={handleRoundIncomeSort}
        />
      ) : activeTab === "makeupWin" ? (
        <MakeupWinTables rows={leaderboards.makeupWin} />
      ) : rateKeys && sortedLeaderboards ? (
        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          {rateKeys.map((key) => (
            <AnalysisTable
              key={key}
              title={leaderboardConfig[key].title}
              rows={sortedLeaderboards[key]}
              valueLabel={leaderboardConfig[key].valueLabel}
              valueKind={leaderboardConfig[key].valueKind}
              countLabel={leaderboardConfig[key].countLabel}
              relatedRateLabel={leaderboardConfig[key].relatedRateLabel}
              sortState={leaderboardSorts[key]}
              onSort={(sortKey) => handleLeaderboardSort(key, sortKey)}
            />
          ))}
        </div>
      ) : activeTab === "collector" ? (
        <CollectorTable rows={leaderboards.collector} />
      ) : (
        <BigWinTable rows={leaderboards.bigWin} />
      )}
    </section>
  );
}
