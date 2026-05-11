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

  assert.equal(result.leaderboards.averageDealInFan[0].name, "钙热");
  assert.equal(result.leaderboards.averageDealInFan[0].team, "特邀——没上过沙袋");
  assert.equal(result.leaderboards.averageDealInFan[0].rate, 19.703704);
  assert.equal(result.leaderboards.averageDealInFan[0].count, 128);
  assert.match(result.leaderboards.averageDealInFan[0].note, /27 次点炮/);
  assert.match(result.leaderboards.averageDealInFan[0].note, /总番数 532/);
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
  assert.equal(tsumoLossRow.rate, 12.53125);
  assert.equal(tsumoLossRow.count, 155);
  assert.match(tsumoLossRow.note, /32 次被摸/);
  assert.match(tsumoLossRow.note, /被摸总番数 401/);

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
  assert.equal(firstRow.name, "叶凡");
  assert.equal(firstRow.team, "复仇者联盟");
  assert.equal(firstRow.rounds, 355);
  assert.equal(firstRow.pointWin.count, 74);
  assert.equal(firstRow.dealIn.count, 58);
  assert.equal(firstRow.selfDraw.count, 34);
  assert.equal(firstRow.drawnByOthers.count, 65);
  assert.equal(firstRow.pointWin.income, 2962);
  assert.equal(firstRow.dealIn.income, -1360);
  assert.equal(firstRow.selfDraw.income, 2364);
  assert.equal(firstRow.drawnByOthers.income, -1577);
  assert.equal(firstRow.roundIncome, 6.729577);
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

  assert.equal(result.matches.length, 120);
  assert.equal(result.matches.some((entry) => entry.id === "ArxJNC5N"), false);
  assert.equal(match.id, "Hxu1Bkm6");
  assert.equal(match.replayUrl, "https://tziakcha.net/game/?id=Hxu1Bkm6");
  assert.equal(match.round, 60);
  assert.equal(match.roundLabel, "常规赛第 60 轮");
  assert.equal(match.tableName, "B 桌");
  assert.equal(match.finishedAt, "05/10 20:50");
  assert.deepEqual(match.placements, [
    {
      placement: 1,
      team: "杠上开花队",
      player: "zsseg",
      score: 161,
      scoreLabel: "+161",
    },
    {
      placement: 2,
      team: "小鲨鱼动物园",
      player: "lidai",
      score: 65,
      scoreLabel: "+65",
    },
    {
      placement: 3,
      team: "呼噜呼噜哼🐷",
      player: "幻秋",
      score: -94,
      scoreLabel: "-94",
    },
    {
      placement: 4,
      team: "绿小龙",
      player: "吴下阿濛",
      score: -132,
      scoreLabel: "-132",
    },
  ]);

  assert.deepEqual(
    result.matches.slice(0, 4).map((entry) => entry.round),
    [60, 60, 59, 59],
  );
  assert.equal(result.matches[1].roundLabel, "常规赛第 60 轮");
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
      name: "zumgze",
      club: "青柠现代麻将文化研究协会",
      totalPoints: 555,
      standardPoints: {
        numerator: 40,
        denominator: 1,
        label: "40",
      },
      standardPointPenalty: {
        numerator: 0,
        denominator: 1,
        label: "0",
      },
      adjustedStandardPoints: {
        numerator: 40,
        denominator: 1,
        label: "40",
      },
      averagePlacement: 2.35,
      bonus: 17,
      placementCounts: {
        first: { numerator: 8, denominator: 1, label: "8" },
        second: { numerator: 2, denominator: 1, label: "2" },
        third: { numerator: 4, denominator: 1, label: "4" },
        fourth: { numerator: 3, denominator: 1, label: "3" },
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
      totalPoints: 1119,
      standardPoints: {
        numerator: 95,
        denominator: 1,
        label: "95",
      },
      standardPointPenalty: {
        numerator: 0,
        denominator: 1,
        label: "0",
      },
      adjustedStandardPoints: {
        numerator: 95,
        denominator: 1,
        label: "95",
      },
      averageStandardPoints: 1.98,
      matchCount: 48,
      placementCounts: {
        first: { numerator: 17, denominator: 1, label: "17" },
        second: { numerator: 11, denominator: 1, label: "11" },
        third: { numerator: 5, denominator: 1, label: "5" },
        fourth: { numerator: 15, denominator: 1, label: "15" },
      },
    },
    {
      rank: 3,
      name: "青柠现代麻将文化研究协会",
      totalPoints: 30,
      standardPoints: {
        numerator: 93,
        denominator: 1,
        label: "93",
      },
      standardPointPenalty: {
        numerator: 1,
        denominator: 1,
        label: "1",
      },
      adjustedStandardPoints: {
        numerator: 92,
        denominator: 1,
        label: "92",
      },
      averageStandardPoints: 1.94,
      matchCount: 48,
      placementCounts: {
        first: { numerator: 15, denominator: 1, label: "15" },
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
  assert.equal(yunshangQiuyu.standardPointPenalty.label, "7");
  assert.equal(yunshangQiuyu.adjustedStandardPoints.label, "81");
  assert.equal(yunshangQiuyu.averageStandardPoints, 1.83);

  assert.ok(huluhulu);
  assert.equal(huluhulu.standardPointPenalty.label, "4");
});

test("generateSwLeagueContent applies new player penalties in ranking", async () => {
  const result = await generateSwLeagueContent(process.cwd());
  const chuanShangYao = result.ranking.find((row) => row.name === "川上珧");

  assert.ok(chuanShangYao);
  assert.equal(chuanShangYao.standardPoints.label, "12");
  assert.equal(chuanShangYao.standardPointPenalty.label, "2");
  assert.equal(chuanShangYao.adjustedStandardPoints.label, "10");
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
  assert.equal(result.leaderboards.roundIncome[0].rounds, 355);
});
