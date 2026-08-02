"use client";

import { useEffect, useState } from "react";
import {
  SAVE_KEY,
  acceptJob,
  activityDefinitions,
  advanceWeek,
  beginNextSeason,
  callDefensiveSeries,
  defensiveCalls,
  getCurrentEvent,
  getCurrentOpponent,
  interviewForJob,
  isEventResolved,
  makeInitialState,
  observedOverall,
  payDebt,
  performActivity,
  reorderDepthChart,
  resolveStoryChoice,
  setDefensivePlan,
  spendRelationshipTime,
  startGame,
} from "../lib/game/engine";
import type { GameState, Player, Position, Screen } from "../lib/game/types";

const NAV: Array<{ id: Screen; label: string; sub: string }> = [
  { id: "career", label: "Career", sub: "This week" },
  { id: "team", label: "Team", sub: "Roster & depth" },
  { id: "film", label: "Film", sub: "Opponent plan" },
  { id: "life", label: "Life", sub: "People & money" },
  { id: "legacy", label: "Legacy", sub: "History & jobs" },
];

const POSITIONS: Position[] = ["QB", "RB", "WR", "OL", "DL", "LB", "CB", "S", "K"];

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

const cn = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(" ");

const Meter = ({ value, tone = "amber", label }: { value: number; tone?: "amber" | "red" | "olive" | "blue"; label?: string }) => (
  <div className="meter-wrap" aria-label={label ? `${label}: ${Math.round(value)} percent` : `${Math.round(value)} percent`}>
    <div className="meter-track"><span className={`meter-fill ${tone}`} style={{ width: `${Math.max(3, Math.min(100, value))}%` }} /></div>
  </div>
);

function Setup({ onStart }: { onStart: (name: string, philosophy: string) => void }) {
  const [name, setName] = useState("Trevor Hayes");
  const [philosophy, setPhilosophy] = useState("Teacher of the game");
  return (
    <main className="setup-screen">
      <div className="setup-grain" />
      <section className="setup-card">
        <p className="kicker">August 2026 · Westhaven, Florida</p>
        <h1>Coach’s<br /><span>Legacy</span></h1>
        <p className="setup-lead">Your playing career ended before it began. The rest of your football life starts in a history classroom and an old coaches’ office.</p>
        <div className="origin-dossier">
          <div><small>Age</small><strong>22</strong></div>
          <div><small>School job</small><strong>U.S. History</strong></div>
          <div><small>Football role</small><strong>Defensive coordinator</strong></div>
          <div><small>Starting cash</small><strong>$2,840</strong></div>
        </div>
        <label className="field-label" htmlFor="coach-name">Coach’s name</label>
        <input id="coach-name" className="text-input" value={name} onChange={(event) => setName(event.target.value)} maxLength={28} />
        <fieldset className="philosophy-picker">
          <legend>Your instinct under pressure</legend>
          {["Teacher of the game", "Attack every weakness", "Protect the explosive"].map((item) => (
            <button key={item} type="button" onClick={() => setPhilosophy(item)} className={cn("philosophy-choice", philosophy === item && "selected")}>
              <span>{item}</span>
              <small>{item === "Teacher of the game" ? "Development and flexible answers" : item === "Attack every weakness" ? "Pressure, disruption and calculated risk" : "Patience, leverage and forcing long drives"}</small>
            </button>
          ))}
        </fieldset>
        <button className="primary-button" type="button" disabled={!name.trim()} onClick={() => onStart(name.trim(), philosophy)}>Begin the first season <span>→</span></button>
        <p className="save-note">Your career automatically saves on this device.</p>
      </section>
      <aside className="setup-story">
        <div className="story-photo" />
        <div className="story-caption">
          <span>Friday, 9:14 PM</span>
          <strong>They still call you “Coach” here.</strong>
          <p>Every player has a real ceiling. Every person remembers. Every shortcut leaves evidence.</p>
        </div>
      </aside>
    </main>
  );
}

function TopBar({ state, onNavigate, onReset }: { state: GameState; onNavigate: (screen: Screen) => void; onReset: () => void }) {
  return (
    <header className="topbar">
      <button type="button" className="wordmark" onClick={() => onNavigate("career")} aria-label="Coach's Legacy home">Coach’s <span>Legacy</span></button>
      <nav className="desktop-nav" aria-label="Game sections">
        {NAV.map((item) => (
          <button key={item.id} type="button" className={cn(state.screen === item.id && "active")} onClick={() => onNavigate(item.id)}>
            {item.label}<small>{item.sub}</small>
          </button>
        ))}
      </nav>
      <div className="coach-stamp">
        <span>Week {Math.min(state.week, 10)} · {state.year}</span>
        <strong>{state.coachName}</strong>
        <small>{state.role} · {state.level}</small>
      </div>
      <button type="button" className="quiet-reset" onClick={onReset}>New career</button>
    </header>
  );
}

function MobileNav({ state, onNavigate }: { state: GameState; onNavigate: (screen: Screen) => void }) {
  return (
    <nav className="mobile-nav" aria-label="Game sections">
      {NAV.map((item) => <button type="button" key={item.id} className={cn(state.screen === item.id && "active")} onClick={() => onNavigate(item.id)}>{item.label}</button>)}
    </nav>
  );
}

function StatusRail({ state }: { state: GameState }) {
  const careerHeat = Math.round((state.reputation + state.wins * 5 + state.staffTrust / 3) / 1.6);
  return (
    <aside className="status-rail">
      <article className="status-card">
        <div className="status-icon">W–L</div><div><small>Record</small><strong>{state.wins}–{state.losses}</strong><p>{state.conferenceRank === 1 ? "1st in district" : `${state.conferenceRank}th in district`}</p></div>
        <Meter value={state.wins + state.losses ? state.wins / (state.wins + state.losses) * 100 : 12} tone="amber" label="Win percentage" />
      </article>
      <article className="status-card">
        <div className="status-icon red">↑</div><div><small>Career heat</small><strong>{careerHeat > 65 ? "Rising" : careerHeat > 42 ? "Noticed" : "Unknown"}</strong><p>Reputation {state.reputation} · Staff {state.staffTrust}</p></div>
        <Meter value={careerHeat} tone="red" label="Career heat" />
      </article>
      <article className="status-card">
        <div className="status-icon amber">⌂</div><div><small>Life</small><strong>{state.family < 45 ? "Strained" : state.stress > 70 ? "Consumed" : "Holding"}</strong><p>{state.relationshipStatus} · Energy {state.energy}</p></div>
        <Meter value={(state.family + state.energy + (100 - state.stress)) / 3} tone="amber" label="Life balance" />
      </article>
      <article className="status-card">
        <div className="status-icon olive">$</div><div><small>Money</small><strong>{formatMoney(state.cash)}</strong><p>{state.housing} · Credit {state.creditScore}</p></div>
        <Meter value={Math.min(100, state.cash / 80)} tone="olive" label="Cash reserve" />
      </article>
    </aside>
  );
}

function WeeklyStrip({ state, onActivity }: { state: GameState; onActivity: (id: string) => void }) {
  const activities = [
    { id: "film", value: `${state.scouting}%`, note: "Opponent read" },
    { id: "family", value: state.selectedActivities.includes("family") ? "Done" : "Tonight", note: `Family ${state.family}` },
    { id: "install", value: `${state.install}%`, note: "Defense installed" },
    { id: "grades", value: `${state.gradesDue}`, note: "Papers due" },
  ];
  return (
    <section className="weekly-strip">
      <div className="weekly-title"><strong>Weekly<br />priorities</strong><span>→</span></div>
      <div className="weekly-cards">
        {activities.map((item) => {
          const def = activityDefinitions.find((activity) => activity.id === item.id)!;
          const disabled = state.timeLeft < def.hours || state.mode !== "week";
          return (
            <button key={item.id} type="button" className="priority-card" disabled={disabled} onClick={() => onActivity(item.id)}>
              <small>{def.short}</small><strong>{item.value}</strong><span>{item.note} · {def.hours}h</span>
            </button>
          );
        })}
      </div>
      <div className="hours-left"><strong>{state.timeLeft}</strong><span>hours left<br />this week</span></div>
    </section>
  );
}

function StoryDecision({ state, onChoice }: { state: GameState; onChoice: (id: string) => void }) {
  const event = getCurrentEvent(state);
  const resolvedValue = state.resolvedEvents.find((value) => value.startsWith(`${event.id}:`));
  const selectedId = resolvedValue?.split(":")[1];
  return (
    <article className="story-decision">
      <div className="paper-stack paper-two" /><div className="paper-stack paper-one" />
      <div className="decision-paper">
        <div className="decision-copy">
          <p className="kicker burgundy">{event.eyebrow}</p>
          <h1>{event.title}</h1>
          <p className="event-body">{event.body}</p>
        </div>
        <div className="decision-figure" aria-hidden="true" />
        <div className="choice-list">
          {event.choices.map((choice, index) => (
            <button key={choice.id} type="button" disabled={Boolean(resolvedValue)} onClick={() => onChoice(choice.id)} className={cn("decision-choice", selectedId === choice.id && "chosen", resolvedValue && selectedId !== choice.id && "passed")}>
              <b>{index + 1}</b>
              <span><strong>{choice.title}</strong><em>{choice.description}</em></span>
              <span className="signals">{choice.signals.map((signal) => <small key={signal}>{signal}</small>)}</span>
              <i>{selectedId === choice.id ? "✓" : "›"}</i>
            </button>
          ))}
        </div>
        {resolvedValue && <div className="decision-recorded"><strong>Decision recorded.</strong><span>{state.timeline[0]?.detail}</span></div>}
      </div>
    </article>
  );
}

function WeekActions({ state, onActivity, onStartGame }: { state: GameState; onActivity: (id: string) => void; onStartGame: () => void }) {
  const opponent = getCurrentOpponent(state);
  return (
    <section className="week-actions panel">
      <div className="section-heading">
        <div><p className="kicker">Build the week</p><h2>There is never enough time.</h2></div>
        <div className="time-budget"><strong>{state.timeLeft}</strong><span>discretionary<br />hours remain</span></div>
      </div>
      <div className="activity-grid">
        {activityDefinitions.map((activity) => {
          const disabled = state.timeLeft < activity.hours || state.mode !== "week";
          const count = state.selectedActivities.filter((id) => id === activity.id).length;
          return (
            <button key={activity.id} className="activity-card" type="button" disabled={disabled} onClick={() => onActivity(activity.id)}>
              <span className={`activity-category ${activity.category}`}>{activity.category}</span>
              <strong>{activity.label}</strong>
              <p>{activity.description}</p>
              <span className="activity-cost">{activity.hours} hours {count > 0 && `· chosen ${count}×`}</span>
            </button>
          );
        })}
      </div>
      <div className="game-gate">
        <div><small>Friday night</small><strong>{state.employer} vs. {opponent.name}</strong><span>{opponent.note}</span></div>
        <button type="button" className="primary-button compact" disabled={!isEventResolved(state)} onClick={onStartGame}>{isEventResolved(state) ? "Enter game day" : "Make the week’s decision first"} <span>→</span></button>
      </div>
    </section>
  );
}

function CareerScreen({ state, setState }: { state: GameState; setState: (next: GameState) => void }) {
  if (state.mode === "gameday" || state.mode === "postgame") return <GameDay state={state} setState={setState} />;
  if (state.mode === "season-end") return <SeasonEnd state={state} setState={setState} />;
  return (
    <>
      <main className="career-layout">
        <StoryDecision state={state} onChoice={(id) => setState(resolveStoryChoice(state, id))} />
        <StatusRail state={state} />
      </main>
      <WeeklyStrip state={state} onActivity={(id) => setState(performActivity(state, id))} />
      <WeekActions state={state} onActivity={(id) => setState(performActivity(state, id))} onStartGame={() => setState(startGame(state))} />
    </>
  );
}

function PlayerRow({ state, player, canMove, selected, onSelect, onMove }: { state: GameState; player: Player; canMove: boolean; selected: boolean; onSelect: (id: string) => void; onMove: (id: string, direction: -1 | 1) => void }) {
  const view = observedOverall(player, state.evaluation);
  return (
    <article className={cn("player-row", selected && "selected-player")}>
      <div className="depth-badge">{player.depthRank}</div>
      <button type="button" className="player-name player-name-select" onClick={() => onSelect(player.id)}><strong>{player.firstName} {player.lastName}</strong><span>{player.grade === 12 ? "SR" : player.grade === 11 ? "JR" : player.grade === 10 ? "SO" : "FR"} · {player.archetype}</span></button>
      <div className="player-eval"><small>Coach’s grade</small><strong>{view.low}–{view.high}</strong><span>{view.certainty}% confidence</span></div>
      <div className="player-traits"><span>Trust {player.trust}</span><span>Morale {player.morale}</span><span>Health {player.health}</span></div>
      <div className="player-tags">{player.tags.slice(0, 2).map((tag) => <small key={tag}>{tag}</small>)}</div>
      <div className="depth-controls">
        <button type="button" disabled={!canMove || player.depthRank === 1} onClick={() => onMove(player.id, -1)} aria-label={`Move ${player.firstName} up`}>↑</button>
        <button type="button" disabled={!canMove} onClick={() => onMove(player.id, 1)} aria-label={`Move ${player.firstName} down`}>↓</button>
      </div>
    </article>
  );
}

function TeamScreen({ state, setState }: { state: GameState; setState: (next: GameState) => void }) {
  const [position, setPosition] = useState<Position>("LB");
  const [selectedId, setSelectedId] = useState("lb1");
  const players = state.roster.filter((item) => item.position === position).sort((a, b) => a.depthRank - b.depthRank);
  const selectedPlayer = players.find((item) => item.id === selectedId) ?? players[0];
  const selectedView = selectedPlayer ? observedOverall(selectedPlayer, state.evaluation) : null;
  const defensive = ["DL", "LB", "CB", "S"].includes(position);
  const fullAuthority = state.role.toLowerCase().includes("coordinator") || state.role.toLowerCase().includes("head coach");
  const positionAuthority = state.role.toLowerCase().includes("linebacker") && position === "LB";
  const canMove = defensive && (fullAuthority || positionAuthority);
  return (
    <main className="page-shell">
      <section className="page-hero compact-hero">
        <div><p className="kicker">Personnel is a prediction</p><h1>The depth chart</h1><p>You never see a player’s true rating. Your evaluation range narrows through reps, film and relationships—and can still be wrong.</p></div>
        <div className="authority-card"><small>Your authority</small><strong>{state.role}</strong><p>{fullAuthority ? "You set the defensive rotation and advise the head coach on the full roster." : positionAuthority ? "You control linebacker reps and can recommend changes elsewhere." : "You evaluate and advise; the coordinator owns the final rotation."}</p></div>
      </section>
      <section className="position-tabs" aria-label="Positions">{POSITIONS.map((item) => <button type="button" key={item} className={cn(item === position && "active")} onClick={() => { setPosition(item); const first = state.roster.filter((player) => player.position === item).sort((a, b) => a.depthRank - b.depthRank)[0]; if (first) setSelectedId(first.id); }}>{item}</button>)}</section>
      {selectedPlayer && selectedView && <section className="player-card-console">
        <div className="console-overall"><small>Estimated OVR</small><strong>{selectedView.low}<i>–</i>{selectedView.high}</strong><span>{selectedView.certainty}% scouted</span></div>
        <div className="console-identity"><span>{selectedPlayer.position} · {selectedPlayer.depthRank === 1 ? "Starter" : `${selectedPlayer.depthRank} string`}</span><h2>{selectedPlayer.firstName} {selectedPlayer.lastName}</h2><p>{selectedPlayer.archetype} · {selectedPlayer.personality} · Grade {selectedPlayer.grade}</p><div>{selectedPlayer.tags.map((tag) => <small key={tag}>{tag}</small>)}</div></div>
        <div className="console-ratings">
          {[["ATH", selectedPlayer.ratings.athleticism], ["TEC", selectedPlayer.ratings.technique], ["AWR", selectedPlayer.ratings.awareness], ["TGH", selectedPlayer.ratings.toughness], ["DSC", selectedPlayer.ratings.discipline]].map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}
        </div>
        <div className="console-season"><small>Season stats</small><div><span><strong>{selectedPlayer.stats.games}</strong> GP</span><span><strong>{selectedPlayer.stats.tackles}</strong> TKL</span><span><strong>{selectedPlayer.stats.sacks}</strong> SCK</span><span><strong>{selectedPlayer.stats.interceptions}</strong> INT</span></div><p>Trust {selectedPlayer.trust} · Morale {selectedPlayer.morale} · Health {selectedPlayer.health} · Academics {selectedPlayer.academics}</p></div>
      </section>}
      {!canMove && <div className="authority-notice">You can inspect this room, but your current job does not give you final authority over this depth chart.</div>}
      <section className="roster-list">{players.map((item) => <PlayerRow key={item.id} state={state} player={item} canMove={canMove} selected={item.id === selectedPlayer?.id} onSelect={setSelectedId} onMove={(id, direction) => setState(reorderDepthChart(state, id, direction))} />)}</section>
      <section className="panel truth-panel">
        <div><p className="kicker">Evaluation model</p><h2>Evidence, not magic numbers.</h2></div>
        <div className="truth-grid"><p><strong>Observed range</strong>Your staff’s current estimate—not objective truth.</p><p><strong>Confidence</strong>More quality reps narrow uncertainty. Familiarity can also create bias.</p><p><strong>Development</strong>Potential needs coaching, health, opportunity, trust and time.</p><p><strong>Consequences</strong>A benched captain, ignored freshman or broken promise can echo years later.</p></div>
      </section>
    </main>
  );
}

function FilmScreen({ state, setState }: { state: GameState; setState: (next: GameState) => void }) {
  const opponent = getCurrentOpponent(state);
  const tendencies = [
    ["Run tendency", opponent.runRate],
    ["Tempo", opponent.pace],
    ["Explosive threat", opponent.explosiveRate],
    ["Pressure answer", opponent.pressureAnswer],
  ] as const;
  return (
    <main className="page-shell">
      <section className="page-hero film-hero">
        <div><p className="kicker">Week {state.week} opponent</p><h1>{opponent.name} {opponent.mascot}</h1><p>{opponent.note}</p></div>
        <div className="matchup-score"><small>Scout confidence</small><strong>{state.scouting}%</strong><Meter value={state.scouting} tone="blue" label="Scouting confidence" /></div>
      </section>
      <section className="film-grid">
        <article className="panel tendency-panel"><p className="kicker">Charted tendencies</p><h2>What the tape currently says</h2>{tendencies.map(([label, value]) => <div className="tendency" key={label}><span>{label}</span><Meter value={value} tone={value > 70 ? "red" : "amber"} label={label} /><strong>{value}</strong></div>)}<p className="uncertainty-note">Low scouting confidence means these can be wrong. More film reduces uncertainty; it does not eliminate opponent self-scout changes.</p></article>
        <article className="panel plan-panel"><p className="kicker">Opening plan</p><h2>Choose the identity—not every answer.</h2><div className="plan-list">{defensiveCalls.map((call) => <button type="button" key={call.id} className={cn(state.defensivePlan === call.id && "selected")} onClick={() => setState(setDefensivePlan(state, call.id))}><span><strong>{call.name}</strong><small>{call.description}</small></span><em>{call.risk}</em></button>)}</div></article>
      </section>
      <section className="panel scouting-board"><div><p className="kicker">Preparation readout</p><h2>Your plan is only as good as the week.</h2></div><div className="scout-metrics"><div><strong>{state.prep}</strong><span>Overall prep</span></div><div><strong>{state.install}</strong><span>Install mastery</span></div><div><strong>{state.energy}</strong><span>Coach energy</span></div><div><strong>{state.teamTrust}</strong><span>Team trust</span></div></div></section>
    </main>
  );
}

function LifeScreen({ state, setState }: { state: GameState; setState: (next: GameState) => void }) {
  const downPayment = 34000;
  const mortgageReady = state.cash >= downPayment && state.creditScore >= 680;
  return (
    <main className="page-shell">
      <section className="page-hero life-hero"><div><p className="kicker">The part the scoreboard misses</p><h1>Your actual life</h1><p>Relationships do not pause for the season. Money, health and promises continue moving even when you refuse to look.</p></div><div className="life-balance"><small>Life stability</small><strong>{Math.round((state.family + state.energy + state.health + (100 - state.stress)) / 4)}</strong><Meter value={(state.family + state.energy + state.health + (100 - state.stress)) / 4} tone="amber" label="Life stability" /></div></section>
      <section className="life-grid">
        <article className="panel finance-panel">
          <p className="kicker">Personal finances</p><h2>{formatMoney(state.cash)} available</h2>
          <div className="ledger"><div><span>Annual salary</span><strong>{formatMoney(state.salary)}</strong></div><div><span>Monthly expenses</span><strong>{formatMoney(state.monthlyExpenses)}</strong></div><div><span>Student debt</span><strong>{formatMoney(state.debt)}</strong></div><div><span>Credit score</span><strong>{state.creditScore}</strong></div></div>
          <div className="finance-actions"><button type="button" disabled={state.cash < 250} onClick={() => setState(payDebt(state, 250))}>Pay $250 extra</button><button type="button" disabled={state.cash < 1000} onClick={() => setState(payDebt(state, 1000))}>Pay $1,000 extra</button></div>
          <div className="mortgage-card"><small>First-home path</small><strong>$189,000 townhouse</strong><p>Estimated down payment: {formatMoney(downPayment)} · Minimum modeled credit: 680</p><Meter value={Math.min(100, state.cash / downPayment * 100)} tone="olive" label="Down payment progress" /><span className={mortgageReady ? "ready" : "locked"}>{mortgageReady ? "Pre-qualification available" : `${formatMoney(Math.max(0, downPayment - state.cash))} and ${Math.max(0, 680 - state.creditScore)} credit points short`}</span></div>
        </article>
        <article className="panel relationships-panel"><p className="kicker">People remember patterns</p><h2>Relationships</h2><div className="relationship-list">{state.relationships.map((person) => <div className="relationship-card" key={person.id}><div className="person-initial">{person.name.split(" ").map((word) => word[0]).join("").slice(0, 2)}</div><div><strong>{person.name}</strong><small>{person.role}</small><p>{person.status}</p><div className="relation-bars"><span>Trust {person.trust}</span><span>Close {person.closeness}</span></div></div><button type="button" disabled={state.timeLeft < 2 || state.mode !== "week"} onClick={() => setState(spendRelationshipTime(state, person.id))}>Spend 2h</button></div>)}</div></article>
      </section>
      <section className="panel health-panel"><div><p className="kicker">Capacity</p><h2>You are not an infinite resource.</h2></div><div className="health-metrics"><div><span>Energy</span><strong>{state.energy}</strong><Meter value={state.energy} tone="olive" label="Energy" /></div><div><span>Stress</span><strong>{state.stress}</strong><Meter value={state.stress} tone="red" label="Stress" /></div><div><span>Old knee / health</span><strong>{state.health}</strong><Meter value={state.health} tone="amber" label="Health" /></div><div><span>Family connection</span><strong>{state.family}</strong><Meter value={state.family} tone="blue" label="Family connection" /></div></div></section>
    </main>
  );
}

function LegacyScreen({ state, setState }: { state: GameState; setState: (next: GameState) => void }) {
  return (
    <main className="page-shell">
      <section className="page-hero legacy-hero"><div><p className="kicker">No predetermined ladder</p><h1>The coaching world is watching</h1><p>Openings emerge from performance, staff changes, relationships, geography, money and timing. Prestige alone is not progression.</p></div><div className="career-ratings"><div><small>Scheme</small><strong>{state.schemeKnowledge}</strong></div><div><small>Evaluate</small><strong>{state.evaluation}</strong></div><div><small>Lead</small><strong>{state.leadership}</strong></div><div><small>Recruit</small><strong>{state.recruiting}</strong></div></div></section>
      <section className="legacy-grid">
        <article className="panel job-market"><p className="kicker">Dynamic job market</p><h2>Interest is not an offer.</h2>{state.opportunities.map((job) => <div className="job-card" key={job.id}><div><span className="level-tag">{job.level}</span><strong>{job.school}</strong><h3>{job.role}</h3><p>{job.why}</p></div><div className="job-interest"><small>{job.status}</small><strong>{Math.round(job.interest)}%</strong><Meter value={job.interest} tone={job.status === "offered" ? "olive" : "amber"} label={`${job.school} interest`} /></div><ul>{job.requirements.map((requirement) => <li key={requirement}>{requirement}</li>)}</ul>{["available", "interview"].includes(job.status) && <button type="button" disabled={state.timeLeft < 3} onClick={() => setState(interviewForJob(state, job.id))}>Take interview · 3h</button>}{job.status === "offered" && state.mode !== "season-end" && <span className="offer-note">They want an answer after the season.</span>}{job.status === "offered" && state.mode === "season-end" && <button type="button" onClick={() => setState(acceptJob(state, job.id))}>Accept job</button>}</div>)}</article>
        <article className="panel timeline-panel"><p className="kicker">Permanent record</p><h2>Your story so far</h2><div className="timeline">{state.timeline.slice(0, 18).map((entry) => <div className={`timeline-entry sig-${entry.significance}`} key={entry.id}><span>{entry.year}<small>W{entry.week}</small></span><div><strong>{entry.title}</strong><p>{entry.detail}</p></div></div>)}</div></article>
      </section>
      <section className="panel memory-panel"><p className="kicker">Delayed consequences</p><h2>{state.memories.length} unresolved thread{state.memories.length === 1 ? "" : "s"}</h2>{state.memories.length === 0 ? <p className="empty-copy">No dangerous private history yet. That is not the same as having no consequences.</p> : <div className="memory-grid">{state.memories.map((memory) => <div key={`${memory.key}-${memory.createdWeek}`}><span>Year {memory.createdYear} · Week {memory.createdWeek}</span><strong>{memory.detail}</strong><small>Known by: {memory.people.join(", ")} · Exposure risk is dynamic</small></div>)}</div>}</section>
    </main>
  );
}

function GameDay({ state, setState }: { state: GameState; setState: (next: GameState) => void }) {
  const game = state.activeGame!;
  const quarter = game.complete ? "FINAL" : `Q${Math.min(4, Math.floor(game.series / 2.5) + 1)}`;
  return (
    <main className="game-day page-shell">
      <section className="scoreboard"><div><small>{state.employer}</small><strong>{game.homeScore}</strong><span>{state.mascot}</span></div><div className="score-center"><span>{quarter}</span><strong>{game.complete ? "Game complete" : `Defensive series ${game.series + 1} of ${game.maxSeries}`}</strong><small>{game.opponent.name} · {game.opponent.record}</small></div><div><small>{game.opponent.name}</small><strong>{game.awayScore}</strong><span>{game.opponent.mascot}</span></div></section>
      {!game.complete ? <section className="game-grid">
        <article className="panel call-sheet"><p className="kicker">The headset is yours</p><h1>Make the call.</h1><p className="game-context">You know their tendencies, not the next play. Your call affects leverage and assignments; players still have to execute.</p><div className="call-grid">{defensiveCalls.map((call) => <button key={call.id} type="button" onClick={() => setState(callDefensiveSeries(state, call.id))}><strong>{call.name}</strong><span>{call.description}</span><small>{call.risk}</small></button>)}</div></article>
        <article className="panel sideline-panel"><p className="kicker">Sideline information</p><h2>What you can actually know</h2><div className="sideline-read"><div><span>Run tendency</span><strong>{game.opponentLooks.run}%</strong></div><div><span>Explosive threat</span><strong>{game.opponentLooks.explosive}%</strong></div><div><span>Prep</span><strong>{state.prep}</strong></div><div><span>Install</span><strong>{state.install}</strong></div></div><p>{game.opponent.note}</p>{game.logs[0] && <div className="last-drive"><small>Last series</small><strong>{game.logs[0].headline}</strong><p>{game.logs[0].detail}</p></div>}</article>
      </section> : <section className="postgame panel"><p className="kicker">Final</p><h1>{game.homeScore > game.awayScore ? "You found a way." : "The result follows you home."}</h1><p>{state.employer} {game.homeScore}, {game.opponent.name} {game.awayScore}. The final score changes careers, but the tape explains why.</p><button type="button" className="primary-button compact" onClick={() => setState(advanceWeek(state))}>{state.week >= 10 ? "Enter the coaching market" : "Begin next week"} <span>→</span></button></section>}
      <section className="drive-log"><div className="section-heading"><div><p className="kicker">Game book</p><h2>Every defensive series</h2></div></div>{game.logs.length === 0 ? <p className="empty-copy">The opening call has not been sent in.</p> : game.logs.map((log) => <article key={log.id}><span>{log.quarter === 5 ? "OT" : `Q${log.quarter}`}</span><div><strong>{log.headline}</strong><p>{log.detail}</p></div><small>{log.pointsAgainst ? `Allowed ${log.pointsAgainst}` : "Stop"}</small></article>)}</section>
    </main>
  );
}

function SeasonEnd({ state, setState }: { state: GameState; setState: (next: GameState) => void }) {
  const offered = state.opportunities.filter((job) => job.status === "offered");
  return (
    <main className="page-shell season-end">
      <section className="season-dossier"><p className="kicker">{state.year} season complete</p><h1>{state.wins}–{state.losses}</h1><h2>{state.wins >= 9 ? "District champion" : state.wins >= 7 ? "Playoff season" : state.wins >= 5 ? "A winning foundation" : "The hard kind of education"}</h2><p>Wins matter. So do player development, relationships, ethics, reputation and who is willing to make a call for you.</p></section>
      <section className="panel season-market"><p className="kicker">Your next move</p><h2>{offered.length ? `${offered.length} offer${offered.length === 1 ? "" : "s"} on the table` : "No offer is guaranteed"}</h2><div className="offer-grid">{offered.map((job) => <div className="offer-card" key={job.id}><span>{job.level}</span><strong>{job.school}</strong><h3>{job.role}</h3><p>{formatMoney(job.salary)} · {job.location}</p><button type="button" onClick={() => setState(acceptJob(state, job.id))}>Accept and relocate</button></div>)}<div className="offer-card stay"><span>Stay</span><strong>{state.employer}</strong><h3>{state.role}</h3><p>Keep authority, relationships and unfinished work.</p><button type="button" onClick={() => setState(beginNextSeason(state))}>Return next season</button></div></div></section>
    </main>
  );
}

export default function CoachGame() {
  const [state, setState] = useState<GameState | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hydrate = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(SAVE_KEY);
        if (raw) setState(JSON.parse(raw) as GameState);
      } catch {
        window.localStorage.removeItem(SAVE_KEY);
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(hydrate);
  }, []);

  useEffect(() => {
    if (ready && state) window.localStorage.setItem(SAVE_KEY, JSON.stringify({ ...state, lastSavedAt: Date.now() }));
  }, [state, ready]);

  const title = state ? `${state.coachName} · ${state.employer}` : "Coach’s Legacy";
  useEffect(() => { document.title = title; }, [title]);

  if (!ready) return <main className="loading-screen"><span>Opening the coaches’ office…</span></main>;
  if (!state) return <Setup onStart={(name, philosophy) => setState(makeInitialState(name, philosophy))} />;

  const updateScreen = (screen: Screen) => setState({ ...state, screen });
  const reset = () => {
    if (window.confirm("Start a new career? This device’s current save will be erased.")) {
      window.localStorage.removeItem(SAVE_KEY);
      setState(null);
    }
  };

  return (
    <div className="game-shell">
      <TopBar state={state} onNavigate={updateScreen} onReset={reset} />
      {state.screen === "career" && <CareerScreen state={state} setState={setState} />}
      {state.screen === "team" && <TeamScreen state={state} setState={setState} />}
      {state.screen === "film" && <FilmScreen state={state} setState={setState} />}
      {state.screen === "life" && <LifeScreen state={state} setState={setState} />}
      {state.screen === "legacy" && <LegacyScreen state={state} setState={setState} />}
      <MobileNav state={state} onNavigate={updateScreen} />
    </div>
  );
}
