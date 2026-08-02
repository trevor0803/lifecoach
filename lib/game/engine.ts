import {
  ACTIVITIES,
  EVENTS,
  INITIAL_OPPORTUNITIES,
  INITIAL_ROSTER,
  OPPONENTS,
  RELATIONSHIPS,
} from "./data";
import type {
  ActivityDefinition,
  DefensiveCall,
  GameState,
  JobOpportunity,
  Player,
  Position,
  StoryEvent,
  TimelineEntry,
} from "./types";

export const SAVE_KEY = "coachs-legacy-save-v1";

const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

const hashString = (value: string) => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const randomStep = (seed: number) => {
  const next = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return [next / 4294967296, next] as const;
};

const randomBetween = (state: GameState, min: number, max: number) => {
  const [roll, seed] = randomStep(state.seed);
  state.seed = seed;
  return Math.floor(min + roll * (max - min + 1));
};

const timelineEntry = (
  state: GameState,
  category: TimelineEntry["category"],
  title: string,
  detail: string,
  significance = 1,
): TimelineEntry => ({
  id: `${state.year}-${state.week}-${state.timeline.length}-${state.seed}`,
  year: state.year,
  week: state.week,
  category,
  title,
  detail,
  significance,
});

export const makeInitialState = (
  coachName = "Trevor Hayes",
  philosophy = "Teacher of the game",
): GameState => ({
  version: 1,
  seed: hashString(`${coachName}-${Date.now()}`),
  coachName,
  age: 22,
  year: 2026,
  week: 1,
  day: "Monday",
  employer: "Westhaven High",
  mascot: "Wildcats",
  level: "HS",
  role: "Defensive Coordinator",
  subject: "U.S. History",
  philosophy,
  scheme: philosophy === "Attack every weakness" ? "Multiple pressure" : philosophy === "Protect the explosive" ? "Split-safety match" : "Flexible 4-2-5",
  mode: "week",
  screen: "career",
  wins: 0,
  losses: 0,
  conferenceRank: 1,
  reputation: 18,
  schemeKnowledge: 61,
  evaluation: 57,
  leadership: 54,
  recruiting: 33,
  ethics: 78,
  energy: 76,
  stress: 28,
  health: 82,
  family: 72,
  staffTrust: 64,
  teamTrust: 58,
  teaching: 63,
  cash: 2840,
  debt: 28700,
  creditScore: 648,
  salary: 48750,
  monthlyExpenses: 2785,
  housing: "One-bedroom apartment",
  relationshipStatus: "Single",
  timeLeft: 18,
  prep: 28,
  scouting: 15,
  install: 42,
  gradesDue: 14,
  selectedActivities: [],
  roster: copy(INITIAL_ROSTER),
  opponents: copy(OPPONENTS),
  relationships: copy(RELATIONSHIPS),
  currentEventId: EVENTS[0].id,
  resolvedEvents: [],
  timeline: [
    {
      id: "origin",
      year: 2026,
      week: 0,
      category: "life",
      title: "The playing career ends",
      detail: "A second knee reconstruction closes the NFL path. Westhaven offers a history classroom and control of the defense.",
      significance: 5,
    },
    {
      id: "hire",
      year: 2026,
      week: 0,
      category: "career",
      title: "Hired at Westhaven",
      detail: "At 22, you become the youngest coordinator in the district and return to the hallway where your football life began.",
      significance: 4,
    },
  ],
  memories: [],
  news: ["Westhaven opens the season unranked after graduating eight starters.", "Local expectations are modest. The staff privately believes the defense can carry the team."],
  activeGame: null,
  opportunities: copy(INITIAL_OPPORTUNITIES),
  seasons: [],
  defensivePlan: "balanced",
  lastSavedAt: Date.now(),
});

export const getCurrentOpponent = (state: GameState) =>
  state.opponents[Math.min(state.week - 1, state.opponents.length - 1)];

export const getCurrentEvent = (state: GameState): StoryEvent =>
  EVENTS.find((event) => event.id === state.currentEventId) ?? EVENTS[0];

export const getActivity = (id: string): ActivityDefinition | undefined =>
  ACTIVITIES.find((activity) => activity.id === id);

export const isEventResolved = (state: GameState) =>
  state.resolvedEvents.some((value) => value.startsWith(`${state.currentEventId}:`));

export const observedOverall = (player: Player, coachEvaluation: number) => {
  const certainty = clamp((player.evaluationConfidence + coachEvaluation) / 2, 15, 95);
  const spread = Math.max(2, Math.round((100 - certainty) / 8));
  const biasSeed = hashString(`${player.id}-${player.development}`);
  const bias = ((biasSeed % (spread * 2 + 1)) - spread) * (1 - certainty / 130);
  const center = clamp(Math.round(player.overall + bias), 40, 99);
  return {
    low: clamp(center - spread, 35, 99),
    high: clamp(center + spread, 35, 99),
    certainty: Math.round(certainty),
  };
};

const changeRelationship = (
  state: GameState,
  id: string,
  trust = 0,
  respect = 0,
  closeness = 0,
  status?: string,
) => {
  const relationship = state.relationships.find((item) => item.id === id);
  if (!relationship) return;
  relationship.trust = clamp(relationship.trust + trust);
  relationship.respect = clamp(relationship.respect + respect);
  relationship.closeness = clamp(relationship.closeness + closeness);
  if (status) relationship.status = status;
};

export const resolveStoryChoice = (current: GameState, choiceId: string): GameState => {
  if (isEventResolved(current)) return current;
  const state = copy(current);
  const event = getCurrentEvent(state);
  const choice = event.choices.find((item) => item.id === choiceId);
  if (!choice) return current;

  state.resolvedEvents.push(`${event.id}:${choiceId}`);
  let outcome = "The decision is made. People will remember how you handled it.";

  if (event.id === "depth-chart-meeting") {
    const marcus = state.roster.find((item) => item.id === "lb1")!;
    const eli = state.roster.find((item) => item.id === "lb2")!;
    if (choiceId === "captain") {
      marcus.depthRank = 1;
      eli.depthRank = 2;
      marcus.trust = clamp(marcus.trust + 7);
      eli.trust = clamp(eli.trust - 3);
      state.teamTrust = clamp(state.teamTrust + 3);
      state.install = clamp(state.install + 5);
      outcome = "Mercer accepts the stable choice. Marcus keeps the green dot, while Eli becomes quieter in meetings.";
    } else if (choiceId === "sophomore") {
      marcus.depthRank = 2;
      eli.depthRank = 1;
      marcus.trust = clamp(marcus.trust - 11);
      eli.trust = clamp(eli.trust + 12);
      state.teamTrust = clamp(state.teamTrust - 3);
      state.evaluation = clamp(state.evaluation + 2);
      state.memories.push({ key: "benched-captain", createdYear: state.year, createdWeek: state.week, people: ["Marcus Bell", "Eli Ward"], secrecy: 0, severity: 3, detail: "You recommended a sophomore over the senior captain before opening night." });
      outcome = "Mercer trusts your conviction. Eli gets the first series; Marcus says the right words, but the room feels the shock.";
    } else {
      state.install = clamp(state.install - 6);
      marcus.trust = clamp(marcus.trust - 3);
      eli.evaluationConfidence = clamp(eli.evaluationConfidence + 9);
      state.evaluation = clamp(state.evaluation + 1);
      outcome = "You gain better information, but both linebackers sense the indecision and Tuesday’s communication is uneven.";
    }
  }

  if (event.id === "papers-or-pressure") {
    if (choiceId === "grade") {
      state.gradesDue = 0;
      state.teaching = clamp(state.teaching + 7);
      state.prep = clamp(state.prep - 4);
      changeRelationship(state, "principal", 5, 3, 0);
      outcome = "The gradebook is clean before Ortiz checks it. Wednesday’s pressure install needs to be simplified.";
    } else if (choiceId === "film") {
      state.scouting = clamp(state.scouting + 12);
      state.prep = clamp(state.prep + 8);
      state.gradesDue += 6;
      state.teaching = clamp(state.teaching - 5);
      state.stress = clamp(state.stress + 6);
      outcome = "The protection answer is real. So is the email from Dr. Ortiz asking when students will receive feedback.";
    } else {
      state.prep = clamp(state.prep + 5);
      state.gradesDue = Math.max(3, state.gradesDue - 7);
      state.staffTrust = clamp(state.staffTrust + 5);
      changeRelationship(state, "hc", 3, 4, 0);
      outcome = "The assistant finds the protection key. Mercer notices that you delegated clearly instead of pretending you had unlimited time.";
    }
  }

  if (event.id === "parent-pressure") {
    if (choiceId === "boundary") {
      state.ethics = clamp(state.ethics + 5);
      state.reputation = clamp(state.reputation + 1);
      state.memories.push({ key: "booster-boundary", createdYear: state.year, createdWeek: state.week, people: ["Marcus Bell Sr."], secrecy: 1, severity: 2, detail: "You refused to discuss a donor’s playing-time demand." });
      outcome = "He leaves angry, but your answer is clean. By morning, Mercer has already heard about it—and backs you.";
    } else if (choiceId === "listen") {
      state.staffTrust = clamp(state.staffTrust + 1);
      state.stress = clamp(state.stress + 2);
      state.memories.push({ key: "booster-conversation", createdYear: state.year, createdWeek: state.week, people: ["Marcus Bell Sr."], secrecy: 4, severity: 2, detail: "You listened to a donor press for his son’s playing time and documented it." });
      outcome = "You write down the conversation and send it to Mercer. The father feels heard without receiving a promise.";
    } else {
      state.ethics = clamp(state.ethics - 9);
      state.staffTrust = clamp(state.staffTrust - 6);
      state.memories.push({ key: "booster-promise", createdYear: state.year, createdWeek: state.week, people: ["Marcus Bell", "Marcus Bell Sr."], secrecy: 7, severity: 6, detail: "You privately promised a donor that his son would start." });
      outcome = "The parking lot gets peaceful. Your next depth-chart conversation becomes much more dangerous.";
    }
  }

  if (event.id === "friday-dinner") {
    if (choiceId === "keep") {
      state.prep = Math.min(state.prep, 76);
      state.energy = clamp(state.energy + 3);
      changeRelationship(state, "emily", 7, 5, 9, "Interested, but watching your priorities");
      outcome = "You leave the office with two calls unfinished. Emily notices that your phone stays in your pocket at dinner.";
    } else if (choiceId === "cancel") {
      state.prep = clamp(state.prep + 11);
      state.scouting = clamp(state.scouting + 7);
      changeRelationship(state, "emily", -8, -3, -10, "Disappointed by another football-first choice");
      state.memories.push({ key: "cancelled-date-for-film", createdYear: state.year, createdWeek: state.week, people: ["Emily Hart"], secrecy: 0, severity: 2, detail: "You cancelled a family dinner with Emily to finish the third-down plan." });
      outcome = "The third-down checks are sharp. Emily replies ‘I understand’—and then stops initiating conversations.";
    } else {
      state.prep = clamp(state.prep + 5);
      state.stress = clamp(state.stress + 7);
      changeRelationship(state, "emily", -3, -4, 1, "Unsure whether you can be present");
      outcome = "You make both appearances and are fully present for neither. That becomes the part everyone remembers.";
    }
  }

  if (event.id === "injury-question") {
    if (choiceId === "facts") {
      state.ethics = clamp(state.ethics + 7);
      state.reputation = clamp(state.reputation + 3);
      state.staffTrust = clamp(state.staffTrust - 2);
      outcome = "The story is uncomfortable but accurate. The reporter’s final paragraph credits your transparency and the new practice limit.";
    } else if (choiceId === "trainer") {
      state.reputation = clamp(state.reputation - 1);
      state.ethics = clamp(state.ethics + 1);
      outcome = "The answer is defensible, but it sounds rehearsed. The reporter keeps asking players instead of closing her notebook.";
    } else {
      state.ethics = clamp(state.ethics - 14);
      state.reputation = clamp(state.reputation + 1);
      state.memories.push({ key: "denied-injury-report", createdYear: state.year, createdWeek: state.week, people: ["Jayden Reed", "Maya Chen"], secrecy: 8, severity: 9, detail: "You denied seeing a player stumble after contact despite witnessing it." });
      outcome = "The quote protects Friday night. It also gives the reporter a clean contradiction if a second source ever speaks.";
    }
  }

  if (event.id === "college-call") {
    const job = state.opportunities.find((item) => item.id === "coastal-qc")!;
    if (choiceId === "interest") {
      job.interest = clamp(job.interest + 24);
      job.status = "interview";
      changeRelationship(state, "friend", 5, 3, 3);
      state.staffTrust = clamp(state.staffTrust - 2);
      outcome = "Nate puts your name in front of the defensive coordinator. You now have a real interview—and a secret to manage.";
    } else if (choiceId === "stay") {
      state.staffTrust = clamp(state.staffTrust + 7);
      state.leadership = clamp(state.leadership + 2);
      job.status = "closed";
      outcome = "Mercer hears your commitment directly from you. He starts including you in next year’s staffing and schedule talks.";
    } else {
      state.staffTrust = clamp(state.staffTrust - 9);
      state.reputation = clamp(state.reputation + 2);
      job.interest = clamp(job.interest + 8);
      state.memories.push({ key: "leveraged-qc-interest", createdYear: state.year, createdWeek: state.week, people: ["Dan Mercer", "Nate Cole"], secrecy: 2, severity: 4, detail: "You used preliminary D1 interest to seek more money and authority." });
      outcome = "Mercer does not say no. He does ask whether you want to build Westhaven or merely use it.";
    }
  }

  if (event.id === "qb-dinner") {
    const noah = state.roster.find((item) => item.id === "qb1")!;
    if (choiceId === "staffed") {
      noah.trust = clamp(noah.trust + 9);
      noah.academics = clamp(noah.academics + 5);
      state.teamTrust = clamp(state.teamTrust + 2);
      state.timeLeft = Math.max(0, state.timeLeft - 3);
      state.ethics = clamp(state.ethics + 3);
      outcome = "Noah leaves with a protection plan and two adults aware of the meeting. His mother thanks the staff before her shift.";
    } else if (choiceId === "school") {
      noah.trust = clamp(noah.trust + 3);
      noah.academics = clamp(noah.academics + 3);
      state.teaching = clamp(state.teaching + 2);
      outcome = "The help arrives later but inside a clean boundary. Emily quietly adds Noah to her Monday check-in list.";
    } else {
      noah.trust = clamp(noah.trust + 12);
      state.scouting = clamp(state.scouting + 5);
      state.memories.push({ key: "private-player-visit", createdYear: state.year, createdWeek: state.week, people: ["Noah Bennett"], secrecy: 7, severity: 4, detail: "You privately hosted a player at your apartment without notifying a parent or staff member." });
      outcome = "The evening helps Noah immediately. The secrecy creates a version of the story you will not control if someone else tells it.";
    }
  }

  if (event.id === "scheme-dispute") {
    if (choiceId === "review") {
      state.staffTrust = clamp(state.staffTrust + 8);
      state.install = clamp(state.install - 3);
      state.schemeKnowledge = clamp(state.schemeKnowledge + 3);
      outcome = "Three clips prove Nolan right and two prove your pressure still has value. The revised call is better because the room was allowed to challenge it.";
    } else if (choiceId === "private") {
      state.staffTrust = clamp(state.staffTrust + 2);
      state.leadership = clamp(state.leadership + 2);
      state.prep = clamp(state.prep + 2);
      outcome = "Nolan accepts the boundary and you change one check privately. The staff sees authority without humiliation.";
    } else {
      state.staffTrust = clamp(state.staffTrust - 10);
      state.prep = clamp(state.prep + 3);
      state.memories.push({ key: "silenced-assistant", createdYear: state.year, createdWeek: state.week, people: ["Ray Nolan", "Dan Mercer"], secrecy: 1, severity: 3, detail: "You rejected a staff challenge without reviewing supporting film." });
      outcome = "The meeting ends on time. Nolan stops offering corrections in public—and begins saving clips for himself.";
    }
  }

  if (event.id === "alumni-night") {
    if (choiceId === "ride") {
      state.cash -= 54;
      state.energy = clamp(state.energy - 3);
      state.ethics = clamp(state.ethics + 3);
      outcome = "The truck stays overnight. The expense and inconvenience are real; the risk ends when the ride arrives.";
    } else if (choiceId === "couch") {
      state.energy = clamp(state.energy - 8);
      state.staffTrust = clamp(state.staffTrust + 4);
      outcome = "You wake up sore on a cheap couch. The assistant remembers that you accepted help before pride became danger.";
    } else {
      state.ethics = clamp(state.ethics - 16);
      const caught = randomBetween(state, 1, 100) <= 24;
      if (caught) {
        state.cash = Math.max(0, state.cash - 1300);
        state.reputation = clamp(state.reputation - 18);
        state.staffTrust = clamp(state.staffTrust - 14);
        state.memories.push({ key: "dui-arrest", createdYear: state.year, createdWeek: state.week, people: ["Nate Cole", "Ray Nolan", "County Police"], secrecy: 0, severity: 10, detail: "You were arrested for impaired driving after an alumni celebration." });
        outcome = "Blue lights appear two miles from home. The arrest becomes public before Sunday film begins; the job is now in real danger.";
      } else {
        state.health = clamp(state.health - 4);
        state.memories.push({ key: "impaired-drive", createdYear: state.year, createdWeek: state.week, people: ["Nate Cole", "Ray Nolan"], secrecy: 8, severity: 9, detail: "You drove home after drinking because you believed you could manage the risk." });
        outcome = "You reach the apartment without being stopped. That is luck, not proof the decision was safe—and two people know you made it.";
      }
    }
  }

  if (event.id === "student-crisis") {
    if (choiceId === "team") {
      state.teaching = clamp(state.teaching + 10);
      state.prep = clamp(state.prep - 6);
      changeRelationship(state, "principal", 7, 6, 2);
      changeRelationship(state, "emily", 4, 6, 3);
      outcome = "A housing liaison and counselor join the student before you leave. Practice starts without you, but the handoff is real.";
    } else if (choiceId === "counselor") {
      state.teaching = clamp(state.teaching + 4);
      state.prep = clamp(state.prep - 1);
      changeRelationship(state, "emily", 3, 3, 1);
      outcome = "Emily takes the case and confirms the student has a safe place tonight. You return to practice with a responsible handoff completed.";
    } else {
      state.teaching = clamp(state.teaching - 7);
      state.prep = clamp(state.prep + 3);
      state.memories.push({ key: "student-crisis-missed", createdYear: state.year, createdWeek: state.week, people: ["Unnamed sophomore"], secrecy: 9, severity: 5, detail: "You left a housing-insecure student with advice but no support handoff so you could reach practice." });
      outcome = "The install stays on schedule. The student is absent Friday, and nobody in the building knows what he told you.";
    }
  }

  state.timeline.unshift(timelineEntry(state, event.id.includes("dinner") ? "life" : "career", choice.title, outcome, 2));
  state.lastSavedAt = Date.now();
  return state;
};

const applyNumericEffect = (state: GameState, key: string, value: number) => {
  if (key === "prep") state.prep = clamp(state.prep + value);
  if (key === "scouting") state.scouting = clamp(state.scouting + value);
  if (key === "energy") state.energy = clamp(state.energy + value);
  if (key === "stress") state.stress = clamp(state.stress + value);
  if (key === "family") state.family = clamp(state.family + value);
  if (key === "staff") state.staffTrust = clamp(state.staffTrust + value);
  if (key === "teaching") state.teaching = clamp(state.teaching + value);
  if (key === "reputation") state.reputation = clamp(state.reputation + value);
  if (key === "cash") state.cash += value;
};

export const performActivity = (current: GameState, activityId: string): GameState => {
  const activity = getActivity(activityId);
  if (!activity || current.mode !== "week" || current.timeLeft < activity.hours) return current;
  const state = copy(current);
  state.timeLeft -= activity.hours;
  state.selectedActivities.push(activityId);
  Object.entries(activity.effects).forEach(([key, value]) => applyNumericEffect(state, key, value ?? 0));

  if (activityId === "mentor") {
    const eli = state.roster.find((item) => item.id === "lb2")!;
    eli.trust = clamp(eli.trust + 8);
    eli.evaluationConfidence = clamp(eli.evaluationConfidence + 8);
    eli.development += 2;
    changeRelationship(state, "hc", 1, 2, 0);
  }
  if (activityId === "grades") state.gradesDue = Math.max(0, state.gradesDue - 10);
  if (activityId === "family") changeRelationship(state, "mom", 4, 1, 7);
  if (activityId === "date") {
    changeRelationship(state, "emily", 5, 4, 8, "Getting to know each other");
    if (state.relationshipStatus === "Single" && state.relationships.find((item) => item.id === "emily")!.closeness >= 58) {
      state.relationshipStatus = "Dating Emily";
    }
  }
  if (activityId === "network") {
    changeRelationship(state, "friend", 4, 4, 3);
    const opportunity = state.opportunities.find((item) => item.id === "coastal-qc");
    if (opportunity) opportunity.interest = clamp(opportunity.interest + 5);
  }
  if (activityId === "contact") {
    state.install = clamp(state.install + 8);
    state.roster.forEach((item) => {
      if (["OL", "DL", "LB"].includes(item.position)) item.fatigue = clamp(item.fatigue + randomBetween(state, 3, 8));
    });
    const injuryRoll = randomBetween(state, 1, 100);
    if (injuryRoll <= 9) {
      const candidates = state.roster.filter((item) => item.depthRank <= 2);
      const injured = candidates[randomBetween(state, 0, candidates.length - 1)];
      injured.health = clamp(injured.health - randomBetween(state, 8, 22));
      state.news.unshift(`${injured.firstName} ${injured.lastName} left the live period early. The trainer lists him as limited.`);
    }
  }

  state.timeline.unshift(timelineEntry(state, activity.category === "life" || activity.category === "health" ? "life" : "football", activity.label, activity.description));
  state.lastSavedAt = Date.now();
  return state;
};

export const setDefensivePlan = (current: GameState, plan: DefensiveCall): GameState => ({
  ...current,
  defensivePlan: plan,
  lastSavedAt: Date.now(),
});

export const reorderDepthChart = (current: GameState, playerId: string, direction: -1 | 1): GameState => {
  const state = copy(current);
  const target = state.roster.find((item) => item.id === playerId);
  if (!target || !["DL", "LB", "CB", "S"].includes(target.position)) return current;
  const desired = target.depthRank + direction;
  if (desired < 1) return current;
  const swap = state.roster.find((item) => item.position === target.position && item.depthRank === desired);
  if (!swap) return current;
  swap.depthRank = target.depthRank;
  target.depthRank = desired;
  target.trust = clamp(target.trust + (direction < 0 ? 3 : -4));
  swap.trust = clamp(swap.trust + (direction < 0 ? -3 : 2));
  state.teamTrust = clamp(state.teamTrust + (target.leadership > swap.leadership && direction < 0 ? 1 : 0));
  state.timeline.unshift(timelineEntry(state, "football", `${target.firstName} ${target.lastName} moved to ${ordinal(desired)} string`, `You changed the ${target.position} rotation. Players evaluate what you reward, not only what you say.`));
  state.lastSavedAt = Date.now();
  return state;
};

const ordinal = (value: number) => (value === 1 ? "first" : value === 2 ? "second" : value === 3 ? "third" : `${value}th`);

const starterGroup = (state: GameState, position: Position, count: number) =>
  state.roster
    .filter((item) => item.position === position)
    .sort((a, b) => a.depthRank - b.depthRank)
    .slice(0, count);

const defensiveUnitRating = (state: GameState) => {
  const starters = [
    ...starterGroup(state, "DL", 2),
    ...starterGroup(state, "LB", 2),
    ...starterGroup(state, "CB", 2),
    ...starterGroup(state, "S", 1),
  ];
  const total = starters.reduce((sum, item) => {
    const availability = item.health / 100;
    const fatigue = 1 - item.fatigue / 180;
    const morale = 0.88 + item.morale / 850;
    return sum + item.overall * availability * fatigue * morale;
  }, 0);
  return total / starters.length;
};

const callMatchup = (call: DefensiveCall, opponent: GameState["opponents"][number]) => {
  if (call === "run-fit") return opponent.runRate >= 60 ? 9 : opponent.explosiveRate > 70 ? -8 : 2;
  if (call === "pressure") return opponent.pressureAnswer < 60 ? 10 : opponent.pressureAnswer > 76 ? -8 : 1;
  if (call === "shell") return opponent.explosiveRate > 65 ? 9 : opponent.runRate > 65 ? -7 : 3;
  if (call === "contain") return opponent.note.toLowerCase().includes("mobile") || opponent.pace > 75 ? 8 : opponent.runRate > 58 ? 3 : -1;
  return 3;
};

export const startGame = (current: GameState): GameState => {
  if (current.mode !== "week" || !isEventResolved(current)) return current;
  const state = copy(current);
  const opponent = getCurrentOpponent(state);
  state.mode = "gameday";
  state.activeGame = {
    opponent,
    series: 0,
    maxSeries: 10,
    homeScore: 0,
    awayScore: 0,
    complete: false,
    logs: [],
    opponentLooks: { run: opponent.runRate, pass: 100 - opponent.runRate, explosive: opponent.explosiveRate },
    callHistory: [],
  };
  state.lastSavedAt = Date.now();
  return state;
};

const scoreFromMargin = (margin: number, explosive: boolean) => {
  if (margin <= -12) return explosive ? 7 : 6;
  if (margin <= -5) return 3;
  return 0;
};

const defensiveHeadline = (points: number, margin: number) => {
  if (points >= 7) return "Explosive touchdown allowed";
  if (points > 0) return "Held them to three";
  if (margin > 15) return "Takeaway created";
  if (margin > 7) return "Three-and-out";
  return "Drive stopped";
};

const updateDefensiveStats = (state: GameState, margin: number) => {
  const linebackers = starterGroup(state, "LB", 2);
  const backs = [...starterGroup(state, "CB", 2), ...starterGroup(state, "S", 1)];
  linebackers.forEach((item) => { item.stats.tackles += randomBetween(state, 1, 3); });
  if (margin > 8) linebackers[randomBetween(state, 0, linebackers.length - 1)].stats.sacks += 1;
  if (margin > 15) backs[randomBetween(state, 0, backs.length - 1)].stats.interceptions += 1;
};

export const callDefensiveSeries = (current: GameState, call: DefensiveCall): GameState => {
  if (!current.activeGame || current.activeGame.complete) return current;
  const state = copy(current);
  const game = state.activeGame!;
  const opponent = game.opponent;
  const quarter = Math.min(4, Math.floor(game.series / 2.5) + 1);
  const recentCalls = (game.callHistory ?? []).slice(-4);
  const repetitions = recentCalls.filter((item) => item === call).length;
  const adaptationPenalty = Math.max(0, repetitions - 1) * 4.5;

  const unit = defensiveUnitRating(state);
  const preparation = state.prep * 0.11 + state.scouting * 0.08 + state.install * 0.06;
  const trust = (state.teamTrust - 50) * 0.08;
  const defenseExecution = unit + preparation + trust + callMatchup(call, opponent) - adaptationPenalty + randomBetween(state, -10, 10);
  const offenseExecution = opponent.offense + randomBetween(state, -10, 11) + (game.series > 7 ? opponent.discipline * 0.04 : 0);
  const margin = defenseExecution - offenseExecution;
  const explosive = offenseExecution - defenseExecution > 15 || (randomBetween(state, 1, 100) < opponent.explosiveRate / 4 && call !== "shell");
  const against = scoreFromMargin(margin, explosive);
  game.awayScore += against;

  const homeExecution = 73 + state.teamTrust * 0.04 + randomBetween(state, -12, 12);
  const opponentDefense = opponent.defense + randomBetween(state, -8, 9);
  const homeMargin = homeExecution - opponentDefense;
  const forPoints = homeMargin > 10 ? 7 : homeMargin > 1 ? 3 : homeMargin < -13 && randomBetween(state, 1, 100) < 18 ? -2 : 0;
  if (forPoints === -2) game.awayScore += 2;
  else game.homeScore += forPoints;

  const callLabels: Record<DefensiveCall, string> = {
    "run-fit": "Heavy run fit",
    balanced: "Balanced match",
    pressure: "Five-man pressure",
    shell: "Two-high shell",
    contain: "Rush-lane contain",
  };
  const repetitionRead = adaptationPenalty > 0 ? " They recognized the repeated structure and checked toward its stress point." : "";
  const detail = margin > 8
    ? `${callLabels[call]} matched the look. Communication and leverage forced the offense behind schedule.`
    : margin > -5
      ? `${callLabels[call]} survived, but one lost leverage rep extended the possession.`
      : `${callLabels[call]} ran into the offense’s answer. Their execution attacked the call’s weak space.${repetitionRead}`;
  game.logs.unshift({
    id: `${state.year}-${state.week}-${game.series}-${state.seed}`,
    quarter,
    call,
    headline: defensiveHeadline(against, margin),
    detail,
    pointsFor: Math.max(0, forPoints),
    pointsAgainst: against + (forPoints === -2 ? 2 : 0),
  });
  updateDefensiveStats(state, margin);
  game.callHistory = [...(game.callHistory ?? []), call];
  game.series += 1;

  state.roster.forEach((item) => {
    if (item.depthRank <= 2) item.fatigue = clamp(item.fatigue + randomBetween(state, 1, 3));
  });

  if (game.series >= game.maxSeries) {
    if (game.homeScore === game.awayScore) {
      const overtimeEdge = defensiveUnitRating(state) + randomBetween(state, -8, 8) - opponent.offense;
      if (overtimeEdge >= 0) game.homeScore += 7;
      else game.awayScore += 7;
      game.logs.unshift({ id: `ot-${state.seed}`, quarter: 5, call, headline: "Overtime decided", detail: overtimeEdge >= 0 ? "The defense gets the stop and Westhaven answers." : "The opponent converts in the red zone and Westhaven cannot match it.", pointsFor: overtimeEdge >= 0 ? 7 : 0, pointsAgainst: overtimeEdge < 0 ? 7 : 0 });
    }
    game.complete = true;
    state.mode = "postgame";
    const won = game.homeScore > game.awayScore;
    state.wins += won ? 1 : 0;
    state.losses += won ? 0 : 1;
    state.reputation = clamp(state.reputation + (won ? 4 : -1));
    state.teamTrust = clamp(state.teamTrust + (won ? 4 : -3));
    state.staffTrust = clamp(state.staffTrust + (won ? 3 : -2));
    state.timeline.unshift(timelineEntry(state, "football", `${won ? "Won" : "Lost"} vs. ${opponent.name}`, `Westhaven ${game.homeScore}, ${opponent.name} ${game.awayScore}. The result came from preparation, matchups, player execution and your calls.`, won ? 4 : 3));
    state.news.unshift(`Westhaven ${won ? "beats" : "falls to"} ${opponent.name}, ${game.homeScore}-${game.awayScore}.`);
  }
  state.lastSavedAt = Date.now();
  return state;
};

const developmentWeek = (state: GameState) => {
  state.roster.forEach((item) => {
    const reps = item.depthRank === 1 ? 1.25 : item.depthRank === 2 ? 0.8 : 0.35;
    const mentorship = item.id === "lb2" ? state.selectedActivities.filter((id) => id === "mentor").length * 0.8 : 0;
    const roomQuality = (state.schemeKnowledge + state.leadership) / 200;
    const ceiling = Math.max(0, item.potential - item.overall);
    const growth = ceiling > 0 ? (reps * roomQuality + mentorship) * (ceiling / 35) : 0;
    item.development += growth;
    if (item.development >= 10) {
      item.overall = clamp(item.overall + 1, 0, item.potential);
      item.development -= 10;
    }
    item.evaluationConfidence = clamp(item.evaluationConfidence + (state.selectedActivities.includes("film") ? 2 : 1));
    item.fatigue = clamp(item.fatigue - 13);
    item.health = clamp(item.health + 4);
    item.stats.games += item.depthRank <= 2 ? 1 : 0;
  });
};

const updateJobMarket = (state: GameState) => {
  state.opportunities.forEach((job) => {
    if (job.status === "closed") return;
    const winning = state.wins - state.losses;
    const relationshipBoost = job.id === "coastal-qc" ? (state.relationships.find((item) => item.id === "friend")?.respect ?? 0) / 20 : 0;
    job.interest = clamp(job.interest + Math.max(0, winning) + state.reputation / 30 + relationshipBoost);
    if (job.interest >= 72) job.status = "offered";
    else if (job.interest >= 48) job.status = "interview";
    else if (job.interest >= 30) job.status = "available";
  });
};

export const advanceWeek = (current: GameState): GameState => {
  if (current.mode !== "postgame") return current;
  const state = copy(current);
  developmentWeek(state);
  updateJobMarket(state);
  if (!state.selectedActivities.includes("family") && !state.selectedActivities.includes("date")) {
    state.family = clamp(state.family - 3);
    changeRelationship(state, "mom", -1, 0, -2);
    if (state.relationshipStatus !== "Single") changeRelationship(state, "emily", -2, 0, -3);
  }
  if (!state.selectedActivities.includes("grades") && state.gradesDue > 8) {
    state.teaching = clamp(state.teaching - 3);
    state.gradesDue += 5;
  }
  if (state.week % 4 === 0) {
    const takeHome = Math.round(state.salary / 12 * 0.78);
    state.cash += takeHome - state.monthlyExpenses;
    state.debt = Math.max(0, state.debt + 120);
    state.timeline.unshift(timelineEntry(state, "money", "Monthly bills settled", `$${takeHome.toLocaleString()} take-home income against $${state.monthlyExpenses.toLocaleString()} in expenses. Student-loan interest still accrues.`));
  }
  state.week += 1;
  state.activeGame = null;
  state.mode = state.week > state.opponents.length ? "season-end" : "week";
  state.timeLeft = 18;
  state.prep = 24;
  state.scouting = 12;
  state.install = Math.max(30, Math.round(state.install * 0.62));
  state.energy = clamp(state.energy + 14);
  state.stress = clamp(state.stress - 8);
  state.selectedActivities = [];
  state.currentEventId = EVENTS[(state.week - 1) % EVENTS.length].id;
  if (state.mode === "season-end") {
    const achievement = state.wins >= 9 ? "District champion" : state.wins >= 7 ? "Playoff qualifier" : state.wins >= 5 ? "Winning season" : "Rebuilding year";
    state.seasons.unshift({ year: state.year, employer: state.employer, role: state.role, wins: state.wins, losses: state.losses, achievement });
    state.timeline.unshift(timelineEntry(state, "career", "Season complete", `${state.wins}-${state.losses}, ${achievement}. The coaching market now weighs the tape, relationships and reputation you built.`, 5));
    updateJobMarket(state);
  }
  state.lastSavedAt = Date.now();
  return state;
};

export const payDebt = (current: GameState, amount: number): GameState => {
  if (current.cash < amount || amount <= 0) return current;
  const state = copy(current);
  state.cash -= amount;
  state.debt = Math.max(0, state.debt - amount);
  state.creditScore = clamp(state.creditScore + Math.max(1, Math.round(amount / 500)), 300, 850);
  state.timeline.unshift(timelineEntry(state, "money", "Extra debt payment", `$${amount.toLocaleString()} sent toward student loans. Liquidity falls, but your balance and credit trajectory improve.`));
  state.lastSavedAt = Date.now();
  return state;
};

export const spendRelationshipTime = (current: GameState, relationshipId: string): GameState => {
  if (current.timeLeft < 2 || current.mode !== "week") return current;
  const state = copy(current);
  const relationship = state.relationships.find((item) => item.id === relationshipId);
  if (!relationship) return current;
  state.timeLeft -= 2;
  relationship.trust = clamp(relationship.trust + 3);
  relationship.closeness = clamp(relationship.closeness + 5);
  state.energy = clamp(state.energy + (relationshipId === "hc" ? -2 : 2));
  if (relationshipId === "hc") state.staffTrust = clamp(state.staffTrust + 3);
  if (relationshipId === "mom") state.family = clamp(state.family + 5);
  state.timeline.unshift(timelineEntry(state, "relationship", `Time with ${relationship.name}`, `You invested two scarce hours. The conversation becomes part of the relationship’s history.`));
  state.lastSavedAt = Date.now();
  return state;
};

export const interviewForJob = (current: GameState, jobId: string): GameState => {
  const state = copy(current);
  const job = state.opportunities.find((item) => item.id === jobId);
  if (!job || !["available", "interview"].includes(job.status) || state.timeLeft < 3) return current;
  state.timeLeft -= 3;
  const fit = state.reputation * 0.28 + state.leadership * 0.18 + state.schemeKnowledge * 0.2 + state.staffTrust * 0.12 + randomBetween(state, -8, 10);
  job.interest = clamp(job.interest + Math.round(fit / 12));
  job.status = job.interest >= 72 ? "offered" : "interview";
  state.staffTrust = clamp(state.staffTrust - 2);
  state.timeline.unshift(timelineEntry(state, "career", `Interviewed with ${job.school}`, `The conversation focused on ${job.requirements.join(", ").toLowerCase()}. Interest is real, but the current staff may learn you took the call.`, 3));
  state.lastSavedAt = Date.now();
  return state;
};

export const acceptJob = (current: GameState, jobId: string): GameState => {
  const state = copy(current);
  const job = state.opportunities.find((item) => item.id === jobId);
  if (!job || job.status !== "offered" || state.mode !== "season-end") return current;
  state.seasons[0] = state.seasons[0] ?? { year: state.year, employer: state.employer, role: state.role, wins: state.wins, losses: state.losses, achievement: "Season complete" };
  state.timeline.unshift(timelineEntry(state, "career", `Accepted: ${job.role}`, `${job.school} hires you for $${job.salary.toLocaleString()} per year. Your authority, recruiting territory and daily work will change with the role.`, 5));
  state.employer = job.school;
  state.mascot = job.level === "FBS" ? "Mariners" : job.level === "D3" ? "Saints" : "Ravens";
  state.level = job.level;
  state.role = job.role;
  state.salary = job.salary;
  state.reputation = clamp(state.reputation + 7);
  state.staffTrust = 42;
  job.status = "closed";
  return beginNextSeason(state);
};

export const beginNextSeason = (current: GameState): GameState => {
  if (current.mode !== "season-end") return current;
  const state = copy(current);
  state.age += 1;
  state.year += 1;
  state.week = 1;
  state.wins = 0;
  state.losses = 0;
  state.mode = "week";
  state.timeLeft = state.level === "HS" ? 18 : 22;
  state.prep = 24;
  state.scouting = 12;
  state.install = 35;
  state.currentEventId = EVENTS[0].id;
  state.activeGame = null;
  state.selectedActivities = [];
  state.opponents = copy(OPPONENTS).map((opponent, index) => ({ ...opponent, offense: clamp(opponent.offense + (state.level === "HS" ? randomBetween(state, -3, 3) : 5)), defense: clamp(opponent.defense + randomBetween(state, -3, 4)), record: "0-0", id: `${opponent.id}-${state.year}-${index}` }));
  state.roster.forEach((item) => {
    item.morale = clamp(item.morale + 5);
    item.fatigue = 5;
    item.health = clamp(item.health + 10);
    item.stats = { games: 0, tackles: 0, sacks: 0, interceptions: 0, touchdowns: 0, yards: 0 };
  });
  state.opportunities = copy(INITIAL_OPPORTUNITIES).map((job) => ({ ...job, id: `${job.id}-${state.year}`, interest: Math.max(8, Math.round(job.interest * 0.55)), status: "watching" } as JobOpportunity));
  state.lastSavedAt = Date.now();
  return state;
};

export const activityDefinitions = ACTIVITIES;
export const defensiveCalls: Array<{ id: DefensiveCall; name: string; description: string; risk: string }> = [
  { id: "run-fit", name: "Heavy run fit", description: "Spin a safety down and close interior gaps.", risk: "Exposes play-action seams" },
  { id: "balanced", name: "Balanced match", description: "Keep two answers alive and rally to the ball.", risk: "Few free wins" },
  { id: "pressure", name: "Five-man pressure", description: "Stress protection and force a fast decision.", risk: "One missed fit can become six" },
  { id: "shell", name: "Two-high shell", description: "Deny explosives and disguise the rotation.", risk: "Light box against the run" },
  { id: "contain", name: "Rush-lane contain", description: "Keep the quarterback inside and squeeze slowly.", risk: "Less immediate pressure" },
];
