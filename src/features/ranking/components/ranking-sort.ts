import type {
  PlayerRankingEntry,
  RateLeaderboardEntry,
  RoundIncomeLeaderboardEntry,
} from "@/shared/data/types";

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
  "rank" | "name" | "team" | "rate" | "relatedRate" | "dealInRate" | "rateDiff" | "count"
>;

export type RoundIncomeSortKey =
  | keyof Pick<RoundIncomeLeaderboardEntry, "rank" | "name" | "team" | "rounds" | "roundIncome">
  | "pointWin"
  | "dealIn"
  | "selfDraw"
  | "drawnByOthers";

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

function compareValues(
  leftValue: string | number | undefined,
  rightValue: string | number | undefined,
) {
  if (leftValue == null && rightValue == null) {
    return 0;
  }

  if (leftValue == null) {
    return -1;
  }

  if (rightValue == null) {
    return 1;
  }

  if (typeof leftValue === "number" && typeof rightValue === "number") {
    return leftValue - rightValue;
  }

  return stringCollator.compare(String(leftValue), String(rightValue));
}

function getRankingSortValue(row: PlayerRankingEntry, key: RankingSortKey) {
  if (key === "standardPoints") {
    return row.adjustedStandardPoints.numerator / row.adjustedStandardPoints.denominator;
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
      left[effectiveSort.key] as string | number | undefined,
      right[effectiveSort.key] as string | number | undefined,
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
  defaultKey: LeaderboardSortKey = "rate",
) {
  return sortRows<RateLeaderboardEntry, LeaderboardSortKey>(rows, sortState, {
    key: defaultKey,
    direction: defaultDirection,
  });
}

function getRoundIncomeSortValue(
  row: RoundIncomeLeaderboardEntry,
  key: RoundIncomeSortKey,
) {
  if (
    key === "pointWin" ||
    key === "dealIn" ||
    key === "selfDraw" ||
    key === "drawnByOthers"
  ) {
    return row[key].income;
  }

  return row[key];
}

export function sortRoundIncomeRows(
  rows: RoundIncomeLeaderboardEntry[],
  sortState: SortState<RoundIncomeSortKey> | null,
) {
  const effectiveSort = sortState ?? {
    key: "roundIncome" as const,
    direction: "desc" as const,
  };

  return [...rows].sort((left, right) => {
    const result = compareValues(
      getRoundIncomeSortValue(left, effectiveSort.key),
      getRoundIncomeSortValue(right, effectiveSort.key),
    );

    if (result !== 0) {
      return effectiveSort.direction === "asc" ? result : -result;
    }

    return left.rank - right.rank;
  });
}
