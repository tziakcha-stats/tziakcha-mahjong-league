import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.join(process.cwd(), "src/features/ranking/components/analysis-panel.tsx"),
  "utf8",
);

test("analysis page heading does not render tab descriptions", () => {
  assert.equal(source.includes("description={config.description}"), false);
});

test("round income table exposes sortable headers", () => {
  const roundIncomeSource = source.slice(
    source.indexOf("function RoundIncomeTable"),
    source.indexOf("function WinDealDiffTable"),
  );

  for (const key of [
    "pointWin",
    "dealIn",
    "selfDraw",
    "drawnByOthers",
    "roundIncome",
    "rounds",
  ]) {
    assert.match(roundIncomeSource, new RegExp(`columnKey="${key}"`));
  }

  assert.match(source, /sortRoundIncomeRows\(leaderboards\.roundIncome, roundIncomeSort\)/);
  assert.match(source, /onSort=\{handleRoundIncomeSort\}/);
});

test("makeup win tab renders four chronological tables", () => {
  assert.match(source, /makeupWin/);
  assert.match(source, /label: "凑番"/);
  assert.match(source, /function MakeupWinTables/);

  for (const title of ["金8", "银8", "铜8", "铁8"]) {
    assert.match(source, new RegExp(`title: "${title}"`));
  }

  for (const header of ["和牌家", "番种说明", "对局"]) {
    assert.match(source, new RegExp(`>${header}<`));
  }
});
