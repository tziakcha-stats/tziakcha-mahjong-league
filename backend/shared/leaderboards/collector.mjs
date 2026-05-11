import { resolvePlayerName } from "../player.mjs";
import { parseMatchTitle, formatFinishedAt, DEFAULT_TEAM_NAME } from "../match.mjs";
import { extractTziakchaRoundWinInfos } from "./average-fan-stats.mjs";

const OFFICIAL_REPLAY_BASE_URL = "https://tziakcha.net/game/?id=";

export function buildCollectorLeaderboard(detailedSessions, playerTeamIndex, aliases) {
  const entries = [];

  for (const { match, session } of detailedSessions) {
    const { roundLabel, tableName } = parseMatchTitle(match.title);
    const replayUrl = match.id ? `${OFFICIAL_REPLAY_BASE_URL}${match.id}` : undefined;
    const finishedAt = formatFinishedAt(match.finish_time);
    const playerYakuMap = new Map();

    for (const winInfo of extractTziakchaRoundWinInfos(session)) {
      for (const winner of winInfo.winners) {
        const winnerName = resolvePlayerName(winner.playerName, aliases);

        if (!playerYakuMap.has(winnerName)) {
          playerYakuMap.set(winnerName, new Set());
        }

        const yakuSet = playerYakuMap.get(winnerName);

        for (const fanItem of winner.fanItems) {
          if (fanItem.unitFan >= 4) {
            yakuSet.add(fanItem.fanName);
          }
        }
      }
    }

    for (const [playerName, yakuSet] of playerYakuMap) {
      if (yakuSet.size === 0) {
        continue;
      }

      const team = playerTeamIndex.get(playerName);
      const yakuNames = [...yakuSet].join("、");

      entries.push({
        winner: playerName,
        winnerTeam: team?.teamName ?? DEFAULT_TEAM_NAME,
        yakuCount: yakuSet.size,
        yakuNames,
        roundLabel,
        tableName,
        replayUrl,
        matchId: match.id,
        finishedAt,
      });
    }
  }

  return entries
    .sort((left, right) => {
      const countDiff = right.yakuCount - left.yakuCount;
      if (countDiff !== 0) {
        return countDiff;
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
