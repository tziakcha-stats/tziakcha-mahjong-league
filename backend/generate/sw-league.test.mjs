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

test("generateSwLeagueContent calculates average win and deal-in fan leaderboards", async () => {
  const result = await generateSwLeagueContent(process.cwd());

  assert.equal(result.leaderboards.averageWinFan[0].name, "histo");
  assert.equal(result.leaderboards.averageWinFan[0].team, "杠上开花队");
  assert.equal(result.leaderboards.averageWinFan[0].rate, 23.666667);
  assert.equal(result.leaderboards.averageWinFan[0].count, 104);
  assert.match(result.leaderboards.averageWinFan[0].note, /18 次和牌/);
  assert.match(result.leaderboards.averageWinFan[0].note, /总番数 426/);

  assert.equal(result.leaderboards.averageDealInFan[0].name, "青火");
  assert.equal(result.leaderboards.averageDealInFan[0].team, "复仇者联盟");
  assert.equal(result.leaderboards.averageDealInFan[0].rate, 20.333333);
  assert.equal(result.leaderboards.averageDealInFan[0].count, 102);
  assert.match(result.leaderboards.averageDealInFan[0].note, /15 次点炮/);
  assert.match(result.leaderboards.averageDealInFan[0].note, /总番数 305/);
});

test("generateSwLeagueContent calculates win-deal rate difference leaderboard", async () => {
  const result = await generateSwLeagueContent(process.cwd());
  const firstRow = result.leaderboards.winDealDiff[0];

  assert.equal(firstRow.rank, 1);
  assert.equal(firstRow.name, "三只大土鳖");
  assert.equal(firstRow.team, "小鲨鱼动物园");
  assert.equal(firstRow.rate, 0.286885);
  assert.equal(firstRow.dealInRate, 0.131148);
  assert.equal(firstRow.rateDiff, 0.155737);
  assert.equal(firstRow.count, 122);
  assert.match(firstRow.note, /和牌率 28\.7%/);
  assert.match(firstRow.note, /放铳率 13\.1%/);

  assert.ok(
    result.leaderboards.winDealDiff.every((row, index, rows) => {
      const previous = rows[index - 1];
      return index === 0 || previous.rateDiff >= row.rateDiff;
    }),
  );
});

test("generateSwLeagueContent calculates average flower and tsumo-loss fan leaderboards", async () => {
  const result = await generateSwLeagueContent(process.cwd());
  const flowerRow = result.leaderboards.averageFlower[0];
  const tsumoLossRow = result.leaderboards.averageTsumoLossFan[0];

  assert.equal(flowerRow.rank, 1);
  assert.equal(flowerRow.name, "海仲利安");
  assert.equal(flowerRow.team, "自摸七队");
  assert.equal(flowerRow.rate, 1.869565);
  assert.equal(flowerRow.count, 222);
  assert.match(flowerRow.note, /46 次和牌/);
  assert.match(flowerRow.note, /总花牌 86/);

  assert.equal(tsumoLossRow.rank, 1);
  assert.equal(tsumoLossRow.name, "吴下阿濛");
  assert.equal(tsumoLossRow.team, "绿小龙");
  assert.equal(tsumoLossRow.rate, 12.259259);
  assert.equal(tsumoLossRow.count, 139);
  assert.match(tsumoLossRow.note, /27 次被摸/);
  assert.match(tsumoLossRow.note, /被摸总番数 331/);

  assert.ok(
    result.leaderboards.averageFlower.every((row, index, rows) => {
      const previous = rows[index - 1];
      return index === 0 || previous.rate >= row.rate;
    }),
  );
  assert.ok(
    result.leaderboards.averageTsumoLossFan.every((row, index, rows) => {
      const previous = rows[index - 1];
      return index === 0 || previous.rate <= row.rate;
    }),
  );
});

test("generateSwLeagueContent builds big win leaderboard from detailed records", async () => {
  const result = await generateSwLeagueContent(process.cwd());

  assert.equal(result.leaderboards.bigWin.length, 20);
  assert.ok(
    result.leaderboards.bigWin.every((row, index, rows) => {
      const previous = rows[index - 1];
      return !previous || previous.totalFan >= row.totalFan;
    }),
  );

  const firstRow = result.leaderboards.bigWin[0];
  assert.equal(firstRow.rank, 1);
  assert.equal(firstRow.totalFan, 136);
  assert.equal(firstRow.winner, "histo");
  assert.equal(firstRow.winnerTeam, "杠上开花队");
  assert.equal(firstRow.discarder, "zumgze");
  assert.equal(firstRow.description, "小四喜、字一色");
  assert.equal(firstRow.roundLabel, "常规赛第 32 轮");
  assert.equal(firstRow.tableName, "B 桌");
  assert.equal(firstRow.replayUrl, "https://tziakcha.net/game/?id=C2LL4QMc");
  assert.equal(firstRow.recordId, "aoEiuDQ9");

  const selfDrawRow = result.leaderboards.bigWin.find((row) => row.selfDraw);
  assert.ok(selfDrawRow);
  assert.equal(selfDrawRow.discarder, "自摸");

  assert.ok(
    result.leaderboards.bigWin.every((row) =>
      row.fanItems.every((fanItem) => fanItem.unitFan >= 8),
    ),
  );
});

test("generateSwLeagueContent builds makeup win leaderboards from detailed records", async () => {
  const result = await generateSwLeagueContent(process.cwd());
  const makeupWin = result.leaderboards.makeupWin;

  assert.deepEqual(Object.keys(makeupWin), ["gold", "silver", "bronze", "iron"]);

  for (const rows of Object.values(makeupWin)) {
    assert.ok(
      rows.every((row, index) => {
        const previous = rows[index - 1];

        return (
          row.maxUnitFan <= 2 &&
          row.twoFanItems.length === row.twoFanCount &&
          (!previous ||
            previous.finishedAt < row.finishedAt ||
            (previous.finishedAt === row.finishedAt &&
              previous.roundNo <= row.roundNo))
        );
      }),
    );
  }

  assert.ok(makeupWin.silver.length > 0);
  assert.ok(makeupWin.bronze.length > 0);
  assert.ok(makeupWin.iron.length > 0);
  assert.equal(makeupWin.gold.length, 0);
  assert.ok(
    makeupWin.gold.every((row) =>
      row.description === "金I" || row.description === "金II",
    ),
  );
  assert.ok(makeupWin.silver.every((row) => row.twoFanCount === 1));
  assert.ok(makeupWin.bronze.every((row) => row.twoFanCount === 2));
  assert.ok(makeupWin.iron.every((row) => row.twoFanCount >= 3));
  assert.equal(makeupWin.silver[0].description, "双同刻");
  assert.match(makeupWin.iron[0].description, /门前清、平和、断幺/);
});

test("generateSwLeagueContent calculates round income leaderboard modules per round", async () => {
  const result = await generateSwLeagueContent(process.cwd());

  assert.ok(result.leaderboards.roundIncome.length > 0);
  assert.ok(
    result.leaderboards.roundIncome.every((row, index, rows) => {
      const previous = rows[index - 1];
      return !previous || previous.roundIncome >= row.roundIncome;
    }),
  );

  const firstRow = result.leaderboards.roundIncome[0];
  assert.equal(firstRow.rank, 1);
  assert.equal(firstRow.name, "吴下阿濛");
  assert.equal(firstRow.team, "绿小龙");
  assert.equal(firstRow.rounds, 139);
  assert.equal(firstRow.pointWin.count, 29);
  assert.equal(firstRow.dealIn.count, 20);
  assert.equal(firstRow.selfDraw.count, 12);
  assert.equal(firstRow.drawnByOthers.count, 27);
  assert.equal(firstRow.pointWin.income, 1164);
  assert.equal(firstRow.dealIn.income, -459);
  assert.equal(firstRow.selfDraw.income, 807);
  assert.equal(firstRow.drawnByOthers.income, -547);
  assert.equal(firstRow.roundIncome, 6.942446);
});

test("generateSwLeagueContent aggregates team summaries from authoritative player stats", async () => {
  const result = await generateSwLeagueContent(process.cwd());
  const team = result.teams.find((entry) => entry.name === "复仇者联盟");

  assert.ok(team);
  assert.equal(team.record, "168 和 / 45 自摸 / 100 放铳 / 124 被自摸");
  assert.match(team.note, /后端生成/);
});

test("generateSwLeagueContent builds all matches from session history", async () => {
  const result = await generateSwLeagueContent(process.cwd());
  const match = result.matches[0];

  assert.equal(result.matches.length, 117);
  assert.equal(result.matches.some((entry) => entry.id === "ArxJNC5N"), false);
  assert.equal(match.id, "offline-r60-a");
  assert.equal(match.replayUrl, undefined);
  assert.equal(match.round, 60);
  assert.equal(match.roundLabel, "常规赛第 60 轮");
  assert.equal(match.tableName, "A 桌");
  assert.equal(match.finishedAt, "济南线下");
  assert.deepEqual(match.placements, [
    {
      placement: 1,
      team: "择日读",
      player: "Sw279695293",
      score: 146,
      scoreLabel: "+146",
    },
    {
      placement: 2,
      team: "云上秋雨",
      player: "琳雨空",
      score: 55,
      scoreLabel: "+55",
    },
    {
      placement: 3,
      team: "特邀——没上过沙袋",
      player: "Quandaiwu42",
      score: 42,
      scoreLabel: "+42",
    },
    {
      placement: 4,
      team: "自摸七队",
      player: "小黄鸭",
      score: -243,
      scoreLabel: "-243",
    },
  ]);

  assert.deepEqual(
    result.matches.slice(0, 4).map((entry) => entry.round),
    [60, 58, 58, 57],
  );
  assert.equal(result.matches[1].roundLabel, "常规赛第 58 轮");
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
      standardPointPenalty: {
        numerator: 0,
        denominator: 1,
        label: "0",
      },
      adjustedStandardPoints: {
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
      totalPoints: 1268,
      standardPoints: {
        numerator: 87,
        denominator: 2,
        label: "43又1/2",
      },
      standardPointPenalty: {
        numerator: 0,
        denominator: 1,
        label: "0",
      },
      adjustedStandardPoints: {
        numerator: 87,
        denominator: 2,
        label: "43又1/2",
      },
      averagePlacement: 2.56,
      bonus: 17,
      placementCounts: {
        first: { numerator: 9, denominator: 1, label: "9" },
        second: { numerator: 2, denominator: 1, label: "2" },
        third: { numerator: 7, denominator: 2, label: "3又1/2" },
        fourth: { numerator: 5, denominator: 2, label: "2又1/2" },
      },
    },
    {
      rank: 3,
      name: "琳雨空",
      club: "云上秋雨",
      totalPoints: 536,
      standardPoints: {
        numerator: 36,
        denominator: 1,
        label: "36",
      },
      standardPointPenalty: {
        numerator: 0,
        denominator: 1,
        label: "0",
      },
      adjustedStandardPoints: {
        numerator: 36,
        denominator: 1,
        label: "36",
      },
      averagePlacement: 2.12,
      bonus: 17,
      placementCounts: {
        first: { numerator: 6, denominator: 1, label: "6" },
        second: { numerator: 3, denominator: 1, label: "3" },
        third: { numerator: 6, denominator: 1, label: "6" },
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
      totalPoints: 1692,
      standardPoints: {
        numerator: 215,
        denominator: 2,
        label: "107又1/2",
      },
      standardPointPenalty: {
        numerator: 0,
        denominator: 1,
        label: "0",
      },
      adjustedStandardPoints: {
        numerator: 215,
        denominator: 2,
        label: "107又1/2",
      },
      averageStandardPoints: 2.24,
      matchCount: 48,
      placementCounts: {
        first: { numerator: 18, denominator: 1, label: "18" },
        second: { numerator: 12, denominator: 1, label: "12" },
        third: { numerator: 23, denominator: 2, label: "11又1/2" },
        fourth: { numerator: 13, denominator: 2, label: "6又1/2" },
      },
    },
    {
      rank: 2,
      name: "绿小龙",
      totalPoints: 1130,
      standardPoints: {
        numerator: 91,
        denominator: 1,
        label: "91",
      },
      standardPointPenalty: {
        numerator: 0,
        denominator: 1,
        label: "0",
      },
      adjustedStandardPoints: {
        numerator: 91,
        denominator: 1,
        label: "91",
      },
      averageStandardPoints: 1.98,
      matchCount: 46,
      placementCounts: {
        first: { numerator: 16, denominator: 1, label: "16" },
        second: { numerator: 11, denominator: 1, label: "11" },
        third: { numerator: 5, denominator: 1, label: "5" },
        fourth: { numerator: 14, denominator: 1, label: "14" },
      },
    },
    {
      rank: 3,
      name: "青柠现代麻将文化研究协会",
      totalPoints: -309,
      standardPoints: {
        numerator: 89,
        denominator: 1,
        label: "89",
      },
      standardPointPenalty: {
        numerator: 1,
        denominator: 1,
        label: "1",
      },
      adjustedStandardPoints: {
        numerator: 88,
        denominator: 1,
        label: "88",
      },
      averageStandardPoints: 1.89,
      matchCount: 47,
      placementCounts: {
        first: { numerator: 14, denominator: 1, label: "14" },
        second: { numerator: 9, denominator: 1, label: "9" },
        third: { numerator: 15, denominator: 1, label: "15" },
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
  assert.equal(sw279695293.standardPoints.label, "43又1/2");
  assert.equal(sw279695293.placementCounts.third.label, "3又1/2");
  assert.equal(sw279695293.placementCounts.fourth.label, "2又1/2");
});

test("generateSwLeagueContent applies player penalties for ranking without changing averages", async () => {
  const result = await generateSwLeagueContent(process.cwd());
  const qinNai = result.ranking.find((row) => row.name === "QinNai");

  assert.ok(qinNai);
  assert.equal(qinNai.standardPoints.label, "12");
  assert.equal(qinNai.standardPointPenalty.label, "2");
  assert.equal(qinNai.adjustedStandardPoints.label, "10");
  assert.equal(qinNai.averagePlacement, 1.2);
});

test("generateSwLeagueContent applies team and player penalties to team ranking only", async () => {
  const result = await generateSwLeagueContent(process.cwd());
  const yunshangQiuyu = result.teamRanking.find((row) => row.name === "云上秋雨");
  const huluhulu = result.teamRanking.find((row) => row.name === "呼噜呼噜哼🐷");

  assert.ok(yunshangQiuyu);
  assert.equal(yunshangQiuyu.standardPoints.label, "88");
  assert.equal(yunshangQiuyu.standardPointPenalty.label, "3");
  assert.equal(yunshangQiuyu.adjustedStandardPoints.label, "85");
  assert.equal(yunshangQiuyu.averageStandardPoints, 1.87);

  assert.ok(huluhulu);
  assert.equal(huluhulu.standardPointPenalty.label, "4");
});

test("generateSwLeagueContent includes offline scores in ranking without changing analysis leaderboards", async () => {
  const result = await generateSwLeagueContent(process.cwd());
  const sw279695293 = result.ranking.find((row) => row.name === "Sw279695293");
  const team = result.teamRanking.find((row) => row.name === "择日读");

  assert.ok(sw279695293);
  assert.equal(sw279695293.standardPoints.label, "43又1/2");
  assert.equal(sw279695293.totalPoints, 1268);
  assert.equal(sw279695293.bonus, 17);

  assert.ok(team);
  assert.equal(team.standardPoints.label, "107又1/2");
  assert.equal(team.matchCount, 48);

  assert.equal(result.leaderboards.averageWinFan[0].count, 104);
  assert.equal(result.leaderboards.roundIncome[0].rounds, 139);
});
