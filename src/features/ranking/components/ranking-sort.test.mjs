import test from "node:test";
import assert from "node:assert/strict";

import {
  getNextSortState,
  sortLeaderboardRows,
  sortRankingRows,
} from "./ranking-sort.mjs";

const rankingRows = [
  {
    rank: 1,
    name: "Charlie",
    club: "Club B",
    totalPoints: 30,
    standardPoints: { numerator: 5, denominator: 1, label: "5" },
    adjustedStandardPoints: { numerator: 5, denominator: 1, label: "5" },
    averagePlacement: 2.1,
    bonus: 5,
  },
  {
    rank: 2,
    name: "Alice",
    club: "Club A",
    totalPoints: 50,
    standardPoints: { numerator: 8, denominator: 1, label: "8" },
    adjustedStandardPoints: { numerator: 6, denominator: 1, label: "6" },
    averagePlacement: 1.8,
    bonus: 3,
  },
  {
    rank: 3,
    name: "Bob",
    club: "Club C",
    totalPoints: 40,
    standardPoints: { numerator: 7, denominator: 1, label: "7" },
    adjustedStandardPoints: { numerator: 7, denominator: 1, label: "7" },
    averagePlacement: 2.4,
    bonus: 8,
  },
];

const leaderboardRows = [
  { rank: 1, name: "Charlie", team: "Team B", rate: 0.3, count: 2, note: "20 局样本" },
  { rank: 2, name: "Alice", team: "Team A", rate: 0.5, count: 4, note: "16 局样本" },
  { rank: 3, name: "Bob", team: "Team C", rate: 0.4, count: 3, note: "12 局样本" },
];

test("getNextSortState cycles from default to ascending, descending, then default", () => {
  assert.deepEqual(getNextSortState(null, "totalPoints"), {
    key: "totalPoints",
    direction: "asc",
  });
  assert.deepEqual(
    getNextSortState({ key: "totalPoints", direction: "asc" }, "totalPoints"),
    { key: "totalPoints", direction: "desc" },
  );
  assert.equal(
    getNextSortState({ key: "totalPoints", direction: "desc" }, "totalPoints"),
    null,
  );
});

test("getNextSortState starts ascending when switching columns", () => {
  assert.deepEqual(
    getNextSortState({ key: "totalPoints", direction: "desc" }, "name"),
    { key: "name", direction: "asc" },
  );
});

test("sortRankingRows restores the penalty-adjusted standard point order without changing rank values", () => {
  const sortedRows = sortRankingRows(rankingRows, null);

  assert.deepEqual(
    sortedRows.map((row) => `${row.rank}:${row.name}`),
    ["3:Bob", "2:Alice", "1:Charlie"],
  );
});

test("sortRankingRows sorts by a clicked field and keeps original rank values", () => {
  const sortedRows = sortRankingRows(rankingRows, {
    key: "totalPoints",
    direction: "asc",
  });

  assert.deepEqual(
    sortedRows.map((row) => `${row.rank}:${row.name}`),
    ["1:Charlie", "3:Bob", "2:Alice"],
  );
});

test("sortLeaderboardRows uses the supplied default direction for rate leaderboards", () => {
  const defaultDescendingRows = sortLeaderboardRows(leaderboardRows, null, "desc");
  const defaultAscendingRows = sortLeaderboardRows(leaderboardRows, null, "asc");

  assert.deepEqual(
    defaultDescendingRows.map((row) => row.name),
    ["Alice", "Bob", "Charlie"],
  );
  assert.deepEqual(
    defaultAscendingRows.map((row) => row.name),
    ["Charlie", "Bob", "Alice"],
  );
});

test("sortLeaderboardRows can sort text fields ascending", () => {
  const sortedRows = sortLeaderboardRows(
    leaderboardRows,
    { key: "team", direction: "asc" },
    "desc",
  );

  assert.deepEqual(
    sortedRows.map((row) => `${row.rank}:${row.name}`),
    ["2:Alice", "1:Charlie", "3:Bob"],
  );
});
