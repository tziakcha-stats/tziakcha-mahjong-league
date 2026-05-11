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
  tables?: EventScheduleTable[];
}

export interface EventScheduleTable {
  id: string;
  tableName: string;
  teams: string[];
  replayUrl?: string;
}

export interface MatchRecord {
  id: string;
  replayUrl?: string;
  round: number;
  tableName: string;
  roundLabel: string;
  finishedAt: string;
  placements: MatchPlacement[];
}

export interface MatchPlacement {
  placement: number;
  team: string;
  player: string;
  score: number;
  scoreLabel: string;
}

export interface PlayerRankingEntry {
  rank: number;
  name: string;
  club: string;
  totalPoints: number;
  standardPoints: FractionValue;
  standardPointPenalty: FractionValue;
  adjustedStandardPoints: FractionValue;
  averagePlacement: number;
  bonus: number;
  placementCounts: PlacementCounts;
}

export interface TeamRankingEntry {
  rank: number;
  name: string;
  record?: string;
  totalPoints: number;
  standardPoints: FractionValue;
  standardPointPenalty: FractionValue;
  adjustedStandardPoints: FractionValue;
  averageStandardPoints: number;
  matchCount: number;
  placementCounts: PlacementCounts;
}

export interface FractionValue {
  numerator: number;
  denominator: number;
  label: string;
}

export interface PlacementCounts {
  first: FractionValue;
  second: FractionValue;
  third: FractionValue;
  fourth: FractionValue;
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
  relatedRate?: number;
  dealInRate?: number;
  rateDiff?: number;
  count: number;
  note: string;
}

export interface RoundIncomeModule {
  count: number;
  averageFan: number;
  income: number;
}

export interface RoundIncomeLeaderboardEntry {
  rank: number;
  name: string;
  team: string;
  rounds: number;
  pointWin: RoundIncomeModule;
  dealIn: RoundIncomeModule;
  selfDraw: RoundIncomeModule;
  drawnByOthers: RoundIncomeModule;
  roundIncome: number;
}

export interface BigWinFanItem {
  fanName: string;
  unitFan: number;
  count: number;
  totalFan: number;
}

export interface BigWinLeaderboardEntry {
  rank: number;
  winner: string;
  winnerTeam: string;
  discarder: string;
  selfDraw: boolean;
  totalFan: number;
  description: string;
  fanItems: BigWinFanItem[];
  winTile?: number | null;
  winTileName?: string | null;
  roundLabel: string;
  tableName: string;
  replayUrl?: string;
  matchId: string;
  recordId: string;
  roundNo: number;
  finishedAt: string;
}

export interface MakeupWinLeaderboardEntry {
  rank: number;
  winner: string;
  winnerTeam: string;
  totalFan: number;
  maxUnitFan: number;
  twoFanCount: number;
  description: string;
  twoFanItems: BigWinFanItem[];
  winTile?: number | null;
  winTileName?: string | null;
  roundLabel: string;
  tableName: string;
  replayUrl?: string;
  matchId: string;
  recordId: string;
  roundNo: number;
  finishedAt: string;
}

export interface CollectorLeaderboardEntry {
  rank: number;
  winner: string;
  winnerTeam: string;
  yakuCount: number;
  yakuNames: string;
  roundLabel: string;
  tableName: string;
  replayUrl?: string;
  matchId: string;
  finishedAt: string;
}

export interface MakeupWinLeaderboard {
  gold: MakeupWinLeaderboardEntry[];
  silver: MakeupWinLeaderboardEntry[];
  bronze: MakeupWinLeaderboardEntry[];
  iron: MakeupWinLeaderboardEntry[];
}

export interface EventDetail {
  event: LeagueEvent;
  story: string;
  rules: string[];
  schedule: EventScheduleRound[];
  matches: MatchRecord[];
  ranking: PlayerRankingEntry[];
  teamRanking: TeamRankingEntry[];
  stats: EventStatsSummary[];
  teams: TeamInfo[];
  leaderboards: {
    huleRate: RateLeaderboardEntry[];
    zimoRate: RateLeaderboardEntry[];
    fangchongRate: RateLeaderboardEntry[];
    winDealDiff: RateLeaderboardEntry[];
    beizimoRate: RateLeaderboardEntry[];
    averageWinFan: RateLeaderboardEntry[];
    averageDealInFan: RateLeaderboardEntry[];
    averageFlower: RateLeaderboardEntry[];
    averageTsumoLossFan: RateLeaderboardEntry[];
    bigWin: BigWinLeaderboardEntry[];
    makeupWin: MakeupWinLeaderboard;
    roundIncome: RoundIncomeLeaderboardEntry[];
    collector: CollectorLeaderboardEntry[];
  };
}
