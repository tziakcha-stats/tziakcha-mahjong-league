import path from "node:path";

import { generateSwLeagueContent } from "../shared/sw-league-generator.mjs";
import { getProjectPath, writeJson } from "../shared/sw-league-utils.mjs";

async function main() {
  const outputRoot = getProjectPath("content", "generated", "sw-league");
  const result = await generateSwLeagueContent(process.cwd());

  await writeJson(path.join(outputRoot, "teams.json"), result.teams);
  await writeJson(path.join(outputRoot, "matches.json"), result.matches);
  await writeJson(path.join(outputRoot, "ranking.json"), result.ranking);
  await writeJson(path.join(outputRoot, "team-ranking.json"), result.teamRanking);
  await writeJson(
    path.join(outputRoot, "leaderboards", "hule-rate.json"),
    result.leaderboards.huleRate,
  );
  await writeJson(
    path.join(outputRoot, "leaderboards", "zimo-rate.json"),
    result.leaderboards.zimoRate,
  );
  await writeJson(
    path.join(outputRoot, "leaderboards", "fangchong-rate.json"),
    result.leaderboards.fangchongRate,
  );
  await writeJson(
    path.join(outputRoot, "leaderboards", "win-deal-diff.json"),
    result.leaderboards.winDealDiff,
  );
  await writeJson(
    path.join(outputRoot, "leaderboards", "beizimo-rate.json"),
    result.leaderboards.beizimoRate,
  );
  await writeJson(
    path.join(outputRoot, "leaderboards", "average-win-fan.json"),
    result.leaderboards.averageWinFan,
  );
  await writeJson(
    path.join(outputRoot, "leaderboards", "average-deal-in-fan.json"),
    result.leaderboards.averageDealInFan,
  );
  await writeJson(
    path.join(outputRoot, "leaderboards", "average-flower.json"),
    result.leaderboards.averageFlower,
  );
  await writeJson(
    path.join(outputRoot, "leaderboards", "average-tsumo-loss-fan.json"),
    result.leaderboards.averageTsumoLossFan,
  );
  await writeJson(
    path.join(outputRoot, "leaderboards", "big-win.json"),
    result.leaderboards.bigWin,
  );
  await writeJson(
    path.join(outputRoot, "leaderboards", "makeup-win.json"),
    result.leaderboards.makeupWin,
  );
  await writeJson(
    path.join(outputRoot, "leaderboards", "round-income.json"),
    result.leaderboards.roundIncome,
  );

  console.log("Generated sw-league content:");
  console.log(`- ${path.join(outputRoot, "teams.json")}`);
  console.log(`- ${path.join(outputRoot, "matches.json")}`);
  console.log(`- ${path.join(outputRoot, "ranking.json")}`);
  console.log(`- ${path.join(outputRoot, "team-ranking.json")}`);
  console.log(`- ${path.join(outputRoot, "leaderboards", "hule-rate.json")}`);
  console.log(`- ${path.join(outputRoot, "leaderboards", "zimo-rate.json")}`);
  console.log(`- ${path.join(outputRoot, "leaderboards", "fangchong-rate.json")}`);
  console.log(`- ${path.join(outputRoot, "leaderboards", "win-deal-diff.json")}`);
  console.log(`- ${path.join(outputRoot, "leaderboards", "beizimo-rate.json")}`);
  console.log(`- ${path.join(outputRoot, "leaderboards", "average-win-fan.json")}`);
  console.log(`- ${path.join(outputRoot, "leaderboards", "average-deal-in-fan.json")}`);
  console.log(`- ${path.join(outputRoot, "leaderboards", "average-flower.json")}`);
  console.log(`- ${path.join(outputRoot, "leaderboards", "average-tsumo-loss-fan.json")}`);
  console.log(`- ${path.join(outputRoot, "leaderboards", "big-win.json")}`);
  console.log(`- ${path.join(outputRoot, "leaderboards", "makeup-win.json")}`);
  console.log(`- ${path.join(outputRoot, "leaderboards", "round-income.json")}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
