import events from "../../../content/events/index.json";
import eventMeta from "../../../content/events/sdu-riichi-team-championship/event.json";
import semifinalEventMeta from "../../../content/events/sdu-mcr-team-semifinal/event.json";
import matches from "../../../content/generated/sw-league/matches.json";
import semifinalMatches from "../../../content/events/sdu-mcr-team-semifinal/matches.json";
import ranking from "../../../content/generated/sw-league/ranking.json";
import semifinalRanking from "../../../content/events/sdu-mcr-team-semifinal/ranking.json";
import teamRanking from "../../../content/generated/sw-league/team-ranking.json";
import semifinalTeamRanking from "../../../content/events/sdu-mcr-team-semifinal/team-ranking.json";
import rules from "../../../content/events/sdu-riichi-team-championship/rules.json";
import semifinalRules from "../../../content/events/sdu-mcr-team-semifinal/rules.json";
import schedule from "../../../content/events/sdu-riichi-team-championship/schedule.json";
import semifinalSchedule from "../../../content/events/sdu-mcr-team-semifinal/schedule.json";
import stats from "../../../content/events/sdu-riichi-team-championship/stats.json";
import semifinalStats from "../../../content/events/sdu-mcr-team-semifinal/stats.json";
import teams from "../../../content/generated/sw-league/teams.json";
import semifinalTeams from "../../../content/events/sdu-mcr-team-semifinal/teams.json";
import huleRate from "../../../content/generated/sw-league/leaderboards/hule-rate.json";
import zimoRate from "../../../content/generated/sw-league/leaderboards/zimo-rate.json";
import fangchongRate from "../../../content/generated/sw-league/leaderboards/fangchong-rate.json";
import winDealDiff from "../../../content/generated/sw-league/leaderboards/win-deal-diff.json";
import beizimoRate from "../../../content/generated/sw-league/leaderboards/beizimo-rate.json";
import averageWinFan from "../../../content/generated/sw-league/leaderboards/average-win-fan.json";
import averageDealInFan from "../../../content/generated/sw-league/leaderboards/average-deal-in-fan.json";
import averageFlower from "../../../content/generated/sw-league/leaderboards/average-flower.json";
import averageTsumoLossFan from "../../../content/generated/sw-league/leaderboards/average-tsumo-loss-fan.json";
import bigWin from "../../../content/generated/sw-league/leaderboards/big-win.json";
import makeupWin from "../../../content/generated/sw-league/leaderboards/makeup-win.json";
import roundIncome from "../../../content/generated/sw-league/leaderboards/round-income.json";
import type {
  BigWinLeaderboardEntry,
  EventDetail,
  EventScheduleRound,
  EventStatsSummary,
  LeagueEvent,
  MatchRecord,
  MakeupWinLeaderboard,
  PlayerRankingEntry,
  RateLeaderboardEntry,
  RoundIncomeLeaderboardEntry,
  TeamInfo,
  TeamRankingEntry,
} from "@/shared/data/types";

const allEvents = events as LeagueEvent[];
const allMatches = matches as MatchRecord[];
const allTeams = (teams as TeamInfo[]).map((team) => ({
  ...team,
  school: allEvents[0]?.name ?? team.school,
}));
const semifinalEvent = allEvents.find((event) => event.slug === "sdu-mcr-team-semifinal");
const semifinalTeamInfo = (semifinalTeams as TeamInfo[]).map((team) => ({
  ...team,
  school: semifinalEvent?.name ?? team.school,
}));

function buildScheduleFromMatches(matchRecords: MatchRecord[]): EventScheduleRound[] {
  const roundsByNo = new Map<number, MatchRecord[]>();

  for (const match of matchRecords) {
    const roundMatches = roundsByNo.get(match.round) ?? [];
    roundMatches.push(match);
    roundsByNo.set(match.round, roundMatches);
  }

  return Array.from(roundsByNo.entries())
    .sort(([roundA], [roundB]) => roundA - roundB)
    .map(([round, roundMatches]) => {
      const sortedMatches = roundMatches.toSorted((matchA, matchB) =>
        matchA.tableName.localeCompare(matchB.tableName, "zh-Hans-CN"),
      );
      const dateLabels = Array.from(new Set(sortedMatches.map((match) => match.finishedAt)));

      return {
        id: `regular-season-round-${round}`,
        title: `常规赛第 ${round} 轮`,
        date: dateLabels.join(" / "),
        stage: "常规赛",
        summary: sortedMatches
          .map((match) => `${match.tableName}：${match.placements.map((placement) => placement.team).join(" / ")}`)
          .join("；"),
        tables: sortedMatches.map((match) => ({
          id: match.id,
          tableName: match.tableName,
          teams: match.placements.map((placement) => placement.team),
          replayUrl: match.replayUrl,
        })),
      };
    });
}

const regularSeasonSchedule = buildScheduleFromMatches(allMatches);
const emptyLeaderboards = {
  huleRate: [],
  zimoRate: [],
  fangchongRate: [],
  winDealDiff: [],
  beizimoRate: [],
  averageWinFan: [],
  averageDealInFan: [],
  averageFlower: [],
  averageTsumoLossFan: [],
  bigWin: [],
  makeupWin: {
    gold: [],
    silver: [],
    bronze: [],
    iron: [],
  },
  roundIncome: [],
};

const eventDetailsBySlug: Record<string, EventDetail> = {
  "sdu-riichi-team-championship": {
    event: allEvents[0],
    story: eventMeta.story,
    rules: rules as string[],
    schedule: regularSeasonSchedule.length
      ? regularSeasonSchedule
      : (schedule as EventScheduleRound[]),
    matches: allMatches,
    ranking: ranking as PlayerRankingEntry[],
    teamRanking: teamRanking as TeamRankingEntry[],
    stats: stats as EventStatsSummary[],
    teams: allTeams,
    leaderboards: {
      huleRate: huleRate as RateLeaderboardEntry[],
      zimoRate: zimoRate as RateLeaderboardEntry[],
      fangchongRate: fangchongRate as RateLeaderboardEntry[],
      winDealDiff: winDealDiff as RateLeaderboardEntry[],
      beizimoRate: beizimoRate as RateLeaderboardEntry[],
      averageWinFan: averageWinFan as RateLeaderboardEntry[],
      averageDealInFan: averageDealInFan as RateLeaderboardEntry[],
      averageFlower: averageFlower as RateLeaderboardEntry[],
      averageTsumoLossFan: averageTsumoLossFan as RateLeaderboardEntry[],
      bigWin: bigWin as BigWinLeaderboardEntry[],
      makeupWin: makeupWin as MakeupWinLeaderboard,
      roundIncome: roundIncome as RoundIncomeLeaderboardEntry[],
    },
  },
  "sdu-mcr-team-semifinal": {
    event: semifinalEvent ?? allEvents[1],
    story: semifinalEventMeta.story,
    rules: semifinalRules as string[],
    schedule: semifinalSchedule as EventScheduleRound[],
    matches: semifinalMatches as MatchRecord[],
    ranking: semifinalRanking as PlayerRankingEntry[],
    teamRanking: semifinalTeamRanking as TeamRankingEntry[],
    stats: semifinalStats as EventStatsSummary[],
    teams: semifinalTeamInfo,
    leaderboards: emptyLeaderboards,
  },
};

export function getEvents(): LeagueEvent[] {
  return allEvents;
}

export function getFeaturedEvent(): LeagueEvent {
  return allEvents[0];
}

export function getEventDetail(slug: string): EventDetail | undefined {
  return eventDetailsBySlug[slug];
}

export function getLeaderboard(
  slug: string,
  key:
    | "huleRate"
    | "zimoRate"
    | "fangchongRate"
    | "winDealDiff"
    | "beizimoRate"
    | "averageWinFan"
    | "averageDealInFan"
    | "averageFlower"
    | "averageTsumoLossFan"
    | "bigWin"
    | "makeupWin"
    | "roundIncome",
) {
  return eventDetailsBySlug[slug]?.leaderboards[key] ?? [];
}
