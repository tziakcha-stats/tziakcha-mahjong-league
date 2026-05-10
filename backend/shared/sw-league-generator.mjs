import path from "node:path";

import {
  getProjectPath,
  parseCsv,
  percentage,
  readJson,
  readText,
} from "./sw-league-utils.mjs";

const DEFAULT_TEAM_NAME = "未匹配队伍";
const RECENT_MATCH_LIMIT = 20;

function buildPlayerIndex(teamRows) {
  const index = new Map();

  for (const team of teamRows) {
    const players = [team.captain, team.member1, team.member2, team.member3].filter(Boolean);

    for (const playerName of players) {
      index.set(playerName, {
        teamId: String(team.id),
        teamName: team.teamName,
      });
    }
  }

  return index;
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
    const playerName = row["Player Name"];
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

function buildPlayerStatsMap({
  huleRows,
  zimoRows,
  fangchongRows,
  beizimoRows,
  winCountRows,
}) {
  const statsMap = new Map();

  for (const row of huleRows) {
    const name = row["Player Name"];
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
    const stats = statsMap.get(row["Player Name"]);
    if (stats) {
      stats.huleCount = toNumber(row.Value);
    }
  }

  for (const row of zimoRows) {
    const stats = statsMap.get(row["Player Name"]);
    if (stats) {
      stats.zimoRate = percentage(toNumber(row.Rate));
      stats.zimoCount = Math.round(toNumber(row.Rate) * stats.huleCount);
    }
  }

  for (const row of fangchongRows) {
    const stats = statsMap.get(row["Player Name"]);
    if (stats) {
      stats.fangchongRate = percentage(toNumber(row.Rate));
      stats.fangchongCount = Math.round(toNumber(row.Rate) * stats.rounds);
    }
  }

  for (const row of beizimoRows) {
    const stats = statsMap.get(row["Player Name"]);
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

function buildRecentMatches(historyRows, playerTeamIndex) {
  return [...historyRows]
    .sort((left, right) => right.finish_time - left.finish_time)
    .slice(0, RECENT_MATCH_LIMIT)
    .map((match) => {
      const { roundLabel, tableName } = parseMatchTitle(match.title);

      return {
        id: match.id,
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
            const team = playerTeamIndex.get(player.n);

            return {
              placement: index + 1,
              team: team?.teamName ?? DEFAULT_TEAM_NAME,
              player: player.n,
              score,
              scoreLabel: formatScore(score),
            };
          }),
      };
    });
}

export async function generateSwLeagueContent(projectRoot = process.cwd()) {
  const teamJsonPath = path.join(projectRoot, "data", "sw_league", "team.json");
  const historyJsonPath = path.join(projectRoot, "data", "sw_league", "history.json");

  const [
    teams,
    historyRows,
    huleRows,
    zimoRows,
    fangchongRows,
    beizimoRows,
    winCountRows,
  ] = await Promise.all([
    readJson(teamJsonPath),
    readJson(historyJsonPath),
    readCsv(projectRoot, "data", "sw_league", "rank", "rate_win_rate.csv"),
    readCsv(projectRoot, "data", "sw_league", "rank", "rate_tsumo_rate.csv"),
    readCsv(projectRoot, "data", "sw_league", "rank", "rate_deal_in_rate.csv"),
    readCsv(projectRoot, "data", "sw_league", "rank", "rate_tsumo_against_rate.csv"),
    readCsv(projectRoot, "data", "sw_league", "rank", "stats_win_count.csv"),
  ]);

  const playerTeamIndex = buildPlayerIndex(teams);
  const playerStatsMap = buildPlayerStatsMap({
    huleRows,
    zimoRows,
    fangchongRows,
    beizimoRows,
    winCountRows,
  });

  return {
    teams: buildTeamEntries(teams, playerStatsMap),
    matches: buildRecentMatches(historyRows, playerTeamIndex),
    leaderboards: {
      huleRate: buildLeaderboard(huleRows, playerTeamIndex, {
        countColumn: "Value",
        sourceLabel: "rate_win_rate.csv",
      }).map((row) => ({
        ...row,
        count: playerStatsMap.get(row.name)?.huleCount ?? row.count,
      })),
      zimoRate: buildLeaderboard(zimoRows, playerTeamIndex, {
        countColumn: "Value",
        sourceLabel: "rate_tsumo_rate.csv",
      }).map((row) => ({
        ...row,
        count: playerStatsMap.get(row.name)?.zimoCount ?? row.count,
      })),
      fangchongRate: buildLeaderboard(fangchongRows, playerTeamIndex, {
        countColumn: "Value",
        sourceLabel: "rate_deal_in_rate.csv",
      }).map((row) => ({
        ...row,
        count: playerStatsMap.get(row.name)?.fangchongCount ?? row.count,
      })),
      beizimoRate: buildLeaderboard(beizimoRows, playerTeamIndex, {
        countColumn: "Value",
        sourceLabel: "rate_tsumo_against_rate.csv",
      }).map((row) => ({
        ...row,
        count: playerStatsMap.get(row.name)?.beizimoCount ?? row.count,
      })),
    },
  };
}

export function getSwLeagueOutputRoot() {
  return getProjectPath("content", "generated", "sw-league");
}
