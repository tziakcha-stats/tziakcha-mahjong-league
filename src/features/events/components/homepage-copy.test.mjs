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
  "src/features/events/components/public-site-footer.tsx",
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

test("event overview schedule copy follows the current event stage", () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), "src/features/events/components/event-overview.tsx"),
    "utf8",
  );

  assert.doesNotMatch(source, /最近几个常规赛对局轮次/);
  assert.doesNotMatch(source, /常规赛实际对局日程/);
  assert.match(source, /currentStage/);
  assert.match(source, /最近几个\$\{currentStage\}对局轮次/);
});

test("homepage publishing copy promotes regular season while exposing semifinal entry", () => {
  const pageSource = fs.readFileSync(
    path.join(process.cwd(), "src/app/(public)/page.tsx"),
    "utf8",
  );
  const heroSource = fs.readFileSync(
    path.join(process.cwd(), "src/features/events/components/home-hero.tsx"),
    "utf8",
  );
  const headerSource = fs.readFileSync(
    path.join(process.cwd(), "src/features/events/components/public-site-header.tsx"),
    "utf8",
  );

  assert.match(pageSource, /value="2"/);
  assert.match(pageSource, /常规赛数据归档/);
  assert.match(pageSource, /半决赛入口/);
  assert.match(heroSource, /国标麻将网络联赛赛事管理平台/);
  assert.match(heroSource, /半决赛赛程入口/);
  assert.match(headerSource, /国标麻将网络联赛赛事管理平台</);
  assert.doesNotMatch(headerSource, /SDU 国标麻将团体赛·常规赛/);
});

test("public brand copy uses Dazhalin", () => {
  const heroSource = fs.readFileSync(
    path.join(process.cwd(), "src/features/events/components/home-hero.tsx"),
    "utf8",
  );
  const headerSource = fs.readFileSync(
    path.join(process.cwd(), "src/features/events/components/public-site-header.tsx"),
    "utf8",
  );

  assert.match(heroSource, /大渣林/);
  assert.match(headerSource, /大渣林/);
  assert.match(headerSource, /\/sduleague\/brand-icon\.png/);
  assert.doesNotMatch(headerSource, />\s*茶\s*</);
  assert.match(heroSource, /国标麻将网络联赛赛事管理平台/);
  assert.match(headerSource, /国标麻将网络联赛赛事管理平台/);
  assert.doesNotMatch(heroSource, /SDU Tziakcha League/);
  assert.doesNotMatch(headerSource, /SDU Tziakcha League/);
  assert.doesNotMatch(heroSource, />\s*Tziakcha League\s*</);
  assert.doesNotMatch(headerSource, />\s*Tziakcha League\s*</);
});

test("public footer exposes project source, stack, author, and contact", () => {
  const layoutSource = fs.readFileSync(
    path.join(process.cwd(), "src/app/(public)/layout.tsx"),
    "utf8",
  );
  const footerSource = fs.readFileSync(
    path.join(process.cwd(), "src/features/events/components/public-site-footer.tsx"),
    "utf8",
  );

  assert.match(layoutSource, /PublicSiteFooter/);
  assert.match(footerSource, /https:\/\/github\.com\/tziakcha-stats/);
  assert.match(footerSource, /Choimoe/);
  assert.match(footerSource, /Next\.js/);
  assert.match(footerSource, /React/);
  assert.match(footerSource, /TypeScript/);
  assert.match(footerSource, /Tailwind CSS/);
  assert.match(footerSource, /qwqshq@gmail\.com/);
  assert.match(footerSource, /添加比赛/);
  assert.match(footerSource, /鲁ICP备2025190412号-1/);
});
