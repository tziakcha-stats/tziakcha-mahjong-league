const stringCollator = new Intl.Collator("zh-Hans-CN", {
  numeric: true,
  sensitivity: "base",
});

export function getNextSortState(currentSort, key) {
  if (!currentSort || currentSort.key !== key) {
    return { key, direction: "asc" };
  }

  if (currentSort.direction === "asc") {
    return { key, direction: "desc" };
  }

  return null;
}

function compareValues(leftValue, rightValue) {
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

function sortRows(rows, sortState, defaultState) {
  const effectiveSort = sortState ?? defaultState;

  return [...rows].sort((left, right) => {
    const result = compareValues(left[effectiveSort.key], right[effectiveSort.key]);

    if (result !== 0) {
      return effectiveSort.direction === "asc" ? result : -result;
    }

    return left.rank - right.rank;
  });
}

function getRankingSortValue(row, key) {
  if (key === "standardPoints") {
    return row.adjustedStandardPoints.numerator / row.adjustedStandardPoints.denominator;
  }

  return row[key];
}

export function sortRankingRows(rows, sortState) {
  const effectiveSort = sortState ?? { key: "standardPoints", direction: "desc" };

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
  rows,
  sortState,
  defaultDirection,
  defaultKey = "rate",
) {
  return sortRows(rows, sortState, { key: defaultKey, direction: defaultDirection });
}

function getRoundIncomeSortValue(row, key) {
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

export function sortRoundIncomeRows(rows, sortState) {
  const effectiveSort = sortState ?? { key: "roundIncome", direction: "desc" };

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
