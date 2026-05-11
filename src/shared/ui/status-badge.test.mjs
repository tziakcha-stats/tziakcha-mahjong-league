import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.join(process.cwd(), "src/shared/ui/status-badge.tsx"),
  "utf8",
);

test("status badge keeps short Chinese status labels on one line", () => {
  assert.match(source, /whitespace-nowrap/);
});
