import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.join(process.cwd(), "src/features/events/components/event-subnav.tsx"),
  "utf8",
);

test("event subnav does not expose the stats tab", () => {
  assert.equal(source.includes('label: "统计"'), false);
  assert.equal(source.includes('href: "/stats"'), false);
});
