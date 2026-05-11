import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readProjectFile(filePath) {
  return fs.readFileSync(path.join(process.cwd(), filePath), "utf8");
}

test("next config targets the sduleague static export path", () => {
  const source = readProjectFile("next.config.ts");

  assert.match(source, /basePath:\s*["']\/sduleague["']/);
  assert.match(source, /output:\s*["']export["']/);
});

test("event slug layout provides static params for export", () => {
  const source = readProjectFile("src/app/(public)/events/[slug]/layout.tsx");

  assert.match(source, /generateStaticParams/);
  assert.match(source, /getEvents/);
});

test("legacy ranking detail pages are static export compatible", () => {
  const legacyPages = [
    "src/app/(public)/events/[slug]/ranking/hule/page.tsx",
    "src/app/(public)/events/[slug]/ranking/zimo/page.tsx",
    "src/app/(public)/events/[slug]/ranking/fangchong/page.tsx",
    "src/app/(public)/events/[slug]/ranking/beizimo/page.tsx",
  ];

  for (const pagePath of legacyPages) {
    const source = readProjectFile(pagePath);

    assert.equal(source.includes("permanentRedirect"), false, pagePath);
    assert.match(source, /AnalysisPanel/, pagePath);
  }
});
