import path from "node:path";

import { readJson, readJsonIfExists, readCsv, getProjectPath } from "./sw-league-utils.mjs";
import { readPlayerAliases, resolvePlayerName, buildPlayerIndex } from "./player.mjs";
import { buildOverviewRanking } from "./ranking.mjs";
import {
  buildLeaderboard,
  buildWinDealDiffLeaderboard,
  buildAverageFanLeaderboard,
  buildAverageFlowerLeaderboard,
  buildAverageTsumoLossFanLeaderboard,
  buildPlayerStatsMap,
  buildTeamEntries,
  buildDetailedSessions,
  buildAverageFanStatsMap,
  buildOfflineMatchRows,
  buildMatchRecords,
  buildBigWinLeaderboard,
  buildMakeupWinLeaderboard,
  buildRoundIncomeLeaderboard,
  buildCollectorLeaderboard,
} from "./leaderboards/index.mjs";

export async function generateSwLeagueContent(projectRoot = process.cwd()) {
  const teamJsonPath = path.join(projectRoot, "data", "sw_league", "team.json");
  const aliasJsonPath = path.join(projectRoot, "data", "sw_league", "alias.json");
  const penaltiesJsonPath = path.join(projectRoot, "data", "sw_league", "penalties.json");
  const historyJsonPath = path.join(projectRoot, "data", "sw_league", "history.json");
  const offlineJsonPath = path.join(projectRoot, "data", "sw_league", "offline.json");
  const sessionsJsonPath = path.join(projectRoot, "data", "sw_league", "sessions.json");

  const [
    teams,
    playerAliases,
    manualAliases,
    penalties,
    historyRows,
    offlineRows,
    sessionRows,
    huleRows,
    zimoRows,
    fangchongRows,
    beizimoRows,
    winCountRows,
  ] = await Promise.all([
    readJson(teamJsonPath),
    readPlayerAliases(projectRoot),
    readJsonIfExists(aliasJsonPath, {}),
    readJsonIfExists(penaltiesJsonPath, {}),
    readJson(historyJsonPath),
    readJsonIfExists(offlineJsonPath, []),
    readJson(sessionsJsonPath),
    readCsv(projectRoot, "data", "sw_league", "rank", "rate_win_rate.csv"),
    readCsv(projectRoot, "data", "sw_league", "rank", "rate_tsumo_rate.csv"),
    readCsv(projectRoot, "data", "sw_league", "rank", "rate_deal_in_rate.csv"),
    readCsv(projectRoot, "data", "sw_league", "rank", "rate_tsumo_against_rate.csv"),
    readCsv(projectRoot, "data", "sw_league", "rank", "stats_win_count.csv"),
  ]);

  const aliases = {
    ...playerAliases,
    ...manualAliases,
  };

  const playerTeamIndex = buildPlayerIndex(teams, aliases);
  const offlineMatchRows = buildOfflineMatchRows(offlineRows);
  const overviewMatchRows = [...historyRows, ...offlineMatchRows];
  const resolveAlias = (playerName) => resolvePlayerName(playerName, aliases);
  const detailedSessions = await buildDetailedSessions({
    projectRoot,
    historyRows,
    sessionRows,
  });
  const playerStatsMap = buildPlayerStatsMap({
    huleRows,
    zimoRows,
    fangchongRows,
    beizimoRows,
    winCountRows,
    aliases,
  });
  const averageFanStatsMap = await buildAverageFanStatsMap({
    detailedSessions,
    aliases,
  });

  const overview = buildOverviewRanking(
    overviewMatchRows,
    playerTeamIndex,
    aliases,
    penalties,
  );

  return {
    teams: buildTeamEntries(teams, playerStatsMap),
    matches: buildMatchRecords(overviewMatchRows, playerTeamIndex, aliases),
    ranking: overview.ranking,
    teamRanking: overview.teamRanking,
    leaderboards: {
      huleRate: buildLeaderboard(huleRows, playerTeamIndex, {
        countColumn: "Value",
        sourceLabel: "rate_win_rate.csv",
        resolvePlayerName: resolveAlias,
      }).map((row) => ({
        ...row,
        count: playerStatsMap.get(row.name)?.huleCount ?? row.count,
      })),
      zimoRate: buildLeaderboard(zimoRows, playerTeamIndex, {
        countColumn: "Value",
        sourceLabel: "rate_tsumo_rate.csv",
        resolvePlayerName: resolveAlias,
      }).map((row) => ({
        ...row,
        count: playerStatsMap.get(row.name)?.zimoCount ?? row.count,
      })),
      fangchongRate: buildLeaderboard(fangchongRows, playerTeamIndex, {
        countColumn: "Value",
        sourceLabel: "rate_deal_in_rate.csv",
        resolvePlayerName: resolveAlias,
      }).map((row) => ({
        ...row,
        count: playerStatsMap.get(row.name)?.fangchongCount ?? row.count,
      })),
      winDealDiff: buildWinDealDiffLeaderboard(
        huleRows,
        fangchongRows,
        playerTeamIndex,
        {
          resolvePlayerName: resolveAlias,
        },
      ),
      beizimoRate: buildLeaderboard(beizimoRows, playerTeamIndex, {
        countColumn: "Value",
        sourceLabel: "rate_tsumo_against_rate.csv",
        resolvePlayerName: resolveAlias,
      }).map((row) => ({
        ...row,
        count: playerStatsMap.get(row.name)?.beizimoCount ?? row.count,
      })),
      averageWinFan: buildAverageFanLeaderboard(
        averageFanStatsMap,
        playerTeamIndex,
        {
          totalFanKey: "winFanTotal",
          countKey: "winCount",
          denominatorLabel: "和牌",
        },
      ),
      averageDealInFan: buildAverageFanLeaderboard(
        averageFanStatsMap,
        playerTeamIndex,
        {
          totalFanKey: "dealInFanTotal",
          countKey: "dealInCount",
          denominatorLabel: "点炮",
        },
      ),
      averageFlower: buildAverageFlowerLeaderboard(
        averageFanStatsMap,
        playerTeamIndex,
      ),
      averageTsumoLossFan: buildAverageTsumoLossFanLeaderboard(
        averageFanStatsMap,
        playerTeamIndex,
      ),
      bigWin: buildBigWinLeaderboard(detailedSessions, playerTeamIndex, aliases),
      makeupWin: buildMakeupWinLeaderboard(
        detailedSessions,
        playerTeamIndex,
        aliases,
      ),
      roundIncome: buildRoundIncomeLeaderboard(
        detailedSessions,
        playerTeamIndex,
        aliases,
      ),
      collector: buildCollectorLeaderboard(
        detailedSessions,
        playerTeamIndex,
        aliases,
      ),
    },
  };
}

export function getSwLeagueOutputRoot() {
  return getProjectPath("content", "generated", "sw-league");
}
