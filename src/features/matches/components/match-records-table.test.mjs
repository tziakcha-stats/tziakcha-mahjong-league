import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const source = readFileSync(
  path.join(currentDir, "match-records-table.tsx"),
  "utf8",
);

test("match placement cells render player name before team name", () => {
  assert.ok(
    source.indexOf("{placement.player}") < source.indexOf("{placement.team}"),
  );
});

test("match records table exposes filtering, official links, and pagination controls", () => {
  assert.match(source, /title="所有对局记录"/);
  assert.match(source, /全部玩家/);
  assert.match(source, /全部队伍/);
  assert.match(source, /PAGE_SIZE = 20/);
  assert.match(source, /match\.replayUrl/);
  assert.match(source, /链接/);
  assert.match(source, /text-blue-600/);
  assert.match(source, /underline/);
  assert.match(source, /没有符合筛选条件的对局记录。/);
});

test("match records table dims non-matching placement cells while filters are active", () => {
  assert.match(source, /isFilterActive/);
  assert.match(source, /isPlacementHighlighted/);
  assert.match(source, /opacity-45/);
  assert.match(source, /after:absolute/);
  assert.match(source, /after:bg-gray-100\/35/);
});
