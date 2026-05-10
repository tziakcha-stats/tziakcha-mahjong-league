import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const source = readFileSync(path.join(currentDir, "ranking-panel.tsx"), "utf8");

function getColumnBlock(name) {
  const start = source.indexOf(`const ${name}`);
  const plainEnd = source.indexOf("];", start);
  const constEnd = source.indexOf("] as const;", start);
  const end = [plainEnd, constEnd]
    .filter((index) => index !== -1)
    .sort((left, right) => left - right)[0];

  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  return source.slice(start, end);
}

function assertOrder(text, labels) {
  const indexes = labels.map((label) => text.indexOf(`label: "${label}"`));

  for (const index of indexes) {
    assert.notEqual(index, -1);
  }

  assert.deepEqual(indexes, [...indexes].sort((left, right) => left - right));
}

test("ranking tables use requested score column order", () => {
  assertOrder(getColumnBlock("rankingColumns"), [
    "标准分",
    "比赛分",
    "平均标准分",
  ]);
  assertOrder(getColumnBlock("teamRankingColumns"), [
    "标准分",
    "比赛分",
    "平均标准分",
  ]);
});

test("ranking panel explains penalty notation briefly", () => {
  assert.match(source, /括号前为未扣罚的标准分，括号内为罚分。/);
});
