import {
  createFraction,
  addFractions,
  subtractFractions,
  serializeFraction,
  fractionToNumber,
  roundToTwoDecimals,
} from "./fraction.mjs";
import { resolvePlayerName, buildPenaltyMaps } from "./player.mjs";
import { parseMatchTitle } from "./match.mjs";
import { toNumber } from "./sw-league-utils.mjs";

export const STANDARD_POINTS_BY_PLACEMENT = [4, 2, 1, 0];
export const PLACEMENT_KEYS = ["first", "second", "third", "fourth"];

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

export function buildOverviewRanking(matchRows, playerTeamIndex, aliases, penalties) {
  const DEFAULT_TEAM_NAME = "未匹配队伍";
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
