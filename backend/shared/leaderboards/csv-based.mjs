import { resolvePlayerName } from "../player.mjs";
import { formatRateNote, DEFAULT_TEAM_NAME } from "../match.mjs";
import { percentage, toNumber } from "../sw-league-utils.mjs";
import { roundToSixDecimals } from "../fraction.mjs";

export function buildLeaderboard(rows, playerTeamIndex, options) {
  return rows.map((row) => {
    const playerName = options.resolvePlayerName(row["Player Name"]);
    const team = playerTeamIndex.get(playerName);

    return {
      rank: toNumber(row.Rank),
      name: playerName,
      team: team?.teamName ?? DEFAULT_TEAM_NAME,
      rate: percentage(toNumber(row.Rate)),
      count: toNumber(row[options.countColumn]),
      note: formatRateNote(toNumber(row.Rounds), options.sourceLabel),
    };
  });
}

export function buildWinDealDiffLeaderboard(huleRows, fangchongRows, playerTeamIndex, options) {
  const dealInIndex = new Map(
    fangchongRows.map((row) => [
      options.resolvePlayerName(row["Player Name"]),
      {
        rate: percentage(toNumber(row.Rate)),
        count: toNumber(row.Rounds),
      },
    ]),
  );

  return huleRows
    .map((row) => {
      const playerName = options.resolvePlayerName(row["Player Name"]);
      const team = playerTeamIndex.get(playerName);
      const dealIn = dealInIndex.get(playerName);
      const rate = percentage(toNumber(row.Rate));
      const dealInRate = dealIn?.rate ?? 0;

      return {
        name: playerName,
        team: team?.teamName ?? DEFAULT_TEAM_NAME,
        rate,
        dealInRate,
        rateDiff: roundToSixDecimals(rate - dealInRate),
        count: toNumber(row.Rounds),
        note: `和牌率 ${(rate * 100).toFixed(1)}%，放铳率 ${(dealInRate * 100).toFixed(1)}%，来源：rate_win_rate.csv + rate_deal_in_rate.csv`,
      };
    })
    .sort((left, right) => {
      const rateDiff = right.rateDiff - left.rateDiff;
      if (rateDiff !== 0) {
        return rateDiff;
      }

      const countDiff = right.count - left.count;
      if (countDiff !== 0) {
        return countDiff;
      }

      return left.name.localeCompare(right.name, "zh-Hans-CN");
    })
    .map((row, index) => ({
      rank: index + 1,
      ...row,
    }));
}

export function buildAverageFanLeaderboard(playerStatsMap, playerTeamIndex, options) {
  return [...playerStatsMap.values()]
    .map((stats) => {
      const totalFan = stats[options.totalFanKey];
      const denominatorCount = stats[options.countKey];

      return {
        name: stats.name,
        rate: percentage(
          denominatorCount === 0 ? 0 : totalFan / denominatorCount,
        ),
        count: stats.rounds,
        denominatorCount,
        totalFan,
      };
    })
    .sort((left, right) => {
      const rateDiff = right.rate - left.rate;
      if (rateDiff !== 0) {
        return rateDiff;
      }

      const countDiff = right.count - left.count;
      if (countDiff !== 0) {
        return countDiff;
      }

      return left.name.localeCompare(right.name, "zh-Hans-CN");
    })
    .map((row, index) => {
      const team = playerTeamIndex.get(row.name);

      return {
        rank: index + 1,
        name: row.name,
        team: team?.teamName ?? DEFAULT_TEAM_NAME,
        rate: row.rate,
        count: row.count,
        note: `${row.count} 局样本，${row.denominatorCount} 次${options.denominatorLabel}，总番数 ${row.totalFan}，来源：详细牌谱 + tziakcha-fetcher`,
      };
    });
}

export function buildAverageFlowerLeaderboard(playerStatsMap, playerTeamIndex) {
  return [...playerStatsMap.values()]
    .map((stats) => ({
      name: stats.name,
      rate: roundToSixDecimals(
        stats.winCount === 0 ? 0 : stats.flowerTotal / stats.winCount,
      ),
      count: stats.rounds,
      winCount: stats.winCount,
      flowerTotal: stats.flowerTotal,
    }))
    .sort((left, right) => {
      const rateDiff = right.rate - left.rate;
      if (rateDiff !== 0) {
        return rateDiff;
      }

      const countDiff = right.count - left.count;
      if (countDiff !== 0) {
        return countDiff;
      }

      return left.name.localeCompare(right.name, "zh-Hans-CN");
    })
    .map((row, index) => {
      const team = playerTeamIndex.get(row.name);

      return {
        rank: index + 1,
        name: row.name,
        team: team?.teamName ?? DEFAULT_TEAM_NAME,
        rate: row.rate,
        count: row.count,
        note: `${row.count} 局样本，${row.winCount} 次和牌，总花牌 ${row.flowerTotal}，来源：详细牌谱 + tziakcha-fetcher`,
      };
    });
}

export function buildAverageTsumoLossFanLeaderboard(playerStatsMap, playerTeamIndex) {
  return [...playerStatsMap.values()]
    .map((stats) => ({
      name: stats.name,
      rate: roundToSixDecimals(
        stats.tsumoLossCount === 0
          ? 0
          : stats.tsumoLossFanTotal / stats.tsumoLossCount,
      ),
      count: stats.rounds,
      tsumoLossCount: stats.tsumoLossCount,
      tsumoLossFanTotal: stats.tsumoLossFanTotal,
    }))
    .sort((left, right) => {
      const rateDiff = left.rate - right.rate;
      if (rateDiff !== 0) {
        return rateDiff;
      }

      const countDiff = right.count - left.count;
      if (countDiff !== 0) {
        return countDiff;
      }

      return left.name.localeCompare(right.name, "zh-Hans-CN");
    })
    .map((row, index) => {
      const team = playerTeamIndex.get(row.name);

      return {
        rank: index + 1,
        name: row.name,
        team: team?.teamName ?? DEFAULT_TEAM_NAME,
        rate: row.rate,
        count: row.count,
        note: `${row.count} 局样本，${row.tsumoLossCount} 次被摸，被摸总番数 ${row.tsumoLossFanTotal}，来源：详细牌谱 + tziakcha-fetcher`,
      };
    });
}

export function buildPlayerStatsMap({
  huleRows,
  zimoRows,
  fangchongRows,
  beizimoRows,
  winCountRows,
  aliases,
}) {
  const statsMap = new Map();

  for (const row of huleRows) {
    const name = resolvePlayerName(row["Player Name"], aliases);
    statsMap.set(name, {
      rounds: toNumber(row.Rounds),
      huleRate: percentage(toNumber(row.Rate)),
      huleCount: 0,
      zimoRate: 0,
      zimoCount: 0,
      fangchongRate: 0,
      fangchongCount: 0,
      beizimoRate: 0,
      beizimoCount: 0,
    });
  }

  for (const row of winCountRows) {
    const stats = statsMap.get(resolvePlayerName(row["Player Name"], aliases));
    if (stats) {
      stats.huleCount = toNumber(row.Value);
    }
  }

  for (const row of zimoRows) {
    const stats = statsMap.get(resolvePlayerName(row["Player Name"], aliases));
    if (stats) {
      stats.zimoRate = percentage(toNumber(row.Rate));
      stats.zimoCount = Math.round(toNumber(row.Rate) * stats.huleCount);
    }
  }

  for (const row of fangchongRows) {
    const stats = statsMap.get(resolvePlayerName(row["Player Name"], aliases));
    if (stats) {
      stats.fangchongRate = percentage(toNumber(row.Rate));
      stats.fangchongCount = Math.round(toNumber(row.Rate) * stats.rounds);
    }
  }

  for (const row of beizimoRows) {
    const stats = statsMap.get(resolvePlayerName(row["Player Name"], aliases));
    if (stats) {
      stats.beizimoRate = percentage(toNumber(row.Rate));
      stats.beizimoCount = Math.round(toNumber(row.Rate) * stats.rounds);
    }
  }

  return statsMap;
}

export function buildTeamEntries(teamRows, playerStatsMap) {
  return teamRows.map((team) => {
    const playerNames = [team.captain, team.member1, team.member2, team.member3].filter(Boolean);
    const aggregate = playerNames.reduce(
      (summary, playerName) => {
        const stats = playerStatsMap.get(playerName);
        if (!stats) {
          return summary;
        }

        summary.huleCount += stats.huleCount;
        summary.zimoCount += stats.zimoCount;
        summary.fangchongCount += stats.fangchongCount;
        summary.beizimoCount += stats.beizimoCount;
        return summary;
      },
      { huleCount: 0, zimoCount: 0, fangchongCount: 0, beizimoCount: 0 },
    );

    return {
      id: String(team.id),
      name: team.teamName,
      school: "SDU 国标麻将团体赛",
      captain: team.captain,
      members: [team.member1, team.member2, team.member3].filter(Boolean),
      record: `${aggregate.huleCount} 和 / ${aggregate.zimoCount} 自摸 / ${aggregate.fangchongCount} 放铳 / ${aggregate.beizimoCount} 被自摸`,
      note: "由后端生成脚本根据 team.json 与 rank/*.csv 聚合生成。",
    };
  });
}
