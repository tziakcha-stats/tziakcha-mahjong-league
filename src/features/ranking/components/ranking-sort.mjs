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

export function sortRankingRows(rows, sortState) {
  return sortRows(rows, sortState, { key: "totalPoints", direction: "desc" });
}

export function sortLeaderboardRows(rows, sortState, defaultDirection) {
  return sortRows(rows, sortState, { key: "rate", direction: defaultDirection });
}
