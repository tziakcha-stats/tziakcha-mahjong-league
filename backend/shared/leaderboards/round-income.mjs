import { resolvePlayerName } from "../player.mjs";
import { DEFAULT_TEAM_NAME } from "../match.mjs";
import { roundToSixDecimals } from "../fraction.mjs";
import { extractTziakchaRoundWinInfos } from "./average-fan-stats.mjs";

function buildEmptyIncomeModule() {
  return {
    count: 0,
    totalFan: 0,
  };
}

function buildIncomeModule(module, rounds, getSingleIncome) {
  const averageFan = module.count === 0 ? 0 : module.totalFan / module.count;
  const income = module.count * getSingleIncome(averageFan);

  return {
    count: module.count,
    averageFan: roundToSixDecimals(averageFan),
    income: roundToSixDecimals(income),
  };
}

export function buildRoundIncomeLeaderboard(detailedSessions, playerTeamIndex, aliases) {
  const statsMap = new Map();

  function ensureStats(playerName) {
    const name = resolvePlayerName(playerName, aliases);
    const stats = statsMap.get(name) ?? {
      name,
      rounds: 0,
      pointWin: buildEmptyIncomeModule(),
      dealIn: buildEmptyIncomeModule(),
      selfDraw: buildEmptyIncomeModule(),
      drawnByOthers: buildEmptyIncomeModule(),
    };

    statsMap.set(name, stats);
    return stats;
  }

  for (const { match, session } of detailedSessions) {
    for (const player of match.players) {
      const playerStats = ensureStats(player.n);
      playerStats.rounds += session.records.length;
    }

    for (const winInfo of extractTziakchaRoundWinInfos(session)) {
      const winner = winInfo.winners[0];

      if (!winner) {
        continue;
      }

      const winnerStats = ensureStats(winner.playerName);

      if (winInfo.selfDraw) {
        winnerStats.selfDraw.count += 1;
        winnerStats.selfDraw.totalFan += winner.totalFan;

        for (const player of session.players) {
          const playerName = resolvePlayerName(player.name, aliases);
          const winnerName = resolvePlayerName(winner.playerName, aliases);

          if (playerName === winnerName) {
            continue;
          }

          const drawnByOthersStats = ensureStats(player.name);
          drawnByOthersStats.drawnByOthers.count += 1;
          drawnByOthersStats.drawnByOthers.totalFan += winner.totalFan;
        }

        continue;
      }

      winnerStats.pointWin.count += 1;
      winnerStats.pointWin.totalFan += winner.totalFan;

      const discarder = winInfo.discarders[0];

      if (!discarder) {
        continue;
      }

      const discarderStats = ensureStats(discarder.playerName);
      discarderStats.dealIn.count += 1;
      discarderStats.dealIn.totalFan += winner.totalFan;
    }
  }

  return [...statsMap.values()]
    .map((stats) => {
      const team = playerTeamIndex.get(stats.name);
      const pointWin = buildIncomeModule(
        stats.pointWin,
        stats.rounds,
        (averageFan) => averageFan + 24,
      );
      const dealIn = buildIncomeModule(
        stats.dealIn,
        stats.rounds,
        (averageFan) => -(averageFan + 8),
      );
      const selfDraw = buildIncomeModule(
        stats.selfDraw,
        stats.rounds,
        (averageFan) => averageFan * 3 + 24,
      );
      const drawnByOthers = buildIncomeModule(
        stats.drawnByOthers,
        stats.rounds,
        (averageFan) => -(averageFan + 8),
      );
      const totalIncome =
        pointWin.income + dealIn.income + selfDraw.income + drawnByOthers.income;
      const roundIncome = roundToSixDecimals(
        stats.rounds === 0 ? 0 : totalIncome / stats.rounds,
      );

      return {
        name: stats.name,
        team: team?.teamName ?? DEFAULT_TEAM_NAME,
        rounds: stats.rounds,
        pointWin,
        dealIn,
        selfDraw,
        drawnByOthers,
        roundIncome,
      };
    })
    .sort((left, right) => {
      const incomeDiff = right.roundIncome - left.roundIncome;
      if (incomeDiff !== 0) {
        return incomeDiff;
      }

      const roundDiff = right.rounds - left.rounds;
      if (roundDiff !== 0) {
        return roundDiff;
      }

      return left.name.localeCompare(right.name, "zh-Hans-CN");
    })
    .map((row, index) => ({
      rank: index + 1,
      ...row,
    }));
}
