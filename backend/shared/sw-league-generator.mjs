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
      roundLabel: title,
      tableName: "未知桌",
    };
  }

  return {
    roundLabel: `${match[1]}第 ${normalizeRoundNumber(match[2])} 轮`,
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

function buildAverageFanLeaderboard(playerStatsMap, playerTeamIndex, options) {
  return [...playerStatsMap.values()]
    .map((stats) => {
      const totalFan = stats[options.totalFanKey];
      const count = stats[options.countKey];

      return {
        name: stats.name,
        rate: percentage(count === 0 ? 0 : totalFan / count),
        count,
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
        note: `${row.count} 次样本，总番数 ${row.totalFan}，来源：详细牌谱 + tziakcha-fetcher`,
      };
    });
}

async function buildAverageFanStatsMap({
  projectRoot,
  historyRows,
  sessionRows,
  aliases,
}) {
  const statsMap = new Map();
  const sessionIndex = new Map(
    sessionRows.map((session) => [session.session_id, session]),
  );
  const recordsRoot = path.join(projectRoot, "data", "sw_league", "records");

  function ensurePlayerStats(playerName) {
    const name = resolvePlayerName(playerName, aliases);
    const stats = statsMap.get(name) ?? {
      name,
      winFanTotal: 0,
      winCount: 0,
      dealInFanTotal: 0,
      dealInCount: 0,
    };

    statsMap.set(name, stats);
    return stats;
  }

  for (const match of historyRows) {
    const sessionRow = sessionIndex.get(match.id);

    if (!sessionRow) {
      throw new Error(`Missing session records for match ${match.id}.`);
    }

    const session = {
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
    };

    for (const winInfo of extractTziakchaRoundWinInfos(session)) {
      const winner = winInfo.winners[0];

      if (!winner) {
        continue;
      }

      const winnerStats = ensurePlayerStats(winner.playerName);
      winnerStats.winFanTotal += winner.totalFan;
      winnerStats.winCount += 1;

      if (winInfo.selfDraw) {
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

function buildMatchRecords(historyRows, playerTeamIndex, aliases) {
  return [...historyRows]
    .sort((left, right) => right.finish_time - left.finish_time)
    .map((match) => {
      const { roundLabel, tableName } = parseMatchTitle(match.title);

      return {
        id: match.id,
        replayUrl: match.id ? `${OFFICIAL_REPLAY_BASE_URL}${match.id}` : undefined,
        tableName,
        roundLabel,
        finishedAt: formatFinishedAt(match.finish_time),
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

function buildOverviewRanking(historyRows, playerTeamIndex, aliases, penalties) {
  const playerSummaries = new Map();
  const teamSummaries = new Map();
  const { playerPenalties, teamPenalties } = buildPenaltyMaps(penalties, aliases);

  for (const match of historyRows) {
    const matchTeams = new Set();

    for (const group of getTieGroups(match.players)) {
      const standardPoints = getStandardPointFraction(
        group.startIndex,
        group.members.length,
      );
      const placementShare = getPlacementShareFraction(group.members.length);
      const placementAverage =
        group.members.reduce((sum, _member, index) => {
          return sum + group.startIndex + index + 1;
        }, 0) / group.members.length;

      for (const { player } of group.members) {
        const score = toNumber(player.s);
        const playerName = resolvePlayerName(player.n, aliases);
        const team = playerTeamIndex.get(playerName);
        const teamName = team?.teamName ?? DEFAULT_TEAM_NAME;
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
  const sessionsJsonPath = path.join(projectRoot, "data", "sw_league", "sessions.json");

  const [
    teams,
    playerAliases,
    manualAliases,
    penalties,
    historyRows,
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
  const resolveAlias = (playerName) => resolvePlayerName(playerName, aliases);
  const playerStatsMap = buildPlayerStatsMap({
    huleRows,
    zimoRows,
    fangchongRows,
    beizimoRows,
    winCountRows,
    aliases,
  });
  const averageFanStatsMap = await buildAverageFanStatsMap({
    projectRoot,
    historyRows,
    sessionRows,
    aliases,
  });

  const overview = buildOverviewRanking(historyRows, playerTeamIndex, aliases, penalties);

  return {
    teams: buildTeamEntries(teams, playerStatsMap),
    matches: buildMatchRecords(historyRows, playerTeamIndex, aliases),
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
        },
      ),
      averageDealInFan: buildAverageFanLeaderboard(
        averageFanStatsMap,
        playerTeamIndex,
        {
          totalFanKey: "dealInFanTotal",
          countKey: "dealInCount",
        },
      ),
    },
  };
}

export function getSwLeagueOutputRoot() {
  return getProjectPath("content", "generated", "sw-league");
}
