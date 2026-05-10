import test from "node:test";
import assert from "node:assert/strict";

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
