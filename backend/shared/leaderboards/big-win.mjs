import { resolvePlayerName } from "../player.mjs";
import { parseMatchTitle, formatFinishedAt, DEFAULT_TEAM_NAME } from "../match.mjs";
import { extractTziakchaRoundWinInfos } from "./average-fan-stats.mjs";

const OFFICIAL_REPLAY_BASE_URL = "https://tziakcha.net/game/?id=";

function formatBigWinDescription(fanItems) {
  const fanNames = fanItems.map((fanItem) => fanItem.fanName);
  return fanNames.length ? fanNames.join("、") : "无 8 番以上番种";
}

export function buildBigWinLeaderboard(detailedSessions, playerTeamIndex, aliases) {
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
