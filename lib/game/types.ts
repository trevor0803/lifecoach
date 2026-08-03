export type Screen = "career" | "team" | "film" | "life" | "legacy";
export type Level = "HS" | "D3" | "D2" | "FCS" | "FBS" | "NFL";
export type Position =
  | "QB"
  | "RB"
  | "WR"
  | "TE"
  | "OL"
  | "DL"
  | "LB"
  | "CB"
  | "S"
  | "K"
  | "P";
export type DefensiveCall =
  | "run-fit"
  | "balanced"
  | "pressure"
  | "shell"
  | "contain";
export type PracticeIntensity = "walkthrough" | "normal" | "physical";
export type PracticeFocus =
  | "fundamentals"
  | "scheme"
  | "evaluation"
  | "conditioning";
export type RepGroup = "starters" | "balanced" | "young-players";

export interface Ratings {
  speed: number;
  strength: number;
  agility: number;
  stamina: number;
  technique: number;
  awareness: number;
  toughness: number;
  discipline: number;
}
export interface PlayerStats {
  games: number;
  snaps: number;
  passAttempts: number;
  passCompletions: number;
  passYards: number;
  passTD: number;
  interceptionsThrown: number;
  rushAttempts: number;
  rushYards: number;
  rushTD: number;
  targets: number;
  receptions: number;
  receivingYards: number;
  receivingTD: number;
  pancakes: number;
  sacksAllowed: number;
  tackles: number;
  tacklesForLoss: number;
  sacks: number;
  interceptions: number;
  passBreakups: number;
  forcedFumbles: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  extraPointsMade: number;
  extraPointsAttempted: number;
  punts: number;
  puntYards: number;
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
  weeklyReps: number;
  weeklyGrade: number;
  gameSnaps: number;
  injury: string | null;
  roleNote: string;
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
  district: string;
  stateRank: number | null;
  nationalRank: number | null;
  offenseStyle: string;
  defenseStyle: string;
  keyPlayers: string[];
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
}
export interface RelationshipMemory {
  id: string;
  year: number;
  week: number;
  title: string;
  detail: string;
  tone: "warm" | "hurt" | "tense" | "proud" | "unresolved";
  sticky: boolean;
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
  mood: string;
  need: string;
  boundary: string;
  lastInteraction: string;
  neglect: number;
  history: RelationshipMemory[];
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
  effects: Partial<
    Record<
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
    >
  >;
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
  speaker?: string;
  trigger?: string;
  repeatable?: boolean;
}
export interface RelationshipChoice {
  id: string;
  title: string;
  detail: string;
  hours: number;
  cash?: number;
  trust: number;
  closeness: number;
  respect?: number;
  outcome: string;
  memoryTitle: string;
  memoryTone: RelationshipMemory["tone"];
}
export interface RelationshipScene {
  id: string;
  personId: string;
  title: string;
  body: string;
  trigger: string;
  choices: RelationshipChoice[];
}
export interface PersonnelSlot {
  label: string;
  allowed: Position[];
  playerId: string;
}
export interface PersonnelPackage {
  id: string;
  name: string;
  description: string;
  slots: PersonnelSlot[];
}
export interface PracticePlan {
  intensity: PracticeIntensity;
  focus: PracticeFocus;
  reps: RepGroup;
  positionFocus: Position;
}
export interface ActionFeedback {
  id: string;
  title: string;
  result: string;
  why: string;
  deltas: string[];
  reactions: string[];
  callbacks: string[];
}
export interface GameSituation {
  id: string;
  quarter: number;
  clock: string;
  down: number;
  distance: number;
  yardLine: number;
  offenseLook: string;
  stakes: string;
  options: GameDecision[];
}
export interface GameDecision {
  id: string;
  title: string;
  call: DefensiveCall;
  packageId: string;
  description: string;
  risk: string;
}
export interface DrivePlay {
  id: string;
  down: number;
  distance: number;
  yardLine: number;
  result: string;
  yards: number;
  offense: boolean;
  scorer?: string;
  defender?: string;
}
export interface GameLogEntry {
  id: string;
  quarter: number;
  call: DefensiveCall | "offense";
  headline: string;
  detail: string;
  pointsFor: number;
  pointsAgainst: number;
  plays?: DrivePlay[];
}
export interface PostgameQuestion {
  question: string;
  context: string;
  choices: { id: string; title: string; effect: string }[];
  answered?: string;
}
export interface ActiveGame {
  opponent: Opponent;
  decisionIndex: number;
  homeScore: number;
  awayScore: number;
  complete: boolean;
  logs: GameLogEntry[];
  opponentLooks: Record<string, number>;
  callHistory: DefensiveCall[];
  situations: GameSituation[];
  decisionLedger: string[];
  postgameQuestion: PostgameQuestion | null;
  report: string[];
}
export interface JobOpportunity {
  id: string;
  school: string;
  level: Level;
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
export interface RecentGameResult {
  week: number;
  opponent: string;
  for: number;
  against: number;
  result: "W" | "L";
}
export interface AlumniPlayer {
  id: string;
  name: string;
  position: Position;
  graduationYear: number;
  finalOverall: number;
  note: string;
}
export interface MoneyAction {
  id: string;
  label: string;
  description: string;
  hours: number;
  cash: number;
  stress: number;
  fatigue: number;
  ethics: number;
  reputation: number;
  risk: string;
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
  level: Level;
  role: string;
  subject: string;
  philosophy: string;
  scheme: string;
  mode: "week" | "gameday" | "postgame" | "season-end" | "offseason";
  screen: Screen;
  wins: number;
  losses: number;
  conferenceRank: number;
  stateRank: number | null;
  nationalRank: number | null;
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
  moneyActionsTaken: string[];
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
  seasonHistory: SeasonResult[];
  defensivePlan: DefensiveCall;
  packages: PersonnelPackage[];
  practicePlan: PracticePlan;
  feedback: ActionFeedback | null;
  lockerRoomMorale: number;
  jobSecurity: number;
  recentResults: RecentGameResult[];
  alumni: AlumniPlayer[];
  offseasonWeeksRemaining: number;
}
