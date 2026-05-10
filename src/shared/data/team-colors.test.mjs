import test from "node:test";
import assert from "node:assert/strict";

import { getTeamColor } from "./team-colors.mjs";

test("getTeamColor returns colors by team name", () => {
  assert.equal(getTeamColor("复仇者联盟"), "#A5CC4F");
  assert.equal(getTeamColor("自摸七队"), "#EC672B");
});

test("getTeamColor falls back for unknown teams", () => {
  assert.equal(getTeamColor("未匹配队伍"), "#d6d3d1");
});
