import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.join(process.cwd(), "src/features/events/components/team-info-grid.tsx"),
  "utf8",
);

test("team ranking badge does not mark final regular-season ranking as temporary", () => {
  assert.equal(source.includes("暂 #{ranking.rank}"), false);
});

test("team cards mark top six regular-season teams as promoted", () => {
  assert.match(source, /ranking\.rank <= 6/);
  assert.match(source, /晋级/);
});
