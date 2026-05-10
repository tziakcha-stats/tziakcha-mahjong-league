import path from "node:path";

import { generateSwLeagueContent } from "../shared/sw-league-generator.mjs";
import { getProjectPath, writeJson } from "../shared/sw-league-utils.mjs";

async function main() {
  const outputRoot = getProjectPath("content", "generated", "sw-league");
  const result = await generateSwLeagueContent(process.cwd());

  await writeJson(path.join(outputRoot, "teams.json"), result.teams);
  await writeJson(path.join(outputRoot, "matches.json"), result.matches);
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
    path.join(outputRoot, "leaderboards", "beizimo-rate.json"),
    result.leaderboards.beizimoRate,
  );

  console.log("Generated sw-league content:");
  console.log(`- ${path.join(outputRoot, "teams.json")}`);
  console.log(`- ${path.join(outputRoot, "matches.json")}`);
  console.log(`- ${path.join(outputRoot, "leaderboards", "hule-rate.json")}`);
  console.log(`- ${path.join(outputRoot, "leaderboards", "zimo-rate.json")}`);
  console.log(`- ${path.join(outputRoot, "leaderboards", "fangchong-rate.json")}`);
  console.log(`- ${path.join(outputRoot, "leaderboards", "beizimo-rate.json")}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
