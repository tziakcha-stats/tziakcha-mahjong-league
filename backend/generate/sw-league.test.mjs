import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { generateSwLeagueContent } from "../shared/sw-league-generator.mjs";

test("generateSwLeagueContent uses rank csv as authoritative leaderboard source", async () => {
  const result = await generateSwLeagueContent(process.cwd());

  assert.equal(result.leaderboards.huleRate[0].name, "叶凡");
  assert.equal(result.leaderboards.huleRate[0].team, "复仇者联盟");
  assert.equal(result.leaderboards.huleRate[0].rate, 0.304225);
  assert.equal(result.leaderboards.huleRate[0].count, 108);

  assert.equal(result.leaderboards.zimoRate[0].name, "足立レイ");
  assert.equal(result.leaderboards.zimoRate[0].rate, 0.439024);
  assert.equal(result.leaderboards.zimoRate[0].count, 18);

  assert.equal(result.leaderboards.fangchongRate[0].name, "璃茉");
  assert.equal(result.leaderboards.fangchongRate[0].rate, 0.252101);
  assert.equal(result.leaderboards.fangchongRate[0].count, 30);

  assert.equal(result.leaderboards.beizimoRate[0].name, "未有期");
  assert.equal(result.leaderboards.beizimoRate[0].rate, 0.294964);
  assert.equal(result.leaderboards.beizimoRate[0].count, 41);
});

test("generateSwLeagueContent aggregates team summaries from authoritative player stats", async () => {
  const result = await generateSwLeagueContent(process.cwd());
  const team = result.teams.find((entry) => entry.name === "复仇者联盟");

  assert.ok(team);
  assert.equal(team.record, "168 和 / 45 自摸 / 100 放铳 / 124 被自摸");
  assert.match(team.note, /后端生成/);
});

test("generateSwLeagueContent builds recent matches from session history", async () => {
  const result = await generateSwLeagueContent(process.cwd());
  const match = result.matches[0];

  assert.equal(match.id, "vFeupRmM");
  assert.equal(match.roundLabel, "常规赛第 58 轮");
  assert.equal(match.tableName, "B 桌");
  assert.equal(match.finishedAt, "05/09 20:39");
  assert.deepEqual(match.placements, [
    {
      placement: 1,
      team: "复仇者联盟",
      player: "叶凡",
      score: 278,
      scoreLabel: "+278",
    },
    {
      placement: 2,
      team: "择日读",
      player: "CKLm",
      score: 89,
      scoreLabel: "+89",
    },
    {
      placement: 3,
      team: "绿小龙",
      player: "alaya23",
      score: -152,
      scoreLabel: "-152",
    },
    {
      placement: 4,
      team: "自摸七队",
      player: "海仲利安",
      score: -215,
      scoreLabel: "-215",
    },
  ]);
});

test("generateSwLeagueContent calculates overview ranking from session history", async () => {
  const result = await generateSwLeagueContent(process.cwd());

  assert.deepEqual(result.ranking.slice(0, 3), [
    {
      rank: 1,
      name: "叶凡",
      club: "复仇者联盟",
      totalPoints: 1461,
      standardPoints: {
        numerator: 51,
        denominator: 1,
        label: "51",
      },
      averagePlacement: 2.22,
      bonus: 23,
      placementCounts: {
        first: { numerator: 7, denominator: 1, label: "7" },
        second: { numerator: 8, denominator: 1, label: "8" },
        third: { numerator: 7, denominator: 1, label: "7" },
        fourth: { numerator: 1, denominator: 1, label: "1" },
      },
    },
    {
      rank: 2,
      name: "Sw279695293",
      club: "择日读",
      totalPoints: 796,
      standardPoints: {
        numerator: 63,
        denominator: 2,
        label: "31又1/2",
      },
      averagePlacement: 2.25,
      bonus: 14,
      placementCounts: {
        first: { numerator: 6, denominator: 1, label: "6" },
        second: { numerator: 2, denominator: 1, label: "2" },
        third: { numerator: 7, denominator: 2, label: "3又1/2" },
        fourth: { numerator: 5, denominator: 2, label: "2又1/2" },
      },
    },
    {
      rank: 3,
      name: "zsseg",
      club: "杠上开花队",
      totalPoints: 190,
      standardPoints: {
        numerator: 31,
        denominator: 1,
        label: "31",
      },
      averagePlacement: 2.07,
      bonus: 15,
      placementCounts: {
        first: { numerator: 4, denominator: 1, label: "4" },
        second: { numerator: 6, denominator: 1, label: "6" },
        third: { numerator: 3, denominator: 1, label: "3" },
        fourth: { numerator: 2, denominator: 1, label: "2" },
      },
    },
  ]);
});

test("generateSwLeagueContent calculates team overview from player standard points", async () => {
  const result = await generateSwLeagueContent(process.cwd());

  assert.deepEqual(result.teamRanking.slice(0, 3), [
    {
      rank: 1,
      name: "择日读",
      totalPoints: 1220,
      standardPoints: {
        numerator: 191,
        denominator: 2,
        label: "95又1/2",
      },
      averageStandardPoints: 2.12,
      matchCount: 45,
      placementCounts: {
        first: { numerator: 15, denominator: 1, label: "15" },
        second: { numerator: 12, denominator: 1, label: "12" },
        third: { numerator: 23, denominator: 2, label: "11又1/2" },
        fourth: { numerator: 13, denominator: 2, label: "6又1/2" },
      },
    },
    {
      rank: 2,
      name: "绿小龙",
      totalPoints: 1068,
      standardPoints: {
        numerator: 92,
        denominator: 1,
        label: "92",
      },
      averageStandardPoints: 1.96,
      matchCount: 47,
      placementCounts: {
        first: { numerator: 16, denominator: 1, label: "16" },
        second: { numerator: 11, denominator: 1, label: "11" },
        third: { numerator: 6, denominator: 1, label: "6" },
        fourth: { numerator: 14, denominator: 1, label: "14" },
      },
    },
    {
      rank: 3,
      name: "青柠现代麻将文化研究协会",
      totalPoints: -267,
      standardPoints: {
        numerator: 84,
        denominator: 1,
        label: "84",
      },
      averageStandardPoints: 1.87,
      matchCount: 45,
      placementCounts: {
        first: { numerator: 13, denominator: 1, label: "13" },
        second: { numerator: 9, denominator: 1, label: "9" },
        third: { numerator: 14, denominator: 1, label: "14" },
        fourth: { numerator: 9, denominator: 1, label: "9" },
      },
    },
  ]);
});

test("generateSwLeagueContent resolves player aliases before team matching", async () => {
  const result = await generateSwLeagueContent(process.cwd());

  assert.equal(
    result.ranking.some((row) => row.club === "未匹配队伍"),
    false,
  );
  assert.equal(
    result.teamRanking.some((row) => row.name === "未匹配队伍"),
    false,
  );
  assert.equal(
    result.matches.some((match) =>
      match.placements.some((placement) => placement.team === "未匹配队伍"),
    ),
    false,
  );
});

test("generateSwLeagueContent derives aliases from player alias history without alias.json", async () => {
  const sourceRoot = process.cwd();
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "sw-league-alias-"));
  const tempDataRoot = path.join(tempRoot, "data", "sw_league");

  await fs.cp(path.join(sourceRoot, "data", "sw_league"), tempDataRoot, {
    recursive: true,
  });
  await fs.rm(path.join(tempDataRoot, "alias.json"));

  const result = await generateSwLeagueContent(tempRoot);

  assert.equal(
    result.ranking.some((row) => row.club === "未匹配队伍"),
    false,
  );
  assert.ok(result.ranking.some((row) => row.name === "海仲利安"));
  assert.ok(result.ranking.some((row) => row.name === "海叔利安"));
  assert.equal(result.ranking.some((row) => row.name === "世界第一"), false);
  assert.equal(result.ranking.some((row) => row.name === "凛津"), false);
});

test("generateSwLeagueContent splits standard points and placement counts on ties", async () => {
  const result = await generateSwLeagueContent(process.cwd());
  const sw279695293 = result.ranking.find((row) => row.name === "Sw279695293");

  assert.ok(sw279695293);
  assert.equal(sw279695293.standardPoints.label, "31又1/2");
  assert.equal(sw279695293.placementCounts.third.label, "3又1/2");
  assert.equal(sw279695293.placementCounts.fourth.label, "2又1/2");
});
