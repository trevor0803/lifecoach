import {
  ACTIVITIES,
  EVENTS,
  INITIAL_OPPORTUNITIES,
  INITIAL_PACKAGES,
  INITIAL_ROSTER,
  MONEY_ACTIONS,
  OPPONENTS,
  RELATIONSHIPS,
  RELATIONSHIP_SCENES,
  makePlayerStats,
} from "./data";
import type {
  ActivityDefinition,
  DefensiveCall,
  GameDecision,
  GameSituation,
  GameState,
  MoneyAction,
  Opponent,
  Player,
  Position,
  PracticePlan,
  Relationship,
  SeasonResult,
  StoryEvent,
  TimelineEntry,
} from "./types";

export const SAVE_KEY = "coachs-legacy-save-v2";
export const OLD_SAVE_KEY = "coachs-legacy-save-v1";
const copy = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const clamp = (v: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, v));
const hashString = (v: string) => {
  let h = 2166136261;
  for (let i = 0; i < v.length; i++) {
    h ^= v.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};
const rand = (s: GameState, min: number, max: number) => {
  s.seed = (Math.imul(s.seed, 1664525) + 1013904223) >>> 0;
  return Math.floor(min + (s.seed / 4294967296) * (max - min + 1));
};
const entry = (
  s: GameState,
  category: TimelineEntry["category"],
  title: string,
  detail: string,
  significance = 1,
): TimelineEntry => ({
  id: `${s.year}-${s.week}-${s.seed}-${s.timeline.length}`,
  year: s.year,
  week: s.week,
  category,
  title,
  detail,
  significance,
});
const feedback = (
  s: GameState,
  title: string,
  result: string,
  why: string,
  deltas: string[] = [],
  reactions: string[] = [],
  callbacks: string[] = [],
) => {
  s.feedback = {
    id: `f-${s.seed}-${Date.now()}`,
    title,
    result,
    why,
    deltas,
    reactions,
    callbacks,
  };
};
const relation = (
  s: GameState,
  id: string,
  trust = 0,
  respect = 0,
  closeness = 0,
  status?: string,
) => {
  const r = s.relationships.find((x) => x.id === id);
  if (!r) return;
  r.trust = clamp(r.trust + trust);
  r.respect = clamp(r.respect + respect);
  r.closeness = clamp(r.closeness + closeness);
  r.neglect = 0;
  if (status) r.status = status;
};
const remember = (
  s: GameState,
  id: string,
  title: string,
  detail: string,
  tone: Relationship["history"][number]["tone"],
  sticky = true,
) => {
  const r = s.relationships.find((x) => x.id === id);
  if (!r) return;
  r.lastInteraction = detail;
  r.history.unshift({
    id: `${s.year}-${s.week}-${id}-${s.seed}`,
    year: s.year,
    week: s.week,
    title,
    detail,
    tone,
    sticky,
  });
};

const initialSeasonHistory: SeasonResult[] = [];
export const makeInitialState = (
  coachName = "Trevor Hayes",
  philosophy = "Teacher of the game",
): GameState => ({
  version: 2,
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
  scheme:
    philosophy === "Attack every weakness"
      ? "Multiple pressure"
      : philosophy === "Protect the explosive"
        ? "Split-safety match"
        : "Flexible 4-2-5",
  mode: "week",
  screen: "career",
  wins: 0,
  losses: 0,
  conferenceRank: 1,
  stateRank: null,
  nationalRank: null,
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
  moneyActionsTaken: [],
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
      detail:
        "A second knee reconstruction closes the NFL path. Westhaven offers a history classroom and control of the defense.",
      significance: 5,
    },
    {
      id: "hire",
      year: 2026,
      week: 0,
      category: "career",
      title: "Hired at Westhaven",
      detail:
        "At 22, you become the youngest coordinator in the district and return to the hallway where your football life began.",
      significance: 4,
    },
  ],
  memories: [],
  news: [
    "Westhaven opens unranked after graduating eight starters.",
    "The staff privately believes the defense can carry the team.",
  ],
  activeGame: null,
  opportunities: copy(INITIAL_OPPORTUNITIES),
  seasonHistory: initialSeasonHistory,
  defensivePlan: "balanced",
  packages: copy(INITIAL_PACKAGES),
  practicePlan: {
    intensity: "normal",
    focus: "scheme",
    reps: "balanced",
    positionFocus: "LB",
  },
  feedback: null,
  lockerRoomMorale: 68,
  jobSecurity: 73,
  recentResults: [],
  alumni: [],
  offseasonWeeksRemaining: 0,
});

const normalizeStats = (p: Partial<Player>) => ({
  ...makePlayerStats(),
  ...(p.stats ?? {}),
});
export const migrateGameState = (raw: Partial<GameState>): GameState => {
  const base = makeInitialState(
    raw.coachName ?? "Trevor Hayes",
    raw.philosophy ?? "Teacher of the game",
  );
  const s = { ...base, ...raw, version: 2 } as GameState;
  const oldPlayers = new Map((raw.roster ?? []).map((p) => [p.id, p]));
  s.roster = base.roster.map((p) => {
    const old = oldPlayers.get(p.id);
    return old
      ? {
          ...p,
          ...old,
          ratings: { ...p.ratings, ...old.ratings },
          stats: normalizeStats(old),
        }
      : p;
  });
  s.relationships = base.relationships.map((p) => {
    const old = (raw.relationships ?? []).find((r) => r.id === p.id);
    return old ? { ...p, ...old, history: old.history ?? p.history } : p;
  });
  s.opponents = (raw.opponents?.length ? raw.opponents : base.opponents).map(
    (o, i) => ({ ...base.opponents[i % base.opponents.length], ...o }),
  );
  s.packages = raw.packages?.length ? raw.packages : copy(INITIAL_PACKAGES);
  s.feedback = null;
  s.moneyActionsTaken = raw.moneyActionsTaken ?? [];
  s.recentResults = raw.recentResults ?? [];
  s.alumni = raw.alumni ?? [];
  s.seasonHistory = raw.seasonHistory ?? [];
  const bad =
    s.recentResults.slice(0, 3).length === 3 &&
    s.recentResults.slice(0, 3).every((g) => g.result === "L") &&
    s.recentResults.slice(0, 3).reduce((n, g) => n + g.against - g.for, 0) >=
      45;
  if (bad && s.mode === "week") s.currentEventId = "mercer-three-loss-review";
  return s;
};

export const getCurrentOpponent = (s: GameState) =>
  s.opponents[Math.min(s.week - 1, s.opponents.length - 1)];
export const getCurrentEvent = (s: GameState): StoryEvent =>
  EVENTS.find(
    (e) => e.id === s.currentEventId.replace(/-\d{4}(?:-\d+)?$/, ""),
  ) ??
  EVENTS.find((e) => e.id === s.currentEventId) ??
  EVENTS[0];
export const getActivity = (id: string) => ACTIVITIES.find((a) => a.id === id);
export const isEventResolved = (s: GameState) =>
  s.resolvedEvents.some((v) => v.startsWith(`${s.currentEventId}:`));
export const observedOverall = (p: Player, coach: number) => {
  const certainty = clamp((p.evaluationConfidence + coach) / 2, 15, 95),
    spread = Math.max(2, Math.round((100 - certainty) / 8)),
    bias =
      ((hashString(`${p.id}-${p.development}`) % (spread * 2 + 1)) - spread) *
      (1 - certainty / 130),
    center = clamp(Math.round(p.overall + bias), 40, 99);
  return {
    low: clamp(center - spread, 35, 99),
    high: clamp(center + spread, 35, 99),
    certainty: Math.round(certainty),
  };
};

export const resolveStoryChoice = (
  current: GameState,
  choiceId: string,
): GameState => {
  if (isEventResolved(current)) return current;
  const s = copy(current),
    event = getCurrentEvent(s),
    choice = event.choices.find((c) => c.id === choiceId);
  if (!choice) return current;
  s.resolvedEvents.push(`${s.currentEventId}:${choiceId}`);
  let result = `You chose “${choice.title}.” The immediate problem moves, but the people in the room keep their version.`,
    deltas: string[] = [],
    reactions: string[] = [],
    callbacks: string[] = [];
  const positive = choice.signals.some(
    (x) =>
      x.includes("+") ||
      /honesty|balanced|integrity|safe|evidence|accountability/.test(x),
  );
  const risky = choice.signals.some(
    (x) => x.includes("risk") || /−|serious|exposure|resentment|split/.test(x),
  );
  s.leadership = clamp(s.leadership + (positive ? 2 : 0) - (risky ? 1 : 0));
  s.staffTrust = clamp(s.staffTrust + (positive ? 2 : 0) - (risky ? 3 : 0));
  s.teamTrust = clamp(s.teamTrust + (positive ? 1 : 0) - (risky ? 2 : 0));
  if (event.id === "depth-chart-meeting") {
    const marcus = s.roster.find((p) => p.id === "lb1")!,
      eli = s.roster.find((p) => p.id === "lb2")!;
    if (choiceId === "captain") {
      marcus.depthRank = 1;
      eli.depthRank = 2;
      marcus.trust += 7;
      eli.trust -= 3;
      result =
        "Marcus keeps the green dot. Eli nods, then asks for the missed-assignment clips after everyone leaves.";
      deltas = ["Marcus trust +7", "Eli trust −3", "Install +5"];
      s.install = clamp(s.install + 5);
      callbacks = ["Mercer will revisit this if Marcus misses another fit."];
    }
    if (choiceId === "sophomore") {
      marcus.depthRank = 2;
      eli.depthRank = 1;
      marcus.trust -= 11;
      eli.trust += 12;
      s.evaluation += 2;
      s.memories.push({
        key: "benched-captain",
        createdYear: s.year,
        createdWeek: s.week,
        people: ["Marcus Bell", "Eli Ward"],
        secrecy: 0,
        severity: 3,
        detail: "You recommended the sophomore over the captain.",
      });
      result =
        "Eli gets the first series. Marcus says the right words, but the room feels the shock.";
      deltas = ["Eli trust +12", "Marcus trust −11", "Evaluation +2"];
      callbacks = ["The captain and Mercer will judge this by real snaps."];
    }
    if (choiceId === "split") {
      s.install -= 6;
      eli.evaluationConfidence += 9;
      result =
        "You gain information and lose clean installation. Both linebackers feel the delay.";
      deltas = ["Evaluation confidence +9", "Install −6"];
      callbacks = ["A close game may expose the divided preparation."];
    }
  }
  if (
    choiceId === "promise" ||
    choiceId === "deny" ||
    choiceId === "alone" ||
    choiceId === "respond" ||
    choiceId === "block"
  ) {
    s.ethics = clamp(s.ethics - 6);
    s.memories.push({
      key: `${event.id}-${choiceId}`,
      createdYear: s.year,
      createdWeek: s.week,
      people: event.people,
      secrecy: 6,
      severity: 6,
      detail: `${event.title}: ${choice.title}`,
    });
    callbacks.push(
      "This private version can return through a parent, reporter, player or employer.",
    );
  }
  if (event.id.includes("papers") && choiceId === "grade") {
    s.gradesDue = 0;
    s.teaching += 7;
    s.prep -= 4;
    relation(s, "principal", 5, 3);
    deltas = ["Grades due → 0", "Teaching +7", "Prep −4"];
  }
  if (event.id.includes("papers") && choiceId === "film") {
    s.scouting += 12;
    s.prep += 8;
    s.gradesDue += 6;
    s.teaching -= 5;
    s.stress += 6;
    deltas = ["Prep +8", "Scouting +12", "Grades due +6", "Stress +6"];
    callbacks = ["Ortiz will ask where student feedback went."];
  }
  if (event.id === "friday-dinner" && choiceId === "keep") {
    relation(s, "emily", 7, 5, 9);
    remember(
      s,
      "emily",
      "You kept the dinner",
      "You arrived on time and kept your phone away.",
      "warm",
    );
    reactions = ["Emily felt chosen, not fitted around football."];
  }
  if (event.id === "friday-dinner" && choiceId === "cancel") {
    s.prep += 11;
    relation(s, "emily", -8, -3, -10);
    remember(
      s,
      "emily",
      "Dinner cancelled for film",
      "She said she understood, then stopped initiating.",
      "hurt",
    );
    deltas = ["Prep +11", "Emily closeness −10"];
    callbacks = [
      "Another cancellation will feel like a pattern, not a single week.",
    ];
  }
  if (event.id === "scheme-dispute" && choiceId === "review") {
    s.staffTrust += 8;
    s.schemeKnowledge += 3;
    relation(s, "assistant", 7, 5, 2);
    remember(
      s,
      "assistant",
      "His clips changed the call",
      "You let the evidence win in front of the room.",
      "proud",
    );
    deltas = ["Staff trust +8", "Scheme +3"];
  }
  if (event.id === "scheme-dispute" && choiceId === "shut") {
    s.staffTrust -= 10;
    relation(s, "assistant", -10, -6, -4);
    remember(
      s,
      "assistant",
      "Silenced in the staff room",
      "He stopped volunteering corrections.",
      "hurt",
    );
    callbacks = ["Nolan is saving his best evidence for himself."];
  }
  reactions.push(
    ...event.people
      .slice(0, 2)
      .map((p) => `${p} will remember how you handled this meeting.`),
  );
  s.timeline.unshift(entry(s, "career", event.title, result, 3));
  feedback(
    s,
    event.title,
    result,
    "The choice changed trust, preparation and what people expect next.",
    deltas,
    reactions,
    callbacks,
  );
  return s;
};

export const doActivity = (current: GameState, id: string): GameState => {
  const a = getActivity(id);
  if (!a || current.mode !== "week" || current.timeLeft < a.hours)
    return current;
  const s = copy(current);
  s.timeLeft -= a.hours;
  s.selectedActivities.push(id);
  Object.entries(a.effects).forEach(([k, v]) => {
    const n = v ?? 0;
    if (k === "staff") s.staffTrust = clamp(s.staffTrust + n);
    else if (k in s)
      (s as unknown as Record<string, number>)[k] = clamp(
        (s as unknown as Record<string, number>)[k] + n,
      );
  });
  let result = a.description;
  const deltas = [`${a.hours} hours used`],
    reactions: string[] = [];
  if (id === "mentor") {
    const p = s.roster
      .filter((x) => x.position === "LB")
      .sort((x, y) => y.potential - x.potential)[0];
    p.trust = clamp(p.trust + 6);
    p.evaluationConfidence = clamp(p.evaluationConfidence + 5);
    p.weeklyReps += 8;
    p.roleNote = "Your individual film session gave him one clear correction.";
    result = `${p.firstName} ${p.lastName} identified the fit before you paused the film. His next practice grade improved.`;
    deltas.push(`${p.firstName} trust +6`, `Evaluation confidence +5`);
    reactions.push(`${p.firstName} stayed after to ask for one more cut-up.`);
  }
  if (id === "grades") {
    s.gradesDue = Math.max(0, s.gradesDue - 12);
    relation(s, "principal", 4, 3);
    result =
      "Students received specific comments before the next class. Ortiz noticed the turnaround.";
    deltas.push("Grades due −12", "Ortiz trust +4");
  }
  if (id === "family") {
    relation(s, "mom", 5, 2, 7);
    remember(
      s,
      "mom",
      "Dinner without an agenda",
      "You stayed through coffee instead of leaving after the meal.",
      "warm",
    );
    result =
      "Mom talked about something other than football or your knee. She noticed that you stayed.";
    reactions.push(
      "Patricia felt like your mother, not your emergency contact.",
    );
  }
  if (id === "date") {
    relation(s, "emily", 5, 4, 8);
    remember(
      s,
      "emily",
      "A real date",
      "Conversation kept going after the restaurant closed.",
      "warm",
    );
    if (s.relationships.find((x) => x.id === "emily")!.closeness >= 58)
      s.relationshipStatus = "Dating Emily";
    result =
      "The date felt easy because you were present. Emily called the next morning instead of waiting for you.";
    deltas.push("Emily closeness +8");
  }
  if (id === "contact") {
    s.roster
      .filter((p) => ["OL", "DL", "LB"].includes(p.position))
      .forEach((p) => (p.fatigue = clamp(p.fatigue + rand(s, 3, 8))));
    if (rand(s, 1, 100) <= 9) {
      const p = s.roster.filter((x) => x.depthRank <= 2)[rand(s, 0, 20)];
      if (p) {
        p.health -= rand(s, 8, 20);
        p.injury = "Limited after contact";
        reactions.push(`${p.firstName} ${p.lastName} left with the trainer.`);
      }
    }
  }
  s.timeline.unshift(
    entry(
      s,
      a.category === "life" || a.category === "health" ? "life" : "football",
      a.label,
      result,
    ),
  );
  feedback(
    s,
    a.label,
    result,
    "Time, attention and repetition changed a specific person or obligation.",
    deltas,
    reactions,
    ["The weekly pattern will affect trust and readiness at game time."],
  );
  return s;
};

export const setPracticePlan = (
  current: GameState,
  patch: Partial<PracticePlan>,
): GameState => {
  if (current.mode !== "week") return current;
  const s = copy(current);
  s.practicePlan = { ...s.practicePlan, ...patch };
  const multiplier =
    s.practicePlan.intensity === "physical"
      ? 1.35
      : s.practicePlan.intensity === "walkthrough"
        ? 0.7
        : 1;
  s.roster.forEach((p) => {
    const repBase =
      s.practicePlan.reps === "starters"
        ? p.depthRank === 1
          ? 12
          : 3
        : s.practicePlan.reps === "young-players"
          ? p.grade <= 10
            ? 12
            : 5
          : 8;
    const focus = p.position === s.practicePlan.positionFocus ? 1.4 : 1;
    p.weeklyReps = Math.round(repBase * focus);
    p.weeklyGrade = clamp(
      Math.round(
        (p.overall + p.ratings.discipline + s.install) / 3 + rand(s, -6, 6),
      ),
    );
    p.evaluationConfidence = clamp(
      p.evaluationConfidence + (s.practicePlan.focus === "evaluation" ? 4 : 2),
    );
    p.fatigue = clamp(p.fatigue + Math.round(3 * multiplier));
    p.development +=
      Math.max(0, (p.potential - p.overall) / 45) * multiplier * focus;
  });
  s.install = clamp(s.install + (s.practicePlan.focus === "scheme" ? 6 : 3));
  feedback(
    s,
    "Practice plan installed",
    `${s.practicePlan.intensity} practice emphasized ${s.practicePlan.focus}, ${s.practicePlan.reps} and the ${s.practicePlan.positionFocus} room.`,
    "Actual player reps, grades, fatigue and evaluation confidence moved.",
    ["Install +3 to +6", "Every player received tracked reps"],
    [
      s.practicePlan.reps === "starters"
        ? "Backups noticed the rep imbalance."
        : "The rotation understood where opportunity came from.",
    ],
    ["Game execution uses these reps and grades."],
  );
  return s;
};
export const mentorPlayer = (current: GameState, id: string): GameState => {
  if (current.timeLeft < 2 || current.mode !== "week") return current;
  const s = copy(current),
    p = s.roster.find((x) => x.id === id);
  if (!p) return current;
  s.timeLeft -= 2;
  p.trust = clamp(p.trust + 7);
  p.evaluationConfidence = clamp(p.evaluationConfidence + 6);
  p.weeklyReps += 6;
  p.roleNote = `You met individually in Week ${s.week}; he now expects honest follow-up.`;
  feedback(
    s,
    `Mentored ${p.firstName} ${p.lastName}`,
    `${p.firstName} showed you the play he still does not understand. You corrected the read and asked about life outside football.`,
    `Trust grows because the interaction had content, not because a button was clicked.`,
    ["Trust +7", "Evaluation confidence +6", "6 focused reps"],
    [`${p.firstName} now expects you to remember this conversation.`],
    ["Ignoring him for several weeks will hurt more after this investment."],
  );
  return s;
};
export const setDefensivePlan = (
  s: GameState,
  plan: DefensiveCall,
): GameState => {
  const n = copy(s);
  n.defensivePlan = plan;
  feedback(
    n,
    "Opening identity set",
    `${defensiveCalls.find((x) => x.id === plan)?.name} is now the opening answer.`,
    `The plan changes matchup edges, but repetition lets opponents adapt.`,
    [],
    [
      "The defensive staff will grade whether you leave the plan at the right time.",
    ],
    ["Mercer can ask why you stayed with or abandoned it."],
  );
  return n;
};
export const reorderDepthChart = (
  current: GameState,
  id: string,
  direction: -1 | 1,
): GameState => {
  const s = copy(current),
    p = s.roster.find((x) => x.id === id);
  if (!p) return current;
  const desired = p.depthRank + direction,
    swap = s.roster.find(
      (x) => x.position === p.position && x.depthRank === desired,
    );
  if (!swap || desired < 1) return current;
  swap.depthRank = p.depthRank;
  p.depthRank = desired;
  p.trust = clamp(p.trust + (direction < 0 ? 4 : -5));
  swap.trust = clamp(swap.trust + (direction < 0 ? -4 : 2));
  p.roleNote =
    direction < 0
      ? "Promoted by your decision; now carrying higher expectations."
      : "Demoted by your decision; wants a specific reason.";
  feedback(
    s,
    "Depth chart changed",
    `${p.firstName} ${p.lastName} moved to ${desired === 1 ? "first" : desired === 2 ? "second" : `${desired}th`} string.`,
    "The move changed reps, identity and two players’ trust.",
    [
      `${p.firstName} trust ${direction < 0 ? "+4" : "−5"}`,
      `${swap.firstName} trust ${direction < 0 ? "−4" : "+2"}`,
    ],
    [`${p.firstName} ${direction < 0 ? "felt seen" : "wants an explanation"}.`],
    ["Future performance will validate or challenge this evaluation."],
  );
  return s;
};
export const assignPersonnelSlot = (
  current: GameState,
  packageId: string,
  index: number,
  playerId: string,
): GameState => {
  const s = copy(current),
    pkg = s.packages.find((x) => x.id === packageId),
    p = s.roster.find((x) => x.id === playerId),
    sl = pkg?.slots[index];
  if (!pkg || !p || !sl || !sl.allowed.includes(p.position)) return current;
  sl.playerId = playerId;
  p.roleNote = `Assigned to ${pkg.name}: ${sl.label}.`;
  feedback(
    s,
    "Personnel changed",
    `${p.firstName} ${p.lastName} now owns ${sl.label} in ${pkg.name}.`,
    `Packages use the actual eleven assigned players when a game decision calls them.`,
    [`${pkg.name} execution changed`],
    [`${p.firstName} received a concrete role.`],
    ["The matchup may prove whether the assignment fits."],
  );
  return s;
};

const situations = (s: GameState, o: Opponent): GameSituation[] =>
  [
    [
      "opening",
      1,
      "10:41",
      1,
      10,
      25,
      "11 personnel, condensed split",
      `Set the opening identity against ${o.offenseStyle}`,
    ],
    [
      "short",
      1,
      "4:18",
      3,
      2,
      43,
      "Heavy set, extra tackle",
      "Win short yardage without giving away play action",
    ],
    [
      "trips",
      2,
      "8:06",
      3,
      7,
      36,
      "Trips boundary, back offset",
      "Their best third-down concept is on tape",
    ],
    [
      "tempo",
      2,
      "1:52",
      2,
      5,
      49,
      "No-huddle empty",
      "Communication is stressed before halftime",
    ],
    [
      "redzone",
      3,
      "7:33",
      2,
      goalDistance(),
      14,
      "Bunch into the boundary",
      "The field is compressed and one bust is six",
    ],
    [
      "injured-corner",
      3,
      "2:10",
      1,
      10,
      31,
      "Star receiver isolated",
      "Your starting corner is limited",
    ],
    [
      "two-minute",
      4,
      "5:27",
      2,
      8,
      38,
      "Tempo spread",
      "Protect the lead or get the ball back",
    ],
    [
      "fourth",
      4,
      "0:54",
      4,
      3,
      47,
      "Quarterback run check",
      "One call may define the week",
    ],
  ].map((x, i) => {
    const [id, q, clock, down, distance, yardLine, look, stakes] = x as [
      string,
      number,
      string,
      number,
      number,
      number,
      string,
      string,
    ];
    return {
      id,
      quarter: q,
      clock,
      down,
      distance,
      yardLine,
      offenseLook: look,
      stakes,
      options: decisionOptions(i),
    };
  });
function goalDistance() {
  return 6;
}
const decisionOptions = (i: number): GameDecision[] => [
  {
    id: `${i}-plan`,
    title: i === 7 ? "Trust the call sheet" : "Stay with the opening answer",
    call: "balanced",
    packageId: i >= 2 ? "nickel" : "base",
    description: "Make them execute and protect communication.",
    risk: "May concede the offense’s preferred matchup",
  },
  {
    id: `${i}-pressure`,
    title: i === 7 ? "Bring the deciding pressure" : "Attack the protection",
    call: "pressure",
    packageId: "third-down",
    description: "Create a free runner through disguise and timing.",
    risk: "One missed leverage rep can become six",
  },
  {
    id: `${i}-special`,
    title: i === 4 ? "Build the goal-line wall" : "Change the picture",
    call: i % 2 ? "run-fit" : "shell",
    packageId: i === 4 ? "goal-line" : "nickel",
    description: "Answer the situation with different personnel and spacing.",
    risk: "Substitution and communication must be clean",
  },
];
const packageRating = (s: GameState, id: string) => {
  const pkg = s.packages.find((x) => x.id === id);
  if (!pkg) return 65;
  const ps = pkg.slots
    .map((sl) => s.roster.find((p) => p.id === sl.playerId))
    .filter(Boolean) as Player[];
  return (
    ps.reduce(
      (n, p) =>
        n + p.overall * (0.75 + p.weeklyGrade / 400) * (1 - p.fatigue / 250),
      0,
    ) / Math.max(1, ps.length)
  );
};
export const startGame = (current: GameState): GameState => {
  if (current.mode !== "week" || !isEventResolved(current)) return current;
  const s = copy(current),
    o = getCurrentOpponent(s);
  s.mode = "gameday";
  s.roster
    .filter((p) => p.position === "K" || p.position === "P")
    .forEach((p) => {
      p.gameSnaps = 1;
    });
  s.activeGame = {
    opponent: o,
    decisionIndex: 0,
    homeScore: 0,
    awayScore: 0,
    complete: false,
    logs: [],
    opponentLooks: {
      run: o.runRate,
      pass: 100 - o.runRate,
      explosive: o.explosiveRate,
    },
    callHistory: [],
    situations: situations(s, o),
    decisionLedger: [],
    postgameQuestion: null,
    report: [],
  };
  return s;
};

const statPlayers = (s: GameState, pos: Position, n = 1) =>
  s.roster
    .filter((p) => p.position === pos)
    .sort((a, b) => a.depthRank - b.depthRank)
    .slice(0, n);
const simOffense = (
  s: GameState,
  game: NonNullable<GameState["activeGame"]>,
) => {
  const qb = statPlayers(s, "QB")[0],
    rbs = statPlayers(s, "RB", 2),
    targets = [...statPlayers(s, "WR", 4), ...statPlayers(s, "TE", 2)],
    ol = statPlayers(s, "OL", 5);
  let yards = 0;
  const plays = rand(s, 5, 10);
  for (let i = 0; i < plays; i++) {
    const run = rand(s, 1, 100) <= 44;
    if (run) {
      const rb = rbs[rand(s, 0, rbs.length - 1)];
      const y = rand(s, -2, 10) + Math.round((rb.overall - 70) / 5);
      rb.stats.rushAttempts++;
      rb.stats.rushYards += Math.max(-3, y);
      yards += Math.max(-3, y);
    } else {
      qb.stats.passAttempts++;
      const tgt = targets[rand(s, 0, targets.length - 1)];
      tgt.stats.targets++;
      const complete =
        rand(s, 1, 100) <=
        clamp(55 + (qb.overall - 70) * 0.7 + (tgt.overall - 70) * 0.4, 42, 75);
      if (complete) {
        const y = rand(s, 3, 18);
        qb.stats.passCompletions++;
        qb.stats.passYards += y;
        tgt.stats.receptions++;
        tgt.stats.receivingYards += y;
        yards += y;
      } else if (rand(s, 1, 100) < 5) {
        qb.stats.interceptionsThrown++;
      }
    }
  }
  ol.forEach((p) => {
    p.stats.snaps += plays;
    if (rand(s, 1, 100) < 8) p.stats.pancakes++;
    if (rand(s, 1, 100) < 2) p.stats.sacksAllowed++;
  });
  qb.stats.snaps += plays;
  rbs.forEach((p) => (p.stats.snaps += Math.round(plays * 0.55)));
  targets.forEach((p) => (p.stats.snaps += Math.round(plays * 0.65)));
  const pts = yards > 55 ? 7 : yards > 36 ? 3 : 0;
  if (pts === 7) {
    if (rand(s, 1, 100) < 55) {
      qb.stats.passTD++;
      targets.sort((a, b) => b.stats.receptions - a.stats.receptions)[0].stats
        .receivingTD++;
    } else {
      rbs[0].stats.rushTD++;
    }
  }
  game.homeScore += pts;
  const k = statPlayers(s, "K")[0],
    p = statPlayers(s, "P")[0];
  if (pts === 7) {
    k.stats.extraPointsAttempted++;
    if (rand(s, 1, 100) < 96) {
      k.stats.extraPointsMade++;
      game.homeScore++;
    }
  } else if (pts === 3) {
    k.stats.fieldGoalsAttempted++;
    if (rand(s, 1, 100) < 78) k.stats.fieldGoalsMade++;
    else game.homeScore -= 3;
  } else {
    p.stats.punts++;
    const py = rand(s, 34, 47);
    p.stats.puntYards += py;
    p.stats.snaps++;
  }
  return { yards, plays, pts: game.homeScore };
};

export const callGameDecision = (
  current: GameState,
  decisionId: string,
): GameState => {
  if (!current.activeGame || current.activeGame.complete) return current;
  const s = copy(current),
    g = s.activeGame!,
    sit = g.situations[g.decisionIndex],
    decision = sit.options.find((x) => x.id === decisionId);
  if (!decision) return current;
  const repeats = g.callHistory
      .slice(-3)
      .filter((x) => x === decision.call).length,
    match =
      decision.call === "pressure"
        ? g.opponent.pressureAnswer < 65
          ? 7
          : -5
        : decision.call === "shell"
          ? g.opponent.explosiveRate > 65
            ? 7
            : -4
          : decision.call === "run-fit"
            ? g.opponent.runRate > 58
              ? 7
              : -3
            : 3;
  const execution =
      packageRating(s, decision.packageId) +
      s.prep * 0.09 +
      s.install * 0.07 +
      s.teamTrust * 0.04 +
      match -
      repeats * 4 +
      rand(s, -9, 9),
    off = g.opponent.offense + rand(s, -8, 10);
  const margin = execution - off;
  let driveYards = 0,
    points = 0;
  const plays = [];
  let down = 1,
    distance = 10,
    yard = sit.yardLine;
  for (let i = 0; i < rand(s, 4, 10) && !points; i++) {
    const y = clamp(Math.round(rand(s, -3, 13) - margin / 7), -4, 65);
    driveYards += y;
    yard += y;
    const defenders = [
      ...statPlayers(s, "DL", 4),
      ...statPlayers(s, "LB", 3),
      ...statPlayers(s, "CB", 3),
      ...statPlayers(s, "S", 2),
    ];
    const tackler = defenders[rand(s, 0, defenders.length - 1)];
    if (y < 25) {
      tackler.stats.tackles++;
      if (y <= 0) tackler.stats.tacklesForLoss++;
    }
    if (rand(s, 1, 100) < Math.max(2, margin / 3)) {
      const rusher = defenders.filter((p) => ["DL", "LB"].includes(p.position))[
        rand(s, 0, 6)
      ];
      if (rusher) rusher.stats.sacks++;
    }
    plays.push({
      id: `p-${g.decisionIndex}-${i}`,
      down,
      distance,
      yardLine: yard - y,
      result: y < 0 ? `${Math.abs(y)}-yard loss` : `${y}-yard gain`,
      yards: y,
      offense: false,
      defender: `${tackler.firstName} ${tackler.lastName}`,
    });
    if (y >= distance) {
      down = 1;
      distance = 10;
    } else {
      down++;
      distance -= y;
    }
    if (down > 4) break;
    if (yard >= 100) {
      points = 7;
      break;
    }
  }
  if (!points && driveYards > 32) points = 3;
  g.awayScore += points;
  const before = g.homeScore;
  simOffense(s, g);
  const homeAdded = g.homeScore - before;
  const outcome =
    points === 7
      ? "Touchdown allowed"
      : points === 3
        ? "Held them to a field goal"
        : driveYards < 12
          ? "Three-and-out"
          : "Drive stopped";
  g.logs.unshift({
    id: `d-${g.decisionIndex}-${s.seed}`,
    quarter: sit.quarter,
    call: decision.call,
    headline: outcome,
    detail: `${decision.title} produced ${plays.length} real snaps. ${margin >= 0 ? "Preparation and personnel held up." : "The offense found the stressed space."} Your offense answered with ${homeAdded} point${homeAdded === 1 ? "" : "s"}.`,
    pointsFor: homeAdded,
    pointsAgainst: points,
    plays,
  });
  g.decisionLedger.push(`${sit.id}: ${decision.title} — ${outcome}`);
  g.callHistory.push(decision.call);
  g.decisionIndex++;
  s.roster.forEach((p) => {
    if (p.depthRank <= 2) p.fatigue = clamp(p.fatigue + rand(s, 0, 2));
  });
  if (g.decisionIndex >= g.situations.length) {
    finishGame(s);
  }
  return s;
};

const finishGame = (s: GameState) => {
  const g = s.activeGame!;
  if (g.homeScore === g.awayScore) {
    if (rand(s, 0, 1)) g.homeScore += 7;
    else g.awayScore += 7;
  }
  g.complete = true;
  s.mode = "postgame";
  const won = g.homeScore > g.awayScore,
    margin = g.homeScore - g.awayScore;
  s.wins += won ? 1 : 0;
  s.losses += won ? 0 : 1;
  s.reputation = clamp(s.reputation + (won ? 4 : -1));
  s.teamTrust = clamp(s.teamTrust + (won ? 4 : margin <= -21 ? -9 : -3));
  s.staffTrust = clamp(s.staffTrust + (won ? 3 : margin <= -21 ? -7 : -2));
  s.lockerRoomMorale = clamp(
    s.lockerRoomMorale + (won ? 5 : margin <= -21 ? -12 : -5),
  );
  s.jobSecurity = clamp(s.jobSecurity + (won ? 3 : margin <= -21 ? -10 : -3));
  s.recentResults.unshift({
    week: s.week,
    opponent: g.opponent.name,
    for: g.homeScore,
    against: g.awayScore,
    result: won ? "W" : "L",
  });
  s.recentResults = s.recentResults.slice(0, 5);
  s.roster.forEach((p) => {
    if (p.stats.snaps || p.gameSnaps) {
      p.stats.games++;
      p.morale = clamp(p.morale + (won ? 2 : margin <= -21 ? -7 : -2));
    }
    p.gameSnaps = 0;
  });
  const defining =
    g.decisionLedger[g.decisionLedger.length - 1] ?? "the final possession";
  g.postgameQuestion = {
    question: `Mercer asks: “Walk me through ${defining}. What were you protecting?”`,
    context: `The final was ${s.employer} ${g.homeScore}, ${g.opponent.name} ${g.awayScore}. Your answer will shape whether he sees clarity or excuse-making.`,
    choices: [
      {
        id: "own",
        title: "Own the result and name the correction",
        effect: "Trust rises because accountability is specific.",
      },
      {
        id: "players",
        title: "Say the players failed to execute",
        effect: "Authority survives tonight; the locker room hears the blame.",
      },
      {
        id: "defend",
        title: "Defend the call without qualification",
        effect: "Conviction rises, adaptability falls.",
      },
    ],
  };
  g.report = [
    `Eight major decisions represented roughly ${g.logs.reduce((n, l) => n + (l.plays?.length ?? 0), 0)} defensive snaps plus full offensive possessions.`,
    `${g.decisionLedger.filter((x) => /stopped|Three/.test(x)).length} leverage decisions ended in stops.`,
    margin <= -21
      ? "The margin created an immediate morale and job-security problem."
      : "The tape will follow the specific decisions into next week.",
  ];
  s.timeline.unshift(
    entry(
      s,
      "football",
      `${won ? "Won" : "Lost"} vs. ${g.opponent.name}`,
      `${s.employer} ${g.homeScore}, ${g.opponent.name} ${g.awayScore}.`,
      4,
    ),
  );
  s.opponents.forEach((o) => {
    if (o.id === g.opponent.id) {
      o.wins += won ? 0 : 1;
      o.losses += won ? 1 : 0;
      o.pointsFor += g.awayScore;
      o.pointsAgainst += g.homeScore;
    } else {
      const ow = rand(s, 0, 1) === 1;
      o.wins += ow ? 1 : 0;
      o.losses += ow ? 0 : 1;
      o.pointsFor += rand(s, 13, 42);
      o.pointsAgainst += rand(s, 10, 38);
    }
    o.record = `${o.wins}-${o.losses}`;
  });
  updateRanks(s);
  const crisis =
    s.recentResults.slice(0, 3).length === 3 &&
    s.recentResults.slice(0, 3).every((x) => x.result === "L") &&
    s.recentResults.slice(0, 3).reduce((n, x) => n + x.against - x.for, 0) >=
      45;
  if (crisis) {
    s.currentEventId = "mercer-three-loss-review";
    EVENTS.push({
      id: "mercer-three-loss-review",
      eyebrow: "Saturday · 7:10 AM · Head coach’s office",
      speaker: "Dan Mercer",
      trigger:
        "Three straight losses by a combined margin large enough to threaten the season.",
      title: "Mercer asks whether the defense still believes",
      body: `The last three losses are visible in every meeting. Locker-room morale is ${s.lockerRoomMorale}; your job security is ${s.jobSecurity}. Mercer wants a correction he can explain to players and parents today.`,
      people: ["Dan Mercer", "Team captains", "Ray Nolan"],
      choices: [
        {
          id: "simplify",
          title: "Cut the menu and rebuild trust",
          description: "Own the overload and make execution visible.",
          signals: ["accountability", "install +", "ego test"],
        },
        {
          id: "bench",
          title: "Change four starters",
          description:
            "Put the failure on personnel and create immediate competition.",
          signals: ["authority", "locker room split", "evaluation test"],
        },
        {
          id: "stay",
          title: "Refuse to panic",
          description: "Tell Mercer the process is sound and needs time.",
          signals: ["conviction", "job risk", "staff tension"],
        },
      ],
    });
  }
};
const updateRanks = (s: GameState) => {
  const all = [
    {
      wins: s.wins,
      losses: s.losses,
      pf: s.recentResults.reduce((n, g) => n + g.for, 0),
      pa: s.recentResults.reduce((n, g) => n + g.against, 0),
    },
    ...s.opponents.map((o) => ({
      wins: o.wins,
      losses: o.losses,
      pf: o.pointsFor,
      pa: o.pointsAgainst,
    })),
  ].sort((a, b) => b.wins - a.wins || b.pf - b.pa - (a.pf - a.pa));
  s.conferenceRank =
    all.findIndex((x) => x.wins === s.wins && x.losses === s.losses) + 1;
  s.stateRank = s.wins >= 6 ? clamp(45 - s.wins * 4, 1, 50) : null;
  s.nationalRank = s.wins >= 9 ? clamp(190 - s.reputation, 1, 200) : null;
};
export const answerPostgameQuestion = (
  current: GameState,
  id: string,
): GameState => {
  const s = copy(current),
    q = s.activeGame?.postgameQuestion;
  if (!q || q.answered) return current;
  q.answered = id;
  if (id === "own") {
    s.staffTrust += 5;
    s.teamTrust += 2;
    s.leadership += 2;
    feedback(
      s,
      "You owned the decision",
      "You named the call, the evidence behind it and the correction for Monday.",
      "Specific accountability gives Mercer something usable and players something fair.",
      ["Staff trust +5", "Team trust +2", "Leadership +2"],
      ["Mercer repeats your correction—not your excuse—to the team."],
      ["The next similar situation will be compared with this answer."],
    );
  } else if (id === "players") {
    s.teamTrust -= 7;
    s.staffTrust -= 2;
    feedback(
      s,
      "You blamed execution",
      "The room heard that the call was right and the players were wrong.",
      "Coaches can assign responsibility, but public blame changes who risks honesty.",
      ["Team trust −7", "Staff trust −2"],
      ["The captain goes quiet in the next meeting."],
      ["A player may repeat this quote after another loss."],
    );
  } else {
    s.staffTrust -= 3;
    s.schemeKnowledge += 1;
    feedback(
      s,
      "You defended the call",
      "You refused to name a correction.",
      "Conviction can steady a staff, but tape without adaptation becomes stubbornness.",
      ["Staff trust −3", "Scheme conviction +1"],
      ["Nolan saves a clip that challenges the answer."],
      ["Mercer will compare the next occurrence."],
    );
  }
  return s;
};

const develop = (s: GameState) =>
  s.roster.forEach((p) => {
    const ceiling = Math.max(0, p.potential - p.overall),
      reps = 0.3 + p.weeklyReps / 12,
      growth =
        ceiling > 0
          ? reps * ((s.schemeKnowledge + s.leadership) / 200) * (ceiling / 35)
          : 0;
    p.development += growth;
    if (p.development >= 10) {
      p.overall = clamp(p.overall + 1, 0, p.potential);
      p.development -= 10;
    }
    p.evaluationConfidence = clamp(p.evaluationConfidence + 1);
    p.fatigue = clamp(p.fatigue - 13);
    p.health = clamp(p.health + 4);
    p.weeklyReps = 0;
    p.weeklyGrade = 0;
  });
const updateJobs = (s: GameState) =>
  s.opportunities.forEach((j) => {
    if (j.status === "closed") return;
    j.interest = clamp(
      j.interest +
        Math.max(0, s.wins - s.losses) +
        s.reputation / 30 +
        (j.id.includes("coastal")
          ? (s.relationships.find((r) => r.id === "friend")?.respect ?? 0) / 20
          : 0),
    );
    j.status =
      j.interest >= 72
        ? "offered"
        : j.interest >= 48
          ? "interview"
          : j.interest >= 30
            ? "available"
            : "watching";
  });
export const advanceWeek = (current: GameState): GameState => {
  if (
    current.mode !== "postgame" ||
    !current.activeGame?.postgameQuestion?.answered
  )
    return current;
  const s = copy(current);
  develop(s);
  updateJobs(s);
  s.relationships.forEach((r) => {
    r.neglect++;
    if (r.neglect >= 3) {
      r.closeness = clamp(r.closeness - 2);
      r.status = `Feeling the distance after ${r.neglect} quiet weeks`;
      if (r.neglect === 3)
        remember(
          s,
          r.id,
          "The silence became a pattern",
          `${r.name} noticed three weeks without meaningful contact.`,
          "hurt",
        );
    }
  });
  if (!s.selectedActivities.includes("grades") && s.gradesDue > 8) {
    s.teaching -= 3;
    s.gradesDue += 5;
  }
  if (s.week % 4 === 0) {
    const take = Math.round((s.salary / 12) * 0.78);
    s.cash += take - s.monthlyExpenses;
    s.debt += 120;
    s.timeline.unshift(
      entry(
        s,
        "money",
        "Monthly bills settled",
        `${take.toLocaleString()} take-home against ${s.monthlyExpenses.toLocaleString()} in expenses.`,
      ),
    );
  }
  s.week++;
  s.activeGame = null;
  s.timeLeft = 18;
  s.prep = 24;
  s.scouting = 12;
  s.install = Math.max(30, Math.round(s.install * 0.62));
  s.energy = clamp(s.energy + 14);
  s.stress = clamp(s.stress - 8);
  s.selectedActivities = [];
  s.moneyActionsTaken = [];
  if (s.week > s.opponents.length) {
    const achievement =
      s.wins >= 9
        ? "District champion"
        : s.wins >= 7
          ? "Playoff qualifier"
          : s.wins >= 5
            ? "Winning season"
            : "Rebuilding year";
    s.seasonHistory.unshift({
      year: s.year,
      employer: s.employer,
      role: s.role,
      wins: s.wins,
      losses: s.losses,
      achievement,
    });
    return enterOffseason(s);
  }
  const base = EVENTS[(s.week - 1) % EVENTS.length];
  s.currentEventId = base.repeatable
    ? `${base.id}-${s.year}-${s.week}`
    : base.id;
  s.mode = "week";
  return s;
};

export const getLeagueTable = (s: GameState) =>
  [
    {
      id: "westhaven",
      name: s.employer,
      mascot: s.mascot,
      wins: s.wins,
      losses: s.losses,
      pointsFor: s.recentResults.reduce((n, g) => n + g.for, 0),
      pointsAgainst: s.recentResults.reduce((n, g) => n + g.against, 0),
      stateRank: s.stateRank,
    },
    ...s.opponents.map((o) => ({
      id: o.id,
      name: o.name,
      mascot: o.mascot,
      wins: o.wins,
      losses: o.losses,
      pointsFor: o.pointsFor,
      pointsAgainst: o.pointsAgainst,
      stateRank: o.stateRank,
    })),
  ].sort(
    (a, b) =>
      b.wins - a.wins ||
      b.pointsFor - b.pointsAgainst - (a.pointsFor - a.pointsAgainst),
  );
export const payDebt = (c: GameState, amount: number) => {
  if (c.cash < amount) return c;
  const s = copy(c);
  s.cash -= amount;
  s.debt = Math.max(0, s.debt - amount);
  s.creditScore = clamp(
    s.creditScore + Math.max(1, Math.round(amount / 500)),
    300,
    850,
  );
  feedback(
    s,
    "Extra debt payment",
    `$${amount.toLocaleString()} reduced the balance.`,
    `Less cash today improves the long-term mortgage path.`,
    [`Cash −$${amount}`, `Debt −$${amount}`, `Credit ${s.creditScore}`],
    [],
    ["Lower debt improves future housing flexibility."],
  );
  return s;
};
export const spendRelationshipTime = (c: GameState, id: string) => {
  if (c.timeLeft < 2 || c.mode !== "week") return c;
  const s = copy(c),
    r = s.relationships.find((x) => x.id === id);
  if (!r) return c;
  s.timeLeft -= 2;
  r.trust = clamp(r.trust + 3);
  r.closeness = clamp(r.closeness + 5);
  r.neglect = 0;
  remember(
    s,
    id,
    "A quiet check-in",
    `You gave ${r.name} two hours without asking for a favor.`,
    "warm",
  );
  feedback(
    s,
    `Time with ${r.name}`,
    `${r.lastInteraction}`,
    "The relationship changed through a specific remembered interaction.",
    ["Trust +3", "Closeness +5"],
    [`${r.name}'s current need: ${r.need}`],
    ["Future scenes use this history."],
  );
  return s;
};
export const resolveRelationshipScene = (
  c: GameState,
  sceneId: string,
  choiceId: string,
) => {
  const scene = RELATIONSHIP_SCENES.find((x) => x.id === sceneId),
    ch = scene?.choices.find((x) => x.id === choiceId);
  if (!scene || !ch || c.timeLeft < ch.hours) return c;
  const s = copy(c);
  s.timeLeft -= ch.hours;
  s.cash -= ch.cash ?? 0;
  relation(s, scene.personId, ch.trust, ch.respect ?? 0, ch.closeness);
  remember(s, scene.personId, ch.memoryTitle, ch.outcome, ch.memoryTone);
  feedback(
    s,
    scene.title,
    ch.outcome,
    scene.trigger,
    [
      `Trust ${ch.trust >= 0 ? "+" : ""}${ch.trust}`,
      `Closeness ${ch.closeness >= 0 ? "+" : ""}${ch.closeness}`,
      `${ch.hours} hours used`,
    ],
    [s.relationships.find((x) => x.id === scene.personId)!.status],
    ["This becomes part of the relationship’s permanent summary."],
  );
  return s;
};
export const doMoneyAction = (c: GameState, id: string) => {
  const a = MONEY_ACTIONS.find((x) => x.id === id);
  if (!a || c.timeLeft < a.hours || c.moneyActionsTaken.includes(id)) return c;
  const s = copy(c);
  s.timeLeft -= a.hours;
  s.cash += a.cash;
  s.stress = clamp(s.stress + a.stress);
  s.energy = clamp(s.energy - a.fatigue);
  s.ethics = clamp(s.ethics + a.ethics);
  s.reputation = clamp(s.reputation + a.reputation);
  s.moneyActionsTaken.push(id);
  if (a.ethics < 0)
    s.memories.push({
      key: `sidejob-${id}-${s.year}-${s.week}`,
      createdYear: s.year,
      createdWeek: s.week,
      people: ["Local families"],
      secrecy: 5,
      severity: Math.abs(a.ethics),
      detail: a.description,
    });
  feedback(
    s,
    a.label,
    `You earned $${a.cash}. ${a.description}`,
    "The money solved something real while using time and creating the listed conflict.",
    [
      `Cash +$${a.cash}`,
      `Time −${a.hours}h`,
      `Stress +${a.stress}`,
      `Ethics ${a.ethics >= 0 ? "+" : ""}${a.ethics}`,
    ],
    [a.risk],
    [
      a.ethics < 0
        ? "A reporter, parent or employer can discover the conflict."
        : "Reliable side work can become recurring income.",
    ],
  );
  return s;
};
export const interviewForJob = (c: GameState, id: string) => {
  const s = copy(c),
    j = s.opportunities.find((x) => x.id === id);
  if (!j || s.timeLeft < 3 || !["available", "interview"].includes(j.status))
    return c;
  s.timeLeft -= 3;
  j.interest = clamp(
    j.interest +
      Math.round(
        (s.reputation * 0.28 +
          s.leadership * 0.18 +
          s.schemeKnowledge * 0.2 +
          rand(s, -8, 10)) /
          12,
      ),
  );
  j.status = j.interest >= 72 ? "offered" : "interview";
  s.staffTrust -= 2;
  feedback(
    s,
    `Interviewed with ${j.school}`,
    `They pressed you on ${j.requirements.join(", ").toLowerCase()}. Interest is now ${Math.round(j.interest)}%.`,
    `Your résumé, answers and network all mattered. Your current staff may learn you took the call.`,
    ["3 hours used", "Staff trust −2"],
    [`${j.school} status: ${j.status}`],
    ["The offer can change your role without following a fixed ladder."],
  );
  return s;
};
export const acceptJob = (c: GameState, id: string) => {
  const s = copy(c),
    j = s.opportunities.find((x) => x.id === id);
  if (
    !j ||
    j.status !== "offered" ||
    !["season-end", "offseason"].includes(s.mode)
  )
    return c;
  s.employer = j.school;
  s.level = j.level;
  s.role = j.role;
  s.salary = j.salary;
  s.reputation += 7;
  s.staffTrust = 42;
  j.status = "closed";
  feedback(
    s,
    "Job accepted",
    `${j.school} hired you as ${j.role} for $${j.salary.toLocaleString()}.`,
    `The move changes authority and career access; relationships and your unfinished offseason still exist.`,
    ["Reputation +7", "Staff trust reset"],
    ["Your old staff now remembers how you left."],
    ["The new role changes which depth-chart rooms you control."],
  );
  return s;
};

export const enterOffseason = (c: GameState) => {
  const s = copy(c);
  s.mode = "offseason";
  s.offseasonWeeksRemaining = 6;
  s.timeLeft = 32;
  s.screen = "career";
  s.activeGame = null;
  feedback(
    s,
    "The season ended",
    "The scoreboard stopped. Your relationships, bills, job market, staff politics and senior goodbyes did not.",
    "Six playable offseason periods prevent life from disappearing between rosters.",
    ["32 hours available", "6 offseason periods"],
    [
      `${s.roster.filter((p) => p.grade === 12).length} seniors are preparing to leave.`,
    ],
    ["Graduation happens only after the final offseason period."],
  );
  return s;
};
export const advanceOffseasonWeek = (c: GameState) => {
  if (c.mode !== "offseason" || c.offseasonWeeksRemaining <= 0) return c;
  const s = copy(c);
  s.relationships.forEach((r) => {
    r.neglect++;
    if (r.neglect > 2) r.closeness = clamp(r.closeness - 2);
  });
  s.energy = clamp(s.energy + 10);
  s.stress = clamp(s.stress - 6);
  s.cash += Math.round((s.salary / 12) * 0.78) - s.monthlyExpenses;
  s.offseasonWeeksRemaining--;
  s.timeLeft = s.offseasonWeeksRemaining ? 32 : 0;
  s.timeline.unshift(
    entry(
      s,
      "life",
      `Offseason period ${6 - s.offseasonWeeksRemaining} complete`,
      `Bills moved, people remembered your attention, and the coaching market kept changing.`,
    ),
  );
  feedback(
    s,
    "Offseason time moved",
    s.offseasonWeeksRemaining
      ? `${s.offseasonWeeksRemaining} offseason periods remain.`
      : "Spring camp is next. Seniors will graduate when you begin the season.",
    "Life continues even without a game on Friday.",
    [
      "Monthly pay and bills processed",
      "Energy recovered",
      "Relationship neglect updated",
    ],
    [],
    [
      s.offseasonWeeksRemaining
        ? "Use the next period for people, money or career work."
        : "Beginning camp triggers graduation and incoming freshmen.",
    ],
  );
  return s;
};
const incoming = (s: GameState, index: number, pos: Position): Player => {
  const first = [
      "Avery",
      "Mason",
      "Jalen",
      "Carter",
      "Damon",
      "Tyler",
      "Micah",
      "Leo",
    ][index % 8],
    last = [
      "Adams",
      "Baker",
      "Cruz",
      "Davis",
      "Ellis",
      "Ford",
      "Gray",
      "Howard",
    ][rand(s, 0, 7)],
    overall = rand(s, 48, 63);
  return {
    id: `fr-${s.year}-${index}-${s.seed}`,
    firstName: first,
    lastName: last,
    position: pos,
    grade: 9,
    archetype: "developing prospect",
    personality: ["quiet", "driven", "curious", "fearless"][index % 4],
    overall,
    potential: clamp(overall + rand(s, 12, 32), 60, 96),
    ratings: {
      speed: rand(s, 55, 90),
      strength: rand(s, 50, 82),
      agility: rand(s, 52, 88),
      stamina: rand(s, 58, 82),
      technique: rand(s, 42, 61),
      awareness: rand(s, 40, 60),
      toughness: rand(s, 55, 85),
      discipline: rand(s, 55, 90),
    },
    evaluationConfidence: 20,
    trust: 45,
    morale: 72,
    fatigue: 5,
    health: 100,
    academics: rand(s, 65, 95),
    leadership: 35,
    depthRank: 9,
    development: 0,
    stats: makePlayerStats(),
    tags: ["incoming freshman"],
    weeklyReps: 0,
    weeklyGrade: 0,
    gameSnaps: 0,
    injury: null,
    roleNote: "Unknown freshman; the staff has only camp evidence.",
  };
};
export const beginNextSeason = (c: GameState) => {
  if (c.mode !== "offseason" || c.offseasonWeeksRemaining > 0) return c;
  const s = copy(c),
    seniors = s.roster.filter((p) => p.grade === 12);
  s.alumni.unshift(
    ...seniors.map((p) => ({
      id: p.id,
      name: `${p.firstName} ${p.lastName}`,
      position: p.position,
      graduationYear: s.year,
      finalOverall: p.overall,
      note: p.roleNote || `${p.stats.games} games in his final season.`,
    })),
  );
  s.roster = s.roster
    .filter((p) => p.grade < 12)
    .map((p) => ({
      ...p,
      grade: (p.grade + 1) as 10 | 11 | 12,
      stats: makePlayerStats(),
      fatigue: 5,
      health: clamp(p.health + 10),
      injury: null,
      weeklyReps: 0,
      weeklyGrade: 0,
    }));
  const positions: Position[] = [
    "QB",
    "RB",
    "RB",
    "WR",
    "WR",
    "WR",
    "TE",
    "OL",
    "OL",
    "OL",
    "DL",
    "DL",
    "DL",
    "LB",
    "LB",
    "CB",
    "CB",
    "S",
    "K",
    "P",
  ];
  let i = 0;
  while (s.roster.length < 50) {
    s.roster.push(incoming(s, i, positions[i % positions.length]));
    i++;
  }
  for (const pos of [...new Set(s.roster.map((p) => p.position))])
    s.roster
      .filter((p) => p.position === pos)
      .sort((a, b) => b.overall - a.overall)
      .forEach((p, n) => (p.depthRank = n + 1));
  s.year++;
  s.age++;
  s.week = 1;
  s.wins = 0;
  s.losses = 0;
  s.mode = "week";
  s.timeLeft = s.level === "HS" ? 18 : 22;
  s.prep = 24;
  s.scouting = 12;
  s.install = 35;
  s.currentEventId =
    s.year === 2027
      ? "third-string-transfer"
      : (EVENTS.find((e) => e.repeatable)?.id ?? EVENTS[0].id);
  s.resolvedEvents = [];
  s.selectedActivities = [];
  s.moneyActionsTaken = [];
  s.recentResults = [];
  s.opponents = copy(OPPONENTS).map((o, n) => ({
    ...o,
    id: `${o.id}-${s.year}-${n}`,
    offense: clamp(o.offense + rand(s, -3, 4)),
    defense: clamp(o.defense + rand(s, -3, 4)),
    record: "0-0",
    wins: 0,
    losses: 0,
    pointsFor: 0,
    pointsAgainst: 0,
  }));
  s.packages = copy(INITIAL_PACKAGES).map((pkg) => ({
    ...pkg,
    slots: pkg.slots.map((sl) => {
      const eligible = s.roster
        .filter((p) => sl.allowed.includes(p.position))
        .sort((a, b) => a.depthRank - b.depthRank);
      return { ...sl, playerId: eligible[0]?.id ?? s.roster[0].id };
    }),
  }));
  feedback(
    s,
    "A new roster arrived",
    `${seniors.length} seniors graduated. ${s.roster.filter((p) => p.grade === 9).length} freshmen entered a 50-player roster with hidden ceilings.`,
    `Players advance one grade, stats reset by season, alumni remain permanent, and packages contain only active players.`,
    [
      `${seniors.length} alumni archived`,
      "50 active players",
      "Zero graduates retained",
    ],
    ["Returning players remember last season’s roles."],
    ["Freshman potential will reveal itself through real reps and evaluation."],
  );
  return s;
};

export const activityDefinitions: ActivityDefinition[] = ACTIVITIES;
export const relationshipScenes = RELATIONSHIP_SCENES;
export const moneyActions: MoneyAction[] = MONEY_ACTIONS;
export const defensiveCalls: Array<{
  id: DefensiveCall;
  name: string;
  description: string;
  risk: string;
}> = [
  {
    id: "run-fit",
    name: "Heavy run fit",
    description: "Spin a safety down and close interior gaps.",
    risk: "Exposes play-action seams",
  },
  {
    id: "balanced",
    name: "Balanced match",
    description: "Keep two answers alive and rally to the ball.",
    risk: "Few free wins",
  },
  {
    id: "pressure",
    name: "Five-man pressure",
    description: "Stress protection and force a fast decision.",
    risk: "One missed fit can become six",
  },
  {
    id: "shell",
    name: "Two-high shell",
    description: "Deny explosives and disguise the rotation.",
    risk: "Light box against the run",
  },
  {
    id: "contain",
    name: "Rush-lane contain",
    description: "Keep the quarterback inside and squeeze slowly.",
    risk: "Less immediate pressure",
  },
];
