import test from "node:test";
import assert from "node:assert/strict";

import {
  getNextSortState,
  sortRoundIncomeRows,
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

test("sortLeaderboardRows can sort optional related rate fields", () => {
  const rows = [
    { ...leaderboardRows[0], relatedRate: 0.2 },
    { ...leaderboardRows[1], relatedRate: 0.4 },
    leaderboardRows[2],
  ];
  const sortedRows = sortLeaderboardRows(
    rows,
    { key: "relatedRate", direction: "desc" },
    "desc",
  );

  assert.deepEqual(
    sortedRows.map((row) => row.name),
    ["Alice", "Charlie", "Bob"],
  );
});

test("sortLeaderboardRows can default-sort rate difference fields descending", () => {
  const rows = [
    { ...leaderboardRows[0], rateDiff: 0.1 },
    { ...leaderboardRows[1], rateDiff: 0.3 },
    { ...leaderboardRows[2], rateDiff: -0.1 },
  ];
  const sortedRows = sortLeaderboardRows(rows, null, "desc", "rateDiff");

  assert.deepEqual(
    sortedRows.map((row) => row.name),
    ["Alice", "Charlie", "Bob"],
  );
});

test("sortRoundIncomeRows can sort income module values and restore round income default", () => {
  const rows = [
    {
      rank: 1,
      name: "Charlie",
      team: "Team B",
      rounds: 20,
      pointWin: { income: 100, averageFan: 16, count: 4 },
      dealIn: { income: -20, averageFan: 12, count: 1 },
      selfDraw: { income: 60, averageFan: 12, count: 1 },
      drawnByOthers: { income: -30, averageFan: 10, count: 2 },
      roundIncome: 5,
    },
    {
      rank: 2,
      name: "Alice",
      team: "Team A",
      rounds: 16,
      pointWin: { income: 80, averageFan: 20, count: 2 },
      dealIn: { income: -50, averageFan: 17, count: 2 },
      selfDraw: { income: 100, averageFan: 13, count: 2 },
      drawnByOthers: { income: -10, averageFan: 9, count: 1 },
      roundIncome: 8,
    },
  ];

  assert.deepEqual(
    sortRoundIncomeRows(rows, null).map((row) => row.name),
    ["Alice", "Charlie"],
  );
  assert.deepEqual(
    sortRoundIncomeRows(rows, { key: "pointWin", direction: "asc" }).map(
      (row) => row.name,
    ),
    ["Alice", "Charlie"],
  );
});
