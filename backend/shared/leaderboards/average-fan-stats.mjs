import path from "node:path";

import winApi from "tziakcha-fetcher/record/win";

import { resolvePlayerName } from "../player.mjs";
import { parseMatchTitle, formatFinishedAt, formatRoundLabel, DEFAULT_TEAM_NAME } from "../match.mjs";
import { readJson, toNumber } from "../sw-league-utils.mjs";

const { extractTziakchaRoundWinInfos } = winApi;

export { extractTziakchaRoundWinInfos };

export async function buildDetailedSessions({ projectRoot, historyRows, sessionRows }) {
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

export async function buildAverageFanStatsMap({ detailedSessions, aliases }) {
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

export function buildOfflineMatchRows(offlineRows) {
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

function getMatchRound(match) {
  if (Number.isFinite(match.round)) {
    return match.round;
  }

  return toNumber(parseMatchTitle(match.title).round);
}

export function buildMatchRecords(matchRows, playerTeamIndex, aliases) {
  const OFFICIAL_REPLAY_BASE_URL = "https://tziakcha.net/game/?id=";

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
              scoreLabel: score > 0 ? `+${score}` : String(score),
            };
          }),
      };
    });
}
