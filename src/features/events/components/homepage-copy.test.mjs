import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const publicHomepageFiles = [
  "src/app/(public)/page.tsx",
  "src/app/(public)/events/page.tsx",
  "src/features/events/components/home-hero.tsx",
  "src/features/events/components/event-overview.tsx",
  "src/features/events/components/public-site-header.tsx",
];

const developmentCopyPatterns = [
  /原型/,
  /壳子/,
  /第一版/,
  /预留/,
  /当前仅/,
  /保留少量/,
  /数据空间/,
  /后续/,
  /mock/,
  /恢复多赛事/,
  /Portal/,
  /Featured Event/,
];

test("public event pages do not expose development-stage wording", () => {
  const violations = [];

  for (const file of publicHomepageFiles) {
    const source = fs.readFileSync(path.join(process.cwd(), file), "utf8");

    for (const pattern of developmentCopyPatterns) {
      if (pattern.test(source)) {
        violations.push(`${file}: ${pattern.source}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});
