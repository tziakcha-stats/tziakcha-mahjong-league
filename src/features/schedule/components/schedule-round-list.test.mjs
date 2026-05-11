import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.join(process.cwd(), "src/features/schedule/components/schedule-round-list.tsx"),
  "utf8",
);

test("schedule list renders actual table matchups when present", () => {
  assert.match(source, /round\.tables/);
  assert.match(source, /table\.tableName/);
  assert.match(source, /table\.teams\.map/);
  assert.match(source, /getTeamColor\(team\)/);
  assert.doesNotMatch(source, /table\.teams\.join\(" \/ "\)/);
  assert.match(source, /table\.replayUrl/);
});

test("semifinal schedule uses game labels instead of hand labels", () => {
  const schedule = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), "content/events/sdu-mcr-team-semifinal/schedule.json"),
      "utf8",
    ),
  );

  assert.ok(schedule.length > 0);
  assert.equal(schedule[0].tables[0].tableName, "第 1 局");
  assert.equal(schedule[0].tables[1].tableName, "第 2 局");
  assert.ok(
    schedule.every((round) =>
      round.tables.every((table) => !table.tableName.includes("把")),
    ),
  );
});

test("schedule list heading follows the current schedule stage", () => {
  assert.doesNotMatch(source, /常规赛实际对局日程/);
  assert.match(source, /currentStage/);
  assert.match(source, /\$\{currentStage\}实际对局日程/);
});
