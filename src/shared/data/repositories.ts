import events from "../../../content/events/index.json";
import eventMeta from "../../../content/events/sdu-riichi-team-championship/event.json";
import matches from "../../../content/generated/sw-league/matches.json";
import ranking from "../../../content/events/sdu-riichi-team-championship/ranking.json";
import rules from "../../../content/events/sdu-riichi-team-championship/rules.json";
import schedule from "../../../content/events/sdu-riichi-team-championship/schedule.json";
import stats from "../../../content/events/sdu-riichi-team-championship/stats.json";
import teams from "../../../content/generated/sw-league/teams.json";
import huleRate from "../../../content/generated/sw-league/leaderboards/hule-rate.json";
import zimoRate from "../../../content/generated/sw-league/leaderboards/zimo-rate.json";
import fangchongRate from "../../../content/generated/sw-league/leaderboards/fangchong-rate.json";
import beizimoRate from "../../../content/generated/sw-league/leaderboards/beizimo-rate.json";
import type {
  EventDetail,
  EventScheduleRound,
  EventStatsSummary,
  LeagueEvent,
  MatchRecord,
  PlayerRankingEntry,
  RateLeaderboardEntry,
  TeamInfo,
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
    stats: stats as EventStatsSummary[],
    teams: teams as TeamInfo[],
    leaderboards: {
      huleRate: huleRate as RateLeaderboardEntry[],
      zimoRate: zimoRate as RateLeaderboardEntry[],
      fangchongRate: fangchongRate as RateLeaderboardEntry[],
      beizimoRate: beizimoRate as RateLeaderboardEntry[],
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
  key: "huleRate" | "zimoRate" | "fangchongRate" | "beizimoRate",
) {
  return eventDetailsBySlug[slug]?.leaderboards[key] ?? [];
}
