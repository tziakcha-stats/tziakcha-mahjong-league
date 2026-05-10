import type { PlayerRankingEntry, RateLeaderboardEntry } from "@/shared/data/types";

const stringCollator = new Intl.Collator("zh-Hans-CN", {
  numeric: true,
  sensitivity: "base",
});

export type SortDirection = "asc" | "desc";

export type RankingSortKey = keyof Pick<
  PlayerRankingEntry,
  | "rank"
  | "name"
  | "club"
  | "totalPoints"
  | "standardPoints"
  | "averagePlacement"
  | "bonus"
>;

export type LeaderboardSortKey = keyof Pick<
  RateLeaderboardEntry,
  "rank" | "name" | "team" | "rate" | "count"
>;

export interface SortState<TSortKey extends string> {
  key: TSortKey;
  direction: SortDirection;
}

export function getNextSortState<TSortKey extends string>(
  currentSort: SortState<TSortKey> | null,
  key: TSortKey,
): SortState<TSortKey> | null {
  if (!currentSort || currentSort.key !== key) {
    return { key, direction: "asc" };
  }

  if (currentSort.direction === "asc") {
    return { key, direction: "desc" };
  }

  return null;
}

function compareValues(leftValue: string | number, rightValue: string | number) {
  if (typeof leftValue === "number" && typeof rightValue === "number") {
    return leftValue - rightValue;
  }

  return stringCollator.compare(String(leftValue), String(rightValue));
}

function getRankingSortValue(row: PlayerRankingEntry, key: RankingSortKey) {
  if (key === "standardPoints") {
    return row.standardPoints.numerator / row.standardPoints.denominator;
  }

  return row[key];
}

function sortRows<TRow extends { rank: number }, TSortKey extends keyof TRow>(
  rows: TRow[],
  sortState: SortState<Extract<TSortKey, string>> | null,
  defaultState: SortState<Extract<TSortKey, string>>,
) {
  const effectiveSort = sortState ?? defaultState;

  return [...rows].sort((left, right) => {
    const result = compareValues(
      left[effectiveSort.key] as string | number,
      right[effectiveSort.key] as string | number,
    );

    if (result !== 0) {
      return effectiveSort.direction === "asc" ? result : -result;
    }

    return left.rank - right.rank;
  });
}

export function sortRankingRows(
  rows: PlayerRankingEntry[],
  sortState: SortState<RankingSortKey> | null,
) {
  const effectiveSort = sortState ?? {
    key: "standardPoints" as const,
    direction: "desc" as const,
  };

  return [...rows].sort((left, right) => {
    const result = compareValues(
      getRankingSortValue(left, effectiveSort.key),
      getRankingSortValue(right, effectiveSort.key),
    );

    if (result !== 0) {
      return effectiveSort.direction === "asc" ? result : -result;
    }

    return left.rank - right.rank;
  });
}

export function sortLeaderboardRows(
  rows: RateLeaderboardEntry[],
  sortState: SortState<LeaderboardSortKey> | null,
  defaultDirection: SortDirection,
) {
  return sortRows<RateLeaderboardEntry, LeaderboardSortKey>(rows, sortState, {
    key: "rate",
    direction: defaultDirection,
  });
}
