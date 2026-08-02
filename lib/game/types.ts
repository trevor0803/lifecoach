export type Screen = "career" | "team" | "film" | "life" | "legacy";

export type Position =
  | "QB"
  | "RB"
  | "WR"
  | "OL"
  | "DL"
  | "LB"
  | "CB"
  | "S"
  | "K";

export type DefensiveCall = "run-fit" | "balanced" | "pressure" | "shell" | "contain";

export interface Ratings {
  athleticism: number;
  technique: number;
  awareness: number;
  toughness: number;
  discipline: number;
}

export interface PlayerStats {
  games: number;
  tackles: number;
  sacks: number;
  interceptions: number;
  touchdowns: number;
  yards: number;
}

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  position: Position;
  grade: 9 | 10 | 11 | 12;
  archetype: string;
  personality: string;
  overall: number;
  potential: number;
  ratings: Ratings;
  evaluationConfidence: number;
  trust: number;
  morale: number;
  fatigue: number;
  health: number;
  academics: number;
  leadership: number;
  depthRank: number;
  development: number;
  stats: PlayerStats;
  tags: string[];
}

export interface Opponent {
  id: string;
  name: string;
  mascot: string;
  offense: number;
  defense: number;
  pace: number;
  runRate: number;
  pressureAnswer: number;
  explosiveRate: number;
  discipline: number;
  record: string;
  note: string;
}

export interface Relationship {
  id: string;
  name: string;
  role: string;
  trust: number;
  respect: number;
  closeness: number;
  status: string;
  memory: string;
}

export interface TimelineEntry {
  id: string;
  year: number;
  week: number;
  category: "football" | "career" | "life" | "money" | "relationship";
  title: string;
  detail: string;
  significance: number;
}

export interface Memory {
  key: string;
  createdYear: number;
  createdWeek: number;
  people: string[];
  secrecy: number;
  severity: number;
  detail: string;
  resolved?: boolean;
}

export interface ActivityDefinition {
  id: string;
  label: string;
  short: string;
  description: string;
  hours: number;
  category: "football" | "teaching" | "life" | "career" | "health";
  effects: Partial<Record<
    | "prep"
    | "scouting"
    | "energy"
    | "stress"
    | "family"
    | "staff"
    | "teaching"
    | "reputation"
    | "cash",
    number
  >>;
}

export interface EventChoice {
  id: string;
  title: string;
  description: string;
  signals: string[];
}

export interface StoryEvent {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  people: string[];
  choices: EventChoice[];
}

export interface GameLogEntry {
  id: string;
  quarter: number;
  call: DefensiveCall | "offense";
  headline: string;
  detail: string;
  pointsFor: number;
  pointsAgainst: number;
}

export interface ActiveGame {
  opponent: Opponent;
  series: number;
  maxSeries: number;
  homeScore: number;
  awayScore: number;
  complete: boolean;
  logs: GameLogEntry[];
  opponentLooks: Record<string, number>;
  callHistory: DefensiveCall[];
}

export interface JobOpportunity {
  id: string;
  school: string;
  level: "HS" | "D3" | "D2" | "FCS" | "FBS" | "NFL";
  role: string;
  salary: number;
  interest: number;
  location: string;
  why: string;
  requirements: string[];
  status: "watching" | "available" | "interview" | "offered" | "closed";
}

export interface SeasonResult {
  year: number;
  employer: string;
  role: string;
  wins: number;
  losses: number;
  achievement: string;
}

export interface GameState {
  version: number;
  seed: number;
  coachName: string;
  age: number;
  year: number;
  week: number;
  day: string;
  employer: string;
  mascot: string;
  level: "HS" | "D3" | "D2" | "FCS" | "FBS" | "NFL";
  role: string;
  subject: string;
  philosophy: string;
  scheme: string;
  mode: "week" | "gameday" | "postgame" | "season-end";
  screen: Screen;
  wins: number;
  losses: number;
  conferenceRank: number;
  reputation: number;
  schemeKnowledge: number;
  evaluation: number;
  leadership: number;
  recruiting: number;
  ethics: number;
  energy: number;
  stress: number;
  health: number;
  family: number;
  staffTrust: number;
  teamTrust: number;
  teaching: number;
  cash: number;
  debt: number;
  creditScore: number;
  salary: number;
  monthlyExpenses: number;
  housing: string;
  relationshipStatus: string;
  timeLeft: number;
  prep: number;
  scouting: number;
  install: number;
  gradesDue: number;
  selectedActivities: string[];
  roster: Player[];
  opponents: Opponent[];
  relationships: Relationship[];
  currentEventId: string;
  resolvedEvents: string[];
  timeline: TimelineEntry[];
  memories: Memory[];
  news: string[];
  activeGame: ActiveGame | null;
  opportunities: JobOpportunity[];
  seasons: SeasonResult[];
  defensivePlan: DefensiveCall;
  lastSavedAt: number;
}
