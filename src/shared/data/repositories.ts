import events from "../../../content/events/index.json";
import eventMeta from "../../../content/events/sdu-riichi-team-championship/event.json";
import matches from "../../../content/generated/sw-league/matches.json";
import ranking from "../../../content/generated/sw-league/ranking.json";
import teamRanking from "../../../content/generated/sw-league/team-ranking.json";
import rules from "../../../content/events/sdu-riichi-team-championship/rules.json";
import schedule from "../../../content/events/sdu-riichi-team-championship/schedule.json";
import stats from "../../../content/events/sdu-riichi-team-championship/stats.json";
import teams from "../../../content/generated/sw-league/teams.json";
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

const eventDetailsBySlug: Record<string, EventDetail> = {
  "sdu-riichi-team-championship": {
    event: allEvents[0],
    story: eventMeta.story,
    rules: rules as string[],
    schedule: schedule as EventScheduleRound[],
    matches: matches as MatchRecord[],
    ranking: ranking as PlayerRankingEntry[],
    teamRanking: teamRanking as TeamRankingEntry[],
    stats: stats as EventStatsSummary[],
    teams: teams as TeamInfo[],
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
