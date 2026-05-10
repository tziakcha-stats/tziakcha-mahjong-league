import fs from "node:fs/promises";
import path from "node:path";

import winApi from "tziakcha-fetcher/record/win";

import {
  getProjectPath,
  parseCsv,
  percentage,
  readJson,
  readJsonIfExists,
  readText,
} from "./sw-league-utils.mjs";

const DEFAULT_TEAM_NAME = "未匹配队伍";
const OFFICIAL_REPLAY_BASE_URL = "https://tziakcha.net/game/?id=";
const STANDARD_POINTS_BY_PLACEMENT = [4, 2, 1, 0];
const PLACEMENT_KEYS = ["first", "second", "third", "fourth"];
const { extractTziakchaRoundWinInfos } = winApi;

function buildPlayerIndex(teamRows, aliases = {}) {
  const index = new Map();

  for (const team of teamRows) {
    const players = [team.captain, team.member1, team.member2, team.member3].filter(Boolean);

    for (const playerName of players) {
      index.set(resolvePlayerName(playerName, aliases), {
        teamId: String(team.id),
        teamName: team.teamName,
      });
    }
  }

  return index;
}

async function readPlayerAliases(projectRoot) {
  const playerRoot = path.join(projectRoot, "data", "sw_league", "player");
  const aliases = {};
  let files;

  try {
    files = await fs.readdir(playerRoot);
  } catch (error) {
    if (error?.code === "ENOENT") {
      return aliases;
    }

    throw error;
  }

  for (const fileName of files) {
    if (!fileName.endsWith(".json")) {
      continue;
    }

    const player = await readJson(path.join(playerRoot, fileName));
    const currentName = player.name;

    if (!currentName) {
      continue;
    }

    for (const alias of player.alias_history ?? []) {
      if (alias.name && alias.name !== currentName) {
        aliases[alias.name] = currentName;
      }
    }
  }

  return aliases;
}

function resolvePlayerName(playerName, aliases = {}) {
  return aliases[playerName] ?? playerName;
}

async function readCsv(projectRoot, ...segments) {
  const filePath = path.join(projectRoot, ...segments);
  const content = await readText(filePath);
  return parseCsv(content);
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function greatestCommonDivisor(left, right) {
  let a = Math.abs(left);
  let b = Math.abs(right);

  while (b !== 0) {
    const next = a % b;
    a = b;
    b = next;
  }

  return a || 1;
}

function createFraction(numerator, denominator = 1) {
  if (denominator === 0) {
    throw new Error("Fraction denominator cannot be zero.");
  }

  const sign = denominator < 0 ? -1 : 1;
  const normalizedNumerator = numerator * sign;
  const normalizedDenominator = Math.abs(denominator);
  const divisor = greatestCommonDivisor(normalizedNumerator, normalizedDenominator);

  return {
    numerator: normalizedNumerator / divisor,
    denominator: normalizedDenominator / divisor,
  };
}

function addFractions(left, right) {
  return createFraction(
    left.numerator * right.denominator + right.numerator * left.denominator,
    left.denominator * right.denominator,
  );
}

function formatFraction(fraction) {
  const normalized = createFraction(fraction.numerator, fraction.denominator);
  const { numerator, denominator } = normalized;

  if (denominator === 1) {
    return String(numerator);
  }

  const absoluteNumerator = Math.abs(numerator);
  const whole = Math.trunc(absoluteNumerator / denominator);
  const remainder = absoluteNumerator % denominator;
  const sign = numerator < 0 ? "-" : "";

  if (whole === 0) {
    return `${sign}${remainder}/${denominator}`;
  }

  if (remainder === 0) {
    return `${sign}${whole}`;
  }

  return `${sign}${whole}又${remainder}/${denominator}`;
}

function serializeFraction(fraction) {
  const normalized = createFraction(fraction.numerator, fraction.denominator);

  return {
    ...normalized,
    label: formatFraction(normalized),
  };
}

function fractionToNumber(fraction) {
  return fraction.numerator / fraction.denominator;
}

function subtractFractions(left, right) {
  return addFractions(left, createFraction(-right.numerator, right.denominator));
}

function buildPenaltyMaps(penalties, aliases) {
  const playerPenalties = new Map();
  const teamPenalties = new Map();

  for (const penalty of penalties.playerPenalties ?? []) {
    const playerName = resolvePlayerName(penalty.player, aliases);
    const current = playerPenalties.get(playerName) ?? createFraction(0);
    playerPenalties.set(
      playerName,
      addFractions(current, createFraction(toNumber(penalty.standardPointPenalty))),
    );
  }

  for (const penalty of penalties.teamPenalties ?? []) {
    const current = teamPenalties.get(penalty.team) ?? createFraction(0);
    teamPenalties.set(
      penalty.team,
      addFractions(current, createFraction(toNumber(penalty.standardPointPenalty))),
    );
  }

  return { playerPenalties, teamPenalties };
}

function formatRateNote(rounds, sourceLabel) {
  return `${rounds} 局样本，来源：${sourceLabel}`;
}

function formatFinishedAt(timestamp) {
  const date = new Date(timestamp);
  const formatter = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour12: false,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return formatter.format(date).replace(/\//gu, "/");
}

function formatScore(score) {
  return score > 0 ? `+${score}` : String(score);
}

function roundToTwoDecimals(value) {
  return Math.round(value * 100) / 100;
}

function getTieGroups(players) {
  const sortedPlayers = players
    .map((player, index) => ({ player, seatIndex: index }))
    .sort((left, right) => {
      const scoreDiff = right.player.s - left.player.s;
      return scoreDiff === 0 ? left.seatIndex - right.seatIndex : scoreDiff;
    });

  const groups = [];
  let cursor = 0;

  while (cursor < sortedPlayers.length) {
    const score = sortedPlayers[cursor].player.s;
    const members = [];
    let nextCursor = cursor;

    while (
      nextCursor < sortedPlayers.length &&
      sortedPlayers[nextCursor].player.s === score
    ) {
      members.push(sortedPlayers[nextCursor]);
      nextCursor += 1;
    }

    groups.push({
      startIndex: cursor,
      members,
    });
    cursor = nextCursor;
  }

  return groups;
}

function getStandardPointFraction(startIndex, size) {
  const total = STANDARD_POINTS_BY_PLACEMENT.slice(
    startIndex,
    startIndex + size,
  ).reduce((sum, point) => sum + point, 0);

  return createFraction(total, size);
}

function getPlacementShareFraction(size) {
  return createFraction(1, size);
}

function parseMatchTitle(title) {
  const match = title.match(/(常规赛)第(.+?)轮([A-Z])桌/u);

  if (!match) {
    return {
      round: 0,
      roundLabel: title,
      tableName: "未知桌",
    };
  }

  const round = normalizeRoundNumber(match[2]);

  return {
    round,
    roundLabel: `${match[1]}第 ${round} 轮`,
    tableName: `${match[3]} 桌`,
  };
}

function normalizeRoundNumber(value) {
  const chineseNumbers = new Map([
    ["一", 1],
    ["二", 2],
    ["三", 3],
    ["四", 4],
    ["五", 5],
    ["六", 6],
    ["七", 7],
    ["八", 8],
    ["九", 9],
    ["十", 10],
  ]);

  if (/^\d+$/u.test(value)) {
    return Number(value);
  }

  return chineseNumbers.get(value) ?? value;
}

function formatRoundLabel(round) {
  return `常规赛第 ${round} 轮`;
}

function buildOfflineMatchRows(offlineRows) {
  return offlineRows.map((match) => ({
    id: match.id,
    offline: true,
    round: toNumber(match.round),
    roundLabel: formatRoundLabel(toNumber(match.round)),
    tableName: match.tableName,
    location: match.location,
    players: match.players.map((player) => ({
      n: player.name,
      s: toNumber(player.score),
      standardPoint: player.standardPoint,
      teamName: player.team,
    })),
  }));
}

function buildLeaderboard(rows, playerTeamIndex, options) {
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

function buildWinDealDiffLeaderboard(huleRows, fangchongRows, playerTeamIndex, options) {
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

function buildAverageFanLeaderboard(playerStatsMap, playerTeamIndex, options) {
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

function buildAverageFlowerLeaderboard(playerStatsMap, playerTeamIndex) {
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

function buildAverageTsumoLossFanLeaderboard(playerStatsMap, playerTeamIndex) {
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

function formatBigWinDescription(fanItems) {
  const fanNames = fanItems.map((fanItem) => fanItem.fanName);
  return fanNames.length ? fanNames.join("、") : "无 8 番以上番种";
}

function roundToSixDecimals(value) {
  return Math.round(value * 1_000_000) / 1_000_000;
}

async function buildDetailedSessions({ projectRoot, historyRows, sessionRows }) {
  const sessionIndex = new Map(
    sessionRows.map((session) => [session.session_id, session]),
  );
  const recordsRoot = path.join(projectRoot, "data", "sw_league", "records");
  const sessions = [];

  for (const match of historyRows) {
    const sessionRow = sessionIndex.get(match.id);

    if (!sessionRow) {
      throw new Error(`Missing session records for match ${match.id}.`);
    }

    sessions.push({
      match,
      session: {
        sessionId: match.id,
        players: match.players.map((player) => ({
          name: player.n,
          id: player.i,
        })),
        records: await Promise.all(
          sessionRow.records.map(async (recordId, index) => {
            const record = await readJson(path.join(recordsRoot, `${recordId}.json`));

            return {
              id: recordId,
              index,
              step: record.step,
            };
          }),
        ),
      },
    });
  }

  return sessions;
}

function buildBigWinLeaderboard(detailedSessions, playerTeamIndex, aliases) {
  return detailedSessions
    .flatMap(({ match, session }) => {
      const { roundLabel, tableName } = parseMatchTitle(match.title);

      return extractTziakchaRoundWinInfos(session).flatMap((winInfo) => {
        const discarder = winInfo.discarders[0];
        const discarderName = winInfo.selfDraw
          ? "自摸"
          : discarder
            ? resolvePlayerName(discarder.playerName, aliases)
            : "未知";

        return winInfo.winners.map((winner) => {
          const winnerName = resolvePlayerName(winner.playerName, aliases);
          const team = playerTeamIndex.get(winnerName);
          const fanItems = winner.fanItems
            .filter((fanItem) => fanItem.unitFan >= 8)
            .map((fanItem) => ({
              fanName: fanItem.fanName,
              unitFan: fanItem.unitFan,
              count: fanItem.count,
              totalFan: fanItem.totalFan,
            }));

          return {
            winner: winnerName,
            winnerTeam: team?.teamName ?? DEFAULT_TEAM_NAME,
            discarder: discarderName,
            selfDraw: winInfo.selfDraw,
            totalFan: winner.totalFan,
            description: formatBigWinDescription(fanItems),
            fanItems,
            roundLabel,
            tableName,
            replayUrl: match.id ? `${OFFICIAL_REPLAY_BASE_URL}${match.id}` : undefined,
            matchId: match.id,
            recordId: winInfo.recordId,
            roundNo: winInfo.roundNo,
            finishedAt: formatFinishedAt(match.finish_time),
          };
        });
      });
    })
    .sort((left, right) => {
      const fanDiff = right.totalFan - left.totalFan;
      if (fanDiff !== 0) {
        return fanDiff;
      }

      const finishTimeDiff = right.finishedAt.localeCompare(left.finishedAt);
      if (finishTimeDiff !== 0) {
        return finishTimeDiff;
      }

      return left.winner.localeCompare(right.winner, "zh-Hans-CN");
    })
    .slice(0, 20)
    .map((row, index) => ({
      rank: index + 1,
      ...row,
    }));
}

function createEmptyMakeupWinBuckets() {
  return {
    gold: [],
    silver: [],
    bronze: [],
    iron: [],
  };
}

function getMakeupWinBucket(twoFanCount) {
  if (twoFanCount === 0) {
    return "gold";
  }

  if (twoFanCount === 1) {
    return "silver";
  }

  if (twoFanCount === 2) {
    return "bronze";
  }

  return "iron";
}

function formatMakeupWinDescription(twoFanItems, allFanItems) {
  if (!twoFanItems.length) {
    const terminalPungCount =
      allFanItems.find((fanItem) => fanItem.fanName === "幺九刻")?.count ?? 0;

    return terminalPungCount >= 2 ? "金II" : "金I";
  }

  return twoFanItems
    .flatMap((fanItem) => Array.from({ length: fanItem.count }, () => fanItem.fanName))
    .join("、");
}

function sortMakeupWinRows(left, right) {
  const finishTimeDiff = left.finishedAt.localeCompare(right.finishedAt);
  if (finishTimeDiff !== 0) {
    return finishTimeDiff;
  }

  const roundDiff = left.roundNo - right.roundNo;
  if (roundDiff !== 0) {
    return roundDiff;
  }

  return left.winner.localeCompare(right.winner, "zh-Hans-CN");
}

function buildMakeupWinLeaderboard(detailedSessions, playerTeamIndex, aliases) {
  const buckets = createEmptyMakeupWinBuckets();

  for (const { match, session } of detailedSessions) {
    const { roundLabel, tableName } = parseMatchTitle(match.title);
    const finishedAt = formatFinishedAt(match.finish_time);
    const replayUrl = match.id ? `${OFFICIAL_REPLAY_BASE_URL}${match.id}` : undefined;

    for (const winInfo of extractTziakchaRoundWinInfos(session)) {
      for (const winner of winInfo.winners) {
        const maxUnitFan = Math.max(
          ...winner.fanItems.map((fanItem) => fanItem.unitFan),
        );

        if (maxUnitFan > 2) {
          continue;
        }

        const winnerName = resolvePlayerName(winner.playerName, aliases);
        const team = playerTeamIndex.get(winnerName);
        const twoFanItems = winner.fanItems
          .filter((fanItem) => fanItem.unitFan === 2)
          .map((fanItem) => ({
            fanName: fanItem.fanName,
            unitFan: fanItem.unitFan,
            count: fanItem.count,
            totalFan: fanItem.totalFan,
          }));
        const twoFanCount = twoFanItems.reduce(
          (total, fanItem) => total + fanItem.count,
          0,
        );
        const bucket = getMakeupWinBucket(twoFanCount);

        buckets[bucket].push({
          winner: winnerName,
          winnerTeam: team?.teamName ?? DEFAULT_TEAM_NAME,
          totalFan: winner.totalFan,
          maxUnitFan,
          twoFanCount,
          description: formatMakeupWinDescription(twoFanItems, winner.fanItems),
          twoFanItems,
          roundLabel,
          tableName,
          replayUrl,
          matchId: match.id,
          recordId: winInfo.recordId,
          roundNo: winInfo.roundNo,
          finishedAt,
        });
      }
    }
  }

  return Object.fromEntries(
    Object.entries(buckets).map(([bucket, rows]) => [
      bucket,
      rows.sort(sortMakeupWinRows).map((row, index) => ({
        rank: index + 1,
        ...row,
      })),
    ]),
  );
}

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

function buildRoundIncomeLeaderboard(detailedSessions, playerTeamIndex, aliases) {
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

async function buildAverageFanStatsMap({
  detailedSessions,
  aliases,
}) {
  const statsMap = new Map();

  function ensurePlayerStats(playerName) {
    const name = resolvePlayerName(playerName, aliases);
    const stats = statsMap.get(name) ?? {
      name,
      rounds: 0,
      winFanTotal: 0,
      winCount: 0,
      flowerTotal: 0,
      dealInFanTotal: 0,
      dealInCount: 0,
      tsumoLossFanTotal: 0,
      tsumoLossCount: 0,
    };

    statsMap.set(name, stats);
    return stats;
  }

  for (const { match, session } of detailedSessions) {
    for (const player of match.players) {
      const playerStats = ensurePlayerStats(player.n);
      playerStats.rounds += session.records.length;
    }

    for (const winInfo of extractTziakchaRoundWinInfos(session)) {
      const winner = winInfo.winners[0];

      if (!winner) {
        continue;
      }

      const winnerStats = ensurePlayerStats(winner.playerName);
      const flowerItem = winner.fanItems.find(
        (fanItem) => fanItem.fanName === "花牌",
      );

      winnerStats.winFanTotal += winner.totalFan;
      winnerStats.winCount += 1;
      winnerStats.flowerTotal += flowerItem?.count ?? 0;

      if (winInfo.selfDraw) {
        const winnerName = resolvePlayerName(winner.playerName, aliases);

        for (const player of session.players) {
          const playerName = resolvePlayerName(player.name, aliases);

          if (playerName === winnerName) {
            continue;
          }

          const tsumoLossStats = ensurePlayerStats(player.name);
          tsumoLossStats.tsumoLossFanTotal += winner.totalFan;
          tsumoLossStats.tsumoLossCount += 1;
        }

        continue;
      }

      const discarder = winInfo.discarders[0];

      if (!discarder) {
        continue;
      }

      const discarderStats = ensurePlayerStats(discarder.playerName);
      discarderStats.dealInFanTotal += winner.totalFan;
      discarderStats.dealInCount += 1;
    }
  }

  return statsMap;
}

function buildPlayerStatsMap({
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

function buildTeamEntries(teamRows, playerStatsMap) {
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

function buildMatchRecords(matchRows, playerTeamIndex, aliases) {
  return [...matchRows]
    .sort((left, right) => {
      const leftRound = getMatchRound(left);
      const rightRound = getMatchRound(right);
      const roundDiff = rightRound - leftRound;

      if (roundDiff !== 0) {
        return roundDiff;
      }

      const finishTimeDiff = toNumber(right.finish_time) - toNumber(left.finish_time);
      if (finishTimeDiff !== 0) {
        return finishTimeDiff;
      }

      return String(left.id).localeCompare(String(right.id), "zh-Hans-CN", {
        numeric: true,
      });
    })
    .map((match) => {
      const titleInfo = match.offline
        ? {
            round: match.round,
            roundLabel: match.roundLabel,
            tableName: match.tableName,
          }
        : parseMatchTitle(match.title);

      return {
        id: match.id,
        replayUrl: match.offline || !match.id
          ? undefined
          : `${OFFICIAL_REPLAY_BASE_URL}${match.id}`,
        round: titleInfo.round,
        tableName: titleInfo.tableName,
        roundLabel: titleInfo.roundLabel,
        finishedAt: match.offline ? match.location : formatFinishedAt(match.finish_time),
        placements: match.players
          .map((player, index) => ({ player, seatIndex: index }))
          .sort((left, right) => {
            const scoreDiff = right.player.s - left.player.s;
            return scoreDiff === 0 ? left.seatIndex - right.seatIndex : scoreDiff;
          })
          .map(({ player }, index) => {
            const score = toNumber(player.s);
            const playerName = resolvePlayerName(player.n, aliases);
            const team = playerTeamIndex.get(playerName);

            return {
              placement: index + 1,
              team: team?.teamName ?? DEFAULT_TEAM_NAME,
              player: playerName,
              score,
              scoreLabel: formatScore(score),
            };
          }),
      };
    });
}

function getMatchRound(match) {
  if (Number.isFinite(match.round)) {
    return match.round;
  }

  return toNumber(parseMatchTitle(match.title).round);
}

function getStandardPointForGroup(group) {
  if (
    group.members.every(({ player }) =>
      Number.isFinite(Number(player.standardPoint)),
    )
  ) {
    const total = group.members.reduce(
      (sum, { player }) => sum + toNumber(player.standardPoint),
      0,
    );

    return createFraction(total, group.members.length);
  }

  return getStandardPointFraction(group.startIndex, group.members.length);
}

function buildOverviewRanking(matchRows, playerTeamIndex, aliases, penalties) {
  const playerSummaries = new Map();
  const teamSummaries = new Map();
  const { playerPenalties, teamPenalties } = buildPenaltyMaps(penalties, aliases);

  for (const match of matchRows) {
    const matchTeams = new Set();

    for (const group of getTieGroups(match.players)) {
      const standardPoints = getStandardPointForGroup(group);
      const placementShare = getPlacementShareFraction(group.members.length);
      const placementAverage =
        group.members.reduce((sum, _member, index) => {
          return sum + group.startIndex + index + 1;
        }, 0) / group.members.length;

      for (const { player } of group.members) {
        const score = toNumber(player.s);
        const playerName = resolvePlayerName(player.n, aliases);
        const team = playerTeamIndex.get(playerName);
        const teamName = player.teamName ?? team?.teamName ?? DEFAULT_TEAM_NAME;
        const current = playerSummaries.get(playerName) ?? {
          name: playerName,
          teamName,
          totalPoints: 0,
          standardPoints: createFraction(0),
          matchCount: 0,
          placementTotal: 0,
          placementCounts: Object.fromEntries(
            PLACEMENT_KEYS.map((placementKey) => [placementKey, createFraction(0)]),
          ),
        };

        current.totalPoints += score;
        current.standardPoints = addFractions(
          current.standardPoints,
          standardPoints,
        );
        current.matchCount += 1;
        current.placementTotal += placementAverage;

        for (
          let placementIndex = group.startIndex;
          placementIndex < group.startIndex + group.members.length;
          placementIndex += 1
        ) {
          const placementKey = PLACEMENT_KEYS[placementIndex];
          current.placementCounts[placementKey] = addFractions(
            current.placementCounts[placementKey],
            placementShare,
          );
        }

        playerSummaries.set(playerName, current);

        const teamSummary = teamSummaries.get(teamName) ?? {
          name: teamName,
          totalPoints: 0,
          standardPoints: createFraction(0),
          matchIds: new Set(),
          placementCounts: Object.fromEntries(
            PLACEMENT_KEYS.map((placementKey) => [placementKey, createFraction(0)]),
          ),
        };
        teamSummary.totalPoints += score;
        teamSummary.standardPoints = addFractions(
          teamSummary.standardPoints,
          standardPoints,
        );
        for (
          let placementIndex = group.startIndex;
          placementIndex < group.startIndex + group.members.length;
          placementIndex += 1
        ) {
          const placementKey = PLACEMENT_KEYS[placementIndex];
          teamSummary.placementCounts[placementKey] = addFractions(
            teamSummary.placementCounts[placementKey],
            placementShare,
          );
        }
        teamSummaries.set(teamName, teamSummary);
        matchTeams.add(teamName);
      }
    }

    for (const teamName of matchTeams) {
      teamSummaries.get(teamName)?.matchIds.add(match.id);
    }
  }

  const ranking = [...playerSummaries.values()]
    .sort((left, right) => {
      const leftPenalty = playerPenalties.get(left.name) ?? createFraction(0);
      const rightPenalty = playerPenalties.get(right.name) ?? createFraction(0);
      const standardPointDiff =
        fractionToNumber(subtractFractions(right.standardPoints, rightPenalty)) -
        fractionToNumber(subtractFractions(left.standardPoints, leftPenalty));
      if (standardPointDiff !== 0) {
        return standardPointDiff;
      }

      const totalPointDiff = right.totalPoints - left.totalPoints;
      if (totalPointDiff !== 0) {
        return totalPointDiff;
      }

      return left.name.localeCompare(right.name, "zh-Hans-CN");
    })
    .map((player, index) => {
      const standardPointPenalty = playerPenalties.get(player.name) ?? createFraction(0);
      const adjustedStandardPoints = subtractFractions(
        player.standardPoints,
        standardPointPenalty,
      );

      return {
        rank: index + 1,
        name: player.name,
        club: player.teamName,
        totalPoints: player.totalPoints,
        standardPoints: serializeFraction(player.standardPoints),
        standardPointPenalty: serializeFraction(standardPointPenalty),
        adjustedStandardPoints: serializeFraction(adjustedStandardPoints),
        averagePlacement: roundToTwoDecimals(
          fractionToNumber(player.standardPoints) / player.matchCount,
        ),
        bonus: player.matchCount,
        placementCounts: Object.fromEntries(
          Object.entries(player.placementCounts).map(([placementKey, fraction]) => [
            placementKey,
            serializeFraction(fraction),
          ]),
        ),
      };
    });

  const teamRanking = [...teamSummaries.values()]
    .sort((left, right) => {
      const leftPlayerPenalty = [...playerPenalties.entries()]
        .filter(([playerName]) => playerTeamIndex.get(playerName)?.teamName === left.name)
        .reduce((sum, [, penalty]) => addFractions(sum, penalty), createFraction(0));
      const rightPlayerPenalty = [...playerPenalties.entries()]
        .filter(([playerName]) => playerTeamIndex.get(playerName)?.teamName === right.name)
        .reduce((sum, [, penalty]) => addFractions(sum, penalty), createFraction(0));
      const leftPenalty = addFractions(
        leftPlayerPenalty,
        teamPenalties.get(left.name) ?? createFraction(0),
      );
      const rightPenalty = addFractions(
        rightPlayerPenalty,
        teamPenalties.get(right.name) ?? createFraction(0),
      );
      const standardPointDiff =
        fractionToNumber(subtractFractions(right.standardPoints, rightPenalty)) -
        fractionToNumber(subtractFractions(left.standardPoints, leftPenalty));
      if (standardPointDiff !== 0) {
        return standardPointDiff;
      }

      const totalPointDiff = right.totalPoints - left.totalPoints;
      if (totalPointDiff !== 0) {
        return totalPointDiff;
      }

      return left.name.localeCompare(right.name, "zh-Hans-CN");
    })
    .map((team, index) => {
      const playerPenalty = [...playerPenalties.entries()]
        .filter(([playerName]) => playerTeamIndex.get(playerName)?.teamName === team.name)
        .reduce((sum, [, penalty]) => addFractions(sum, penalty), createFraction(0));
      const standardPointPenalty = addFractions(
        playerPenalty,
        teamPenalties.get(team.name) ?? createFraction(0),
      );
      const adjustedStandardPoints = subtractFractions(
        team.standardPoints,
        standardPointPenalty,
      );

      return {
        rank: index + 1,
        name: team.name,
        totalPoints: team.totalPoints,
        standardPoints: serializeFraction(team.standardPoints),
        standardPointPenalty: serializeFraction(standardPointPenalty),
        adjustedStandardPoints: serializeFraction(adjustedStandardPoints),
        averageStandardPoints: roundToTwoDecimals(
          fractionToNumber(team.standardPoints) / team.matchIds.size,
        ),
        matchCount: team.matchIds.size,
        placementCounts: Object.fromEntries(
          Object.entries(team.placementCounts).map(([placementKey, fraction]) => [
            placementKey,
            serializeFraction(fraction),
          ]),
        ),
      };
    });

  return { ranking, teamRanking };
}

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
    },
  };
}

export function getSwLeagueOutputRoot() {
  return getProjectPath("content", "generated", "sw-league");
}
