import path from "node:path";
import {
  getProjectPath,
  percentage,
  readJson,
  writeJson,
} from "../shared/sw-league-utils.mjs";

function buildTeamEntries(teamRows) {
  return teamRows.map((team) => ({
    id: String(team.id),
    name: team.teamName,
    school: "sw_league",
    captain: team.captain,
    members: [team.member1, team.member2, team.member3].filter(Boolean),
    record: "待接入后端统计",
    note: "当前由 backend/generate/sw-league.mjs 根据 team.json 生成。",
  }));
}

function buildLeaderboardRows(teamRows, label) {
  const names = teamRows.flatMap((team) => [
    { name: team.captain, team: team.teamName },
    { name: team.member1, team: team.teamName },
    { name: team.member2, team: team.teamName },
    { name: team.member3, team: team.teamName },
  ]);

  return names
    .filter((row) => row.name)
    .slice(0, 12)
    .map((row, index) => {
      const base = 0.68 - index * 0.017;
      const modifier =
        label === "zimo"
          ? -0.24
          : label === "fangchong"
            ? -0.58
            : 0;

      const rate =
        label === "fangchong"
          ? percentage(0.08 + index * 0.007)
          : percentage(base + modifier);

      return {
        rank: index + 1,
        name: row.name,
        team: row.team,
        rate,
        count: Math.max(3, 42 - index * 3),
        note:
          label === "hule"
            ? "当前为生成脚本的占位结果，后续将由真实牌谱统计替换。"
            : label === "zimo"
              ? "当前为生成脚本的占位结果，后续将由真实牌谱统计替换。"
              : "当前为生成脚本的占位结果，后续将由真实牌谱统计替换。",
      };
    });
}

async function main() {
  const teamJsonPath = getProjectPath("data", "sw_league", "team.json");
  const outputRoot = getProjectPath("content", "generated", "sw-league");

  const teams = await readJson(teamJsonPath);

  const teamEntries = buildTeamEntries(teams);
  const huleRate = buildLeaderboardRows(teams, "hule");
  const zimoRate = buildLeaderboardRows(teams, "zimo");
  const fangchongRate = buildLeaderboardRows(teams, "fangchong");

  await writeJson(path.join(outputRoot, "teams.json"), teamEntries);
  await writeJson(path.join(outputRoot, "leaderboards", "hule-rate.json"), huleRate);
  await writeJson(path.join(outputRoot, "leaderboards", "zimo-rate.json"), zimoRate);
  await writeJson(
    path.join(outputRoot, "leaderboards", "fangchong-rate.json"),
    fangchongRate,
  );

  console.log("Generated sw-league content:");
  console.log(`- ${path.join(outputRoot, "teams.json")}`);
  console.log(`- ${path.join(outputRoot, "leaderboards", "hule-rate.json")}`);
  console.log(`- ${path.join(outputRoot, "leaderboards", "zimo-rate.json")}`);
  console.log(`- ${path.join(outputRoot, "leaderboards", "fangchong-rate.json")}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
