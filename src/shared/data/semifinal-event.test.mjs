import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const semifinalSlug = "sdu-mcr-team-semifinal";

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), relativePath), "utf8"));
}

test("semifinal event is listed and registered in the repository", () => {
  const events = readJson("content/events/index.json");
  const repositorySource = fs.readFileSync(
    path.join(process.cwd(), "src/shared/data/repositories.ts"),
    "utf8",
  );

  assert.ok(events.some((event) => event.slug === semifinalSlug));
  assert.match(repositorySource, new RegExp(`"${semifinalSlug}"`));
});

test("semifinal starts with top six regular-season teams and adjusted carry-over scores", () => {
  const teams = readJson(path.join("content/events", semifinalSlug, "teams.json"));
  const ranking = readJson(path.join("content/events", semifinalSlug, "team-ranking.json"));

  assert.deepEqual(
    teams.map((team) => team.name),
    [
      "择日读",
      "绿小龙",
      "青柠现代麻将文化研究协会",
      "复仇者联盟",
      "小鲨鱼动物园",
      "特邀——没上过沙袋",
    ],
  );

  assert.deepEqual(
    ranking.map((team) => ({
      name: team.name,
      standardPoints: team.standardPoints.label,
      totalPoints: team.totalPoints,
      record: team.record,
    })),
    [
      { name: "择日读", standardPoints: "107又1/2", totalPoints: 1692, record: "常规赛战绩" },
      { name: "绿小龙", standardPoints: "95", totalPoints: 1119, record: "常规赛战绩" },
      {
        name: "青柠现代麻将文化研究协会",
        standardPoints: "92",
        totalPoints: 30,
        record: "常规赛战绩",
      },
      { name: "复仇者联盟", standardPoints: "88又1/2", totalPoints: 924, record: "常规赛战绩" },
      { name: "小鲨鱼动物园", standardPoints: "87又1/2", totalPoints: 350, record: "常规赛战绩" },
      {
        name: "特邀——没上过沙袋",
        standardPoints: "87",
        totalPoints: 183,
        record: "常规赛战绩",
      },
    ],
  );
});

test("semifinal schedule has fifteen rounds with two games per round", () => {
  const events = readJson("content/events/index.json");
  const event = events.find((entry) => entry.slug === semifinalSlug);
  const schedule = readJson(path.join("content/events", semifinalSlug, "schedule.json"));

  assert.equal(event.startDate, "2026.05.12");
  assert.equal(event.endDate, "2026.06.06");
  assert.equal(event.rounds, 30);
  assert.equal(schedule.length, 15);

  for (const [index, round] of schedule.entries()) {
    assert.equal(round.id, `semifinal-round-${index + 1}`);
    assert.equal(round.stage, "半决赛");
    assert.equal(round.title, `半决赛第 ${index + 1} 轮`);
    assert.match(round.summary, /本轮进行 2 局/);
    assert.match(round.summary, /轮空：/);
    assert.equal(round.tables.length, 2);

    for (const [gameIndex, table] of round.tables.entries()) {
      assert.equal(table.id, `semifinal-round-${index + 1}-game-${gameIndex + 1}`);
      assert.equal(table.tableName, `第 ${gameIndex + 1} 局`);
      assert.equal(table.teams.length, 4);
    }
  }
});

test("semifinal rules summarize the updated stage-specific rulebook", () => {
  const rules = readJson(path.join("content/events", semifinalSlug, "rules.json"));
  const summary = rules.join("\n");

  assert.ok(rules.length >= 8);
  assert.match(summary, /中国麻将竞赛规则（试行，1998）/);
  assert.match(summary, /国标麻将（MCR）规则补充细则（试行，2025）/);
  assert.match(summary, /半决赛共 15 个比赛日/);
  assert.match(summary, /共 30 局/);
  assert.match(summary, /前 4/);
  assert.match(summary, /晋级决赛/);
  assert.match(summary, /半决赛分数带入决赛/);
  assert.match(summary, /最低登场数为 3 次/);
  assert.match(summary, /迟到 6-10 分钟罚 1 标准分/);
  assert.match(summary, /无法参赛挂摸切并额外罚 4 标准分/);
});
