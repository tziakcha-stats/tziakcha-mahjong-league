export type EventStatus = "报名中" | "进行中" | "已结束" | "即将开始";

export interface LeagueEvent {
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  city: string;
  venue: string;
  startDate: string;
  endDate: string;
  players: number;
  rounds: number;
  status: EventStatus;
  season: string;
  coverAccent: string;
}

export interface EventScheduleRound {
  id: string;
  title: string;
  date: string;
  stage: string;
  summary: string;
}

export interface MatchRecord {
  id: string;
  tableName: string;
  roundLabel: string;
  finishedAt: string;
  players: string[];
  winner: string;
  points: string;
}

export interface PlayerRankingEntry {
  rank: number;
  name: string;
  club: string;
  totalPoints: number;
  averagePlacement: number;
  bonus: number;
}

export interface EventStatsSummary {
  label: string;
  value: string;
  note: string;
}

export interface TeamInfo {
  id: string;
  name: string;
  school: string;
  captain: string;
  members: string[];
  record: string;
  note: string;
}

export interface RateLeaderboardEntry {
  rank: number;
  name: string;
  team: string;
  rate: number;
  count: number;
  note: string;
}

export interface EventDetail {
  event: LeagueEvent;
  story: string;
  rules: string[];
  schedule: EventScheduleRound[];
  matches: MatchRecord[];
  ranking: PlayerRankingEntry[];
  stats: EventStatsSummary[];
  teams: TeamInfo[];
  leaderboards: {
    huleRate: RateLeaderboardEntry[];
    zimoRate: RateLeaderboardEntry[];
    fangchongRate: RateLeaderboardEntry[];
  };
}
