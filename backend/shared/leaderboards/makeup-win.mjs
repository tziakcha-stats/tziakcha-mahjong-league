import { resolvePlayerName } from "../player.mjs";
import { parseMatchTitle, formatFinishedAt, DEFAULT_TEAM_NAME } from "../match.mjs";
import { extractTziakchaRoundWinInfos } from "./average-fan-stats.mjs";

const OFFICIAL_REPLAY_BASE_URL = "https://tziakcha.net/game/?id=";

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

export function buildMakeupWinLeaderboard(detailedSessions, playerTeamIndex, aliases) {
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
