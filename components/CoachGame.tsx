"use client";
import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { GameState, Player, Position, Screen } from "../lib/game/types";
import {
  OLD_SAVE_KEY,
  SAVE_KEY,
  acceptJob,
  activityDefinitions,
  advanceOffseasonWeek,
  advanceWeek,
  answerPostgameQuestion,
  assignPersonnelSlot,
  beginNextSeason,
  callGameDecision,
  defensiveCalls,
  doActivity,
  doMoneyAction,
  getCurrentEvent,
  getCurrentOpponent,
  getLeagueTable,
  interviewForJob,
  isEventResolved,
  makeInitialState,
  mentorPlayer,
  migrateGameState,
  moneyActions,
  observedOverall,
  payDebt,
  relationshipScenes,
  reorderDepthChart,
  resolveRelationshipScene,
  resolveStoryChoice,
  setDefensivePlan,
  setPracticePlan,
  spendRelationshipTime,
  startGame,
} from "../lib/game/engine";

const positions: Position[] = [
  "QB",
  "RB",
  "WR",
  "TE",
  "OL",
  "DL",
  "LB",
  "CB",
  "S",
  "K",
  "P",
];
const money = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
const meter = (n: number) => (
  <span className="mini-meter">
    <i style={{ width: `${Math.max(0, Math.min(100, n))}%` }} />
  </span>
);
type Setter = Dispatch<SetStateAction<GameState | null>>;

function Setup({
  start,
}: {
  start: (name: string, philosophy: string) => void;
}) {
  const [name, setName] = useState("Trevor Hayes"),
    [philosophy, setPhilosophy] = useState("Teacher of the game");
  return (
    <main className="setup-screen">
      <section className="setup-copy">
        <p className="kicker">A football life simulation</p>
        <h1>
          Coach’s
          <br />
          <em>Legacy</em>
        </h1>
        <p>
          You were supposed to play on Sundays. At 22, a rebuilt knee sends you
          back to your old high school—with a history classroom, a defense and
          an entire life that will not wait.
        </p>
        <div className="origin-stats">
          <span>
            <strong>22</strong>years old
          </span>
          <span>
            <strong>DC</strong>Westhaven
          </span>
          <span>
            <strong>$48.7K</strong>salary
          </span>
        </div>
      </section>
      <section className="setup-card">
        <p className="kicker">Create your coach</p>
        <label>
          Your name
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          Coaching identity
          <select
            value={philosophy}
            onChange={(e) => setPhilosophy(e.target.value)}
          >
            <option>Teacher of the game</option>
            <option>Attack every weakness</option>
            <option>Protect the explosive</option>
          </select>
        </label>
        <button
          className="primary-button"
          onClick={() => start(name || "Coach Hayes", philosophy)}
        >
          Walk into the office <span>→</span>
        </button>
        <small>
          Every save is local to this browser. Every choice creates evidence,
          reactions and memories.
        </small>
      </section>
    </main>
  );
}

function Top({
  s,
  set,
  reset,
}: {
  s: GameState;
  set: Setter;
  reset: () => void;
}) {
  return (
    <header className="top-bar">
      <div className="brand">
        <strong>COACH’S LEGACY</strong>
        <small>
          {s.year} · Age {s.age}
        </small>
      </div>
      <nav>
        {(["career", "team", "film", "life", "legacy"] as Screen[]).map((x) => (
          <button
            className={s.screen === x ? "active" : ""}
            onClick={() => set({ ...s, screen: x })}
            key={x}
          >
            {x}
          </button>
        ))}
      </nav>
      <div className="top-status">
        <span>
          {s.wins}–{s.losses}
          <small>record</small>
        </span>
        <span>
          {s.timeLeft}h<small>available</small>
        </span>
        <button onClick={reset}>New career</button>
      </div>
    </header>
  );
}

function Feedback({ s, set }: { s: GameState; set: Setter }) {
  if (!s.feedback) return null;
  return (
    <div className="feedback-backdrop">
      <article className="consequence-panel">
        <div className="consequence-top">
          <p className="kicker">What happened</p>
          <button
            aria-label="Close feedback"
            onClick={() => set({ ...s, feedback: null })}
          >
            ×
          </button>
        </div>
        <h2>{s.feedback.title}</h2>
        <p className="feedback-result">{s.feedback.result}</p>
        <div className="consequence-why">
          <small>Why it happened</small>
          <p>{s.feedback.why}</p>
        </div>
        {s.feedback.deltas.length > 0 && (
          <div>
            <small className="section-label">Concrete changes</small>
            <div className="delta-list">
              {s.feedback.deltas.map((x) => (
                <span key={x}>{x}</span>
              ))}
            </div>
          </div>
        )}
        {s.feedback.reactions.length > 0 && (
          <div>
            <small className="section-label">Who felt it</small>
            {s.feedback.reactions.map((x) => (
              <p className="reaction-line" key={x}>
                {x}
              </p>
            ))}
          </div>
        )}
        {s.feedback.callbacks.length > 0 && (
          <div className="callback-box">
            <small>What may return later</small>
            {s.feedback.callbacks.map((x) => (
              <p key={x}>{x}</p>
            ))}
          </div>
        )}
        <button
          className="primary-button compact"
          onClick={() => set({ ...s, feedback: null })}
        >
          Continue
        </button>
      </article>
    </div>
  );
}

function Incoming({ s, set }: { s: GameState; set: Setter }) {
  const key = `coach-dismissed-${s.year}-${s.week}`,
    scene = relationshipScenes[(s.week + s.year) % relationshipScenes.length];
  const [dismissed, setDismissed] = useState(false);
  if (s.mode !== "week" || dismissed || !scene) return null;
  const p = s.relationships.find((x) => x.id === scene.personId);
  return (
    <aside className="incoming-call">
      <span>Incoming</span>
      <strong>{p?.name} called.</strong>
      <p>{scene.title}</p>
      <div>
        <button
          onClick={() => {
            set({ ...s, screen: "life" });
            setDismissed(true);
            sessionStorage.setItem(key, "1");
          }}
        >
          Open conversation
        </button>
        <button
          onClick={() => {
            setDismissed(true);
            sessionStorage.setItem(key, "1");
          }}
        >
          Not now
        </button>
      </div>
    </aside>
  );
}

function Story({ s, set }: { s: GameState; set: Setter }) {
  const e = getCurrentEvent(s),
    done = isEventResolved(s);
  return (
    <article className="panel story-card">
      <p className="kicker">{e.eyebrow}</p>
      {e.speaker && (
        <div className="meeting-trigger">
          <strong>{e.speaker} brought you in.</strong>
          <span>This happened because: {e.trigger}</span>
        </div>
      )}
      <h2>{e.title}</h2>
      <p>{e.body}</p>
      <div className="people-line">In the room: {e.people.join(" · ")}</div>
      {done ? (
        <div className="resolved-stamp">
          Decision made. Its consequences are now part of this career.
        </div>
      ) : (
        <div className="choice-list">
          {e.choices.map((c) => (
            <button onClick={() => set(resolveStoryChoice(s, c.id))} key={c.id}>
              <span>
                <strong>{c.title}</strong>
                <small>{c.description}</small>
              </span>
              <em>{c.signals.join(" · ")}</em>
            </button>
          ))}
        </div>
      )}
    </article>
  );
}

function Career({ s, set }: { s: GameState; set: Setter }) {
  if (s.mode === "gameday" || s.mode === "postgame")
    return <Game s={s} set={set} />;
  if (s.mode === "offseason") return <Offseason s={s} set={set} />;
  return (
    <main className="page-shell">
      <section className="career-hero">
        <div>
          <p className="kicker">
            Week {s.week} · {s.employer}
          </p>
          <h1>{s.coachName}</h1>
          <p>
            {s.role} · {s.subject} teacher · {s.scheme}
          </p>
        </div>
        <div className="career-score">
          <span>
            <small>Job security</small>
            <strong>{s.jobSecurity}</strong>
            {meter(s.jobSecurity)}
          </span>
          <span>
            <small>Locker room</small>
            <strong>{s.lockerRoomMorale}</strong>
            {meter(s.lockerRoomMorale)}
          </span>
          <span>
            <small>Staff trust</small>
            <strong>{s.staffTrust}</strong>
            {meter(s.staffTrust)}
          </span>
        </div>
      </section>
      <section className="career-grid">
        <Story s={s} set={set} />
        <aside className="panel week-board">
          <p className="kicker">Your week has a cost</p>
          <h2>{s.timeLeft} hours remain</h2>
          {activityDefinitions.map((a) => (
            <button
              disabled={
                s.timeLeft < a.hours || s.selectedActivities.includes(a.id)
              }
              onClick={() => set(doActivity(s, a.id))}
              key={a.id}
            >
              <span>
                <strong>{a.label}</strong>
                <small>{a.description}</small>
              </span>
              <em>{a.hours}h</em>
            </button>
          ))}
          <button
            className="primary-button"
            disabled={!isEventResolved(s)}
            onClick={() => set(startGame(s))}
          >
            Friday night vs. {getCurrentOpponent(s).name} <span>→</span>
          </button>
        </aside>
      </section>
      <section className="panel news-strip">
        <div>
          <p className="kicker">What the building is saying</p>
          <h2>The week has a pulse.</h2>
        </div>
        {s.news.slice(0, 3).map((n) => (
          <p key={n}>{n}</p>
        ))}
      </section>
    </main>
  );
}

const statLine = (p: Player) => {
  const x = p.stats;
  if (p.position === "QB")
    return `${x.passCompletions}/${x.passAttempts} · ${x.passYards} YDS · ${x.passTD} TD · ${x.interceptionsThrown} INT`;
  if (p.position === "RB")
    return `${x.rushAttempts} CAR · ${x.rushYards} YDS · ${x.rushTD} TD`;
  if (["WR", "TE"].includes(p.position))
    return `${x.receptions}/${x.targets} REC · ${x.receivingYards} YDS · ${x.receivingTD} TD`;
  if (p.position === "OL")
    return `${x.snaps} SNP · ${x.pancakes} PAN · ${x.sacksAllowed} SA`;
  if (p.position === "K")
    return `${x.fieldGoalsMade}/${x.fieldGoalsAttempted} FG · ${x.extraPointsMade}/${x.extraPointsAttempted} XP`;
  if (p.position === "P") return `${x.punts} P · ${x.puntYards} YDS`;
  return `${x.tackles} TKL · ${x.tacklesForLoss} TFL · ${x.sacks} SCK · ${x.interceptions} INT · ${x.passBreakups} PBU`;
};
function Team({ s, set }: { s: GameState; set: Setter }) {
  const [tab, setTab] = useState<"depth" | "packages" | "practice">("depth"),
    [pos, setPos] = useState<Position>("LB"),
    [selected, setSelected] = useState("lb1");
  const players = s.roster
      .filter((p) => p.position === pos)
      .sort((a, b) => a.depthRank - b.depthRank),
    p = s.roster.find((x) => x.id === selected) ?? players[0] ?? s.roster[0];
  return (
    <main className="page-shell">
      <section className="page-hero team-hero">
        <div>
          <p className="kicker">50-player program</p>
          <h1>Depth, roles and evidence</h1>
          <p>
            Ratings are your staff’s estimate. Reps reveal players; opportunity
            develops them; decisions change trust.
          </p>
        </div>
        <div className="tab-switch">
          {(["depth", "packages", "practice"] as const).map((x) => (
            <button
              className={tab === x ? "selected" : ""}
              onClick={() => setTab(x)}
              key={x}
            >
              {x}
            </button>
          ))}
        </div>
      </section>
      {tab === "depth" && (
        <>
          <div className="position-tabs">
            {positions.map((x) => (
              <button
                className={pos === x ? "active" : ""}
                onClick={() => {
                  setPos(x);
                  setSelected(s.roster.find((p) => p.position === x)?.id ?? "");
                }}
                key={x}
              >
                {x}
                <small>{s.roster.filter((p) => p.position === x).length}</small>
              </button>
            ))}
          </div>
          <section className="team-grid">
            <div className="roster-list">
              {players.map((x) => {
                const o = observedOverall(x, s.evaluation);
                return (
                  <div
                    role="button"
                    tabIndex={0}
                    className={`player-row ${p.id === x.id ? "selected" : ""}`}
                    onClick={() => setSelected(x.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") setSelected(x.id);
                    }}
                    key={x.id}
                  >
                    <span className="depth-number">{x.depthRank}</span>
                    <span>
                      <strong>
                        {x.firstName} {x.lastName}
                      </strong>
                      <small>
                        Grade {x.grade} · {x.archetype}
                      </small>
                    </span>
                    <span>
                      <b>
                        {o.low}–{o.high}
                      </b>
                      <small>{o.certainty}% seen</small>
                    </span>
                    <span>
                      <button
                        disabled={x.depthRank === 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          set(reorderDepthChart(s, x.id, -1));
                        }}
                      >
                        ↑
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          set(reorderDepthChart(s, x.id, 1));
                        }}
                      >
                        ↓
                      </button>
                    </span>
                  </div>
                );
              })}
            </div>
            <article className="panel player-console">
              <p className="kicker">Selected player</p>
              <h2>
                {p.firstName} {p.lastName}
              </h2>
              <p>
                {p.personality} · {p.roleNote}
              </p>
              <div className="rating-grid">
                {Object.entries(p.ratings).map(([k, v]) => (
                  <div key={k}>
                    <small>{k.slice(0, 3).toUpperCase()}</small>
                    <strong>{v}</strong>
                  </div>
                ))}
              </div>
              <div className="player-weather">
                <span>
                  Trust <b>{p.trust}</b>
                </span>
                <span>
                  Morale <b>{p.morale}</b>
                </span>
                <span>
                  Reps <b>{p.weeklyReps}</b>
                </span>
                <span>
                  Grade <b>{p.weeklyGrade || "—"}</b>
                </span>
              </div>
              <div className="stat-line">
                <small>Season</small>
                <strong>{statLine(p)}</strong>
              </div>
              <button
                disabled={s.timeLeft < 2 || s.mode !== "week"}
                onClick={() => set(mentorPlayer(s, p.id))}
              >
                Mentor this player · 2h
              </button>
            </article>
          </section>
        </>
      )}
      {tab === "packages" && (
        <section className="package-grid">
          {s.packages.map((pkg) => (
            <article className="panel package-card" key={pkg.id}>
              <p className="kicker">11 actual assignments</p>
              <h2>{pkg.name}</h2>
              <p>{pkg.description}</p>
              {pkg.slots.map((sl, i) => (
                <label key={`${pkg.id}-${i}`}>
                  <span>
                    {sl.label}
                    <small>{sl.allowed.join("/")}</small>
                  </span>
                  <select
                    value={sl.playerId}
                    onChange={(e) =>
                      set(assignPersonnelSlot(s, pkg.id, i, e.target.value))
                    }
                  >
                    {s.roster
                      .filter((p) => sl.allowed.includes(p.position))
                      .sort((a, b) => a.depthRank - b.depthRank)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.position} · {p.firstName} {p.lastName} ({p.overall}
                          )
                        </option>
                      ))}
                  </select>
                </label>
              ))}
            </article>
          ))}
        </section>
      )}
      {tab === "practice" && (
        <section className="panel practice-lab">
          <div>
            <p className="kicker">Simulate practice</p>
            <h2>Reps become evidence.</h2>
            <p>
              The plan updates every player’s reps, practice grade, fatigue,
              development and evaluation confidence.
            </p>
          </div>
          <div className="practice-controls">
            <label>
              Intensity
              <select
                value={s.practicePlan.intensity}
                onChange={(e) =>
                  set(
                    setPracticePlan(s, {
                      intensity: e.target
                        .value as GameState["practicePlan"]["intensity"],
                    }),
                  )
                }
              >
                <option value="walkthrough">Walkthrough</option>
                <option value="normal">Normal</option>
                <option value="physical">Physical</option>
              </select>
            </label>
            <label>
              Focus
              <select
                value={s.practicePlan.focus}
                onChange={(e) =>
                  set(
                    setPracticePlan(s, {
                      focus: e.target
                        .value as GameState["practicePlan"]["focus"],
                    }),
                  )
                }
              >
                <option>fundamentals</option>
                <option>scheme</option>
                <option>evaluation</option>
                <option>conditioning</option>
              </select>
            </label>
            <label>
              Rep split
              <select
                value={s.practicePlan.reps}
                onChange={(e) =>
                  set(
                    setPracticePlan(s, {
                      reps: e.target.value as GameState["practicePlan"]["reps"],
                    }),
                  )
                }
              >
                <option value="starters">Starters</option>
                <option value="balanced">Balanced</option>
                <option value="young-players">Young players</option>
              </select>
            </label>
            <label>
              Position focus
              <select
                value={s.practicePlan.positionFocus}
                onChange={(e) =>
                  set(
                    setPracticePlan(s, {
                      positionFocus: e.target.value as Position,
                    }),
                  )
                }
              >
                {positions.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="practice-results">
            {s.roster
              .filter((p) => p.weeklyReps > 0)
              .sort((a, b) => b.weeklyGrade - a.weeklyGrade)
              .slice(0, 12)
              .map((p) => (
                <div key={p.id}>
                  <strong>
                    {p.firstName} {p.lastName}
                  </strong>
                  <span>{p.weeklyReps} reps</span>
                  <b>{p.weeklyGrade}</b>
                </div>
              ))}
          </div>
        </section>
      )}
    </main>
  );
}

function Film({ s, set }: { s: GameState; set: Setter }) {
  const o = getCurrentOpponent(s),
    table = getLeagueTable(s);
  return (
    <main className="page-shell">
      <section className="page-hero film-hero">
        <div>
          <p className="kicker">Week {s.week} opponent dossier</p>
          <h1>
            {o.name} {o.mascot}
          </h1>
          <p>{o.note}</p>
        </div>
        <div className="ranking-cards">
          <span>
            <small>District</small>
            <strong>#{s.conferenceRank}</strong>
          </span>
          <span>
            <small>State</small>
            <strong>{s.stateRank ? `#${s.stateRank}` : "NR"}</strong>
          </span>
          <span>
            <small>National</small>
            <strong>{s.nationalRank ? `#${s.nationalRank}` : "NR"}</strong>
          </span>
        </div>
      </section>
      <section className="film-grid">
        <article className="panel opponent-dossier">
          <p className="kicker">What they are</p>
          <h2>{o.offenseStyle}</h2>
          <p>
            <b>Defense:</b> {o.defenseStyle}
          </p>
          <p>
            <b>Key players:</b> {o.keyPlayers.join(" · ")}
          </p>
          {[
            ["Run rate", o.runRate],
            ["Tempo", o.pace],
            ["Explosives", o.explosiveRate],
            ["Pressure answer", o.pressureAnswer],
          ].map(([l, v]) => (
            <div className="tendency" key={l}>
              <span>{l}</span>
              {meter(v as number)}
              <b>{v}</b>
            </div>
          ))}
        </article>
        <article className="panel plan-panel">
          <p className="kicker">Opening identity</p>
          <h2>Your answer—until evidence changes it.</h2>
          {defensiveCalls.map((c) => (
            <button
              className={s.defensivePlan === c.id ? "selected" : ""}
              onClick={() => set(setDefensivePlan(s, c.id))}
              key={c.id}
            >
              <span>
                <strong>{c.name}</strong>
                <small>{c.description}</small>
              </span>
              <em>{c.risk}</em>
            </button>
          ))}
        </article>
      </section>
      <section className="panel standings">
        <div>
          <p className="kicker">Atlantic District</p>
          <h2>League standings</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Team</th>
              <th>W</th>
              <th>L</th>
              <th>PF</th>
              <th>PA</th>
              <th>Diff</th>
              <th>State</th>
            </tr>
          </thead>
          <tbody>
            {table.map((t, i) => (
              <tr className={t.id === "westhaven" ? "you" : ""} key={t.id}>
                <td>{i + 1}</td>
                <td>
                  <strong>{t.name}</strong> {t.mascot}
                </td>
                <td>{t.wins}</td>
                <td>{t.losses}</td>
                <td>{t.pointsFor}</td>
                <td>{t.pointsAgainst}</td>
                <td>{t.pointsFor - t.pointsAgainst}</td>
                <td>{t.stateRank ? `#${t.stateRank}` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="opponent-cards">
        {s.opponents.map((x) => (
          <article key={x.id}>
            <span>{x.record}</span>
            <strong>
              {x.name} {x.mascot}
            </strong>
            <small>
              {x.offenseStyle} · OVR {Math.round((x.offense + x.defense) / 2)}
            </small>
            <p>{x.keyPlayers[0]}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

function Life({ s, set }: { s: GameState; set: Setter }) {
  const [personId, setPerson] = useState("emily"),
    person =
      s.relationships.find((x) => x.id === personId) ?? s.relationships[0],
    scenes = relationshipScenes.filter((x) => x.personId === person.id);
  return (
    <main className="page-shell">
      <section className="page-hero life-hero">
        <div>
          <p className="kicker">The part the scoreboard misses</p>
          <h1>Your actual life</h1>
          <p>
            People remember patterns. Money creates choices. A relationship is a
            history, not a meter.
          </p>
        </div>
        <div className="life-balance">
          <small>Cash</small>
          <strong>{money(s.cash)}</strong>
          <span>
            {s.relationshipStatus} · {s.housing}
          </span>
        </div>
      </section>
      <section className="life-grid">
        <article className="panel relationship-index">
          <p className="kicker">Relationship weather</p>
          <h2>People in your life</h2>
          {s.relationships.map((r) => (
            <button
              className={r.id === person.id ? "selected" : ""}
              onClick={() => setPerson(r.id)}
              key={r.id}
            >
              <span>
                <strong>{r.name}</strong>
                <small>{r.role}</small>
              </span>
              <span>
                {r.trust}
                <small>trust</small>
              </span>
            </button>
          ))}
        </article>
        <article className="panel relationship-dossier">
          <p className="kicker">Current standing</p>
          <h2>{person.name}</h2>
          <p className="status-line">{person.status}</p>
          <div className="relationship-weather">
            <div>
              <small>Mood</small>
              <strong>{person.mood}</strong>
            </div>
            <div>
              <small>Needs</small>
              <strong>{person.need}</strong>
            </div>
            <div>
              <small>Boundary</small>
              <strong>{person.boundary}</strong>
            </div>
            <div>
              <small>Last interaction</small>
              <strong>{person.lastInteraction}</strong>
            </div>
          </div>
          {scenes.map((scene) => (
            <div className="relationship-scene" key={scene.id}>
              <small>{scene.trigger}</small>
              <h3>{scene.title}</h3>
              <p>{scene.body}</p>
              {scene.choices.map((c) => (
                <button
                  disabled={s.timeLeft < c.hours || s.mode !== "week"}
                  onClick={() =>
                    set(resolveRelationshipScene(s, scene.id, c.id))
                  }
                  key={c.id}
                >
                  <span>
                    <strong>{c.title}</strong>
                    <small>{c.detail}</small>
                  </span>
                  <em>{c.hours}h</em>
                </button>
              ))}
            </div>
          ))}
          <button
            disabled={s.timeLeft < 2 || s.mode !== "week"}
            onClick={() => set(spendRelationshipTime(s, person.id))}
          >
            Quiet check-in · 2h
          </button>
          <div className="relationship-history">
            <h3>What sticks</h3>
            {person.history.slice(0, 6).map((h) => (
              <div className={`memory-${h.tone}`} key={h.id}>
                <span>
                  {h.year} · W{h.week}
                </span>
                <strong>{h.title}</strong>
                <p>{h.detail}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
      <section className="finance-life-grid">
        <article className="panel finance-panel">
          <p className="kicker">Finances and mortgage path</p>
          <h2>{money(s.cash)} available</h2>
          <div className="ledger">
            <div>
              <span>Salary</span>
              <strong>{money(s.salary)}</strong>
            </div>
            <div>
              <span>Monthly expenses</span>
              <strong>{money(s.monthlyExpenses)}</strong>
            </div>
            <div>
              <span>Student debt</span>
              <strong>{money(s.debt)}</strong>
            </div>
            <div>
              <span>Credit score</span>
              <strong>{s.creditScore}</strong>
            </div>
          </div>
          <div className="mortgage-card">
            <small>$189,000 first-home target</small>
            <strong>
              {s.cash >= 34000 && s.creditScore >= 680
                ? "Pre-qualification available"
                : `${money(Math.max(0, 34000 - s.cash))} and ${Math.max(0, 680 - s.creditScore)} credit points short`}
            </strong>
            {meter(Math.min(100, s.cash / 340))}
          </div>
          <button disabled={s.cash < 250} onClick={() => set(payDebt(s, 250))}>
            Pay $250 extra
          </button>
          <button
            disabled={s.cash < 1000}
            onClick={() => set(payDebt(s, 1000))}
          >
            Pay $1,000 extra
          </button>
        </article>
        <article className="panel money-work">
          <p className="kicker">Do something for money</p>
          <h2>Side work costs more than hours.</h2>
          {moneyActions.map((a) => (
            <button
              disabled={
                s.timeLeft < a.hours ||
                s.moneyActionsTaken.includes(a.id) ||
                !(["week", "offseason"] as string[]).includes(s.mode)
              }
              onClick={() => set(doMoneyAction(s, a.id))}
              key={a.id}
            >
              <span>
                <strong>
                  {a.label} · +{money(a.cash)}
                </strong>
                <small>{a.description}</small>
                <em>{a.risk}</em>
              </span>
              <b>{a.hours}h</b>
            </button>
          ))}
        </article>
      </section>
    </main>
  );
}

function Legacy({ s, set }: { s: GameState; set: Setter }) {
  return (
    <main className="page-shell">
      <section className="page-hero legacy-hero">
        <div>
          <p className="kicker">No predetermined ladder</p>
          <h1>The coaching world is watching</h1>
          <p>
            A linebackers job can lead sideways, up or nowhere. Authority, tape,
            relationships, money and timing decide.
          </p>
        </div>
        <div className="career-ratings">
          <span>
            <small>Scheme</small>
            <strong>{s.schemeKnowledge}</strong>
          </span>
          <span>
            <small>Evaluate</small>
            <strong>{s.evaluation}</strong>
          </span>
          <span>
            <small>Lead</small>
            <strong>{s.leadership}</strong>
          </span>
          <span>
            <small>Job security</small>
            <strong>{s.jobSecurity}</strong>
          </span>
        </div>
      </section>
      <section className="legacy-grid">
        <article className="panel job-market">
          <p className="kicker">Dynamic job market</p>
          <h2>Interest is not an offer.</h2>
          {s.opportunities.map((j) => (
            <div className="job-card" key={j.id}>
              <span>
                {j.level} · {j.status}
              </span>
              <strong>{j.school}</strong>
              <h3>{j.role}</h3>
              <p>{j.why}</p>
              {meter(j.interest)}
              <small>
                {Math.round(j.interest)}% interest · {money(j.salary)}
              </small>
              {["available", "interview"].includes(j.status) && (
                <button
                  disabled={s.timeLeft < 3}
                  onClick={() => set(interviewForJob(s, j.id))}
                >
                  Take interview · 3h
                </button>
              )}
              {j.status === "offered" && (
                <button onClick={() => set(acceptJob(s, j.id))}>
                  Accept offer
                </button>
              )}
            </div>
          ))}
        </article>
        <article className="panel timeline-panel">
          <p className="kicker">Permanent record</p>
          <h2>Your story so far</h2>
          {s.timeline.slice(0, 20).map((t) => (
            <div className="timeline-entry" key={t.id}>
              <span>
                {t.year}
                <small>W{t.week}</small>
              </span>
              <div>
                <strong>{t.title}</strong>
                <p>{t.detail}</p>
              </div>
            </div>
          ))}
        </article>
      </section>
      <section className="panel legacy-record">
        <div>
          <p className="kicker">People and players do not disappear</p>
          <h2>
            {s.memories.length} unresolved thread
            {s.memories.length === 1 ? "" : "s"} · {s.alumni.length} alumni
          </h2>
        </div>
        <div className="legacy-columns">
          <div>
            {s.memories.slice(0, 8).map((m) => (
              <article key={m.key}>
                <strong>{m.detail}</strong>
                <small>
                  Known by {m.people.join(", ")} · Severity {m.severity}/10
                </small>
              </article>
            ))}
          </div>
          <div>
            {s.alumni.slice(0, 12).map((a) => (
              <article key={a.id}>
                <strong>
                  {a.name} · {a.position}
                </strong>
                <small>
                  Class of {a.graduationYear} · final OVR {a.finalOverall}
                </small>
                <p>{a.note}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function Game({ s, set }: { s: GameState; set: Setter }) {
  const g = s.activeGame!;
  if (g.complete) {
    const q = g.postgameQuestion!;
    return (
      <main className="page-shell game-day">
        <section className="scoreboard">
          <div>
            <small>{s.employer}</small>
            <strong>{g.homeScore}</strong>
          </div>
          <div>
            <span>FINAL</span>
            <strong>
              {g.homeScore > g.awayScore
                ? "A win with evidence."
                : "The result follows you home."}
            </strong>
          </div>
          <div>
            <small>{g.opponent.name}</small>
            <strong>{g.awayScore}</strong>
          </div>
        </section>
        <section className="postgame-grid">
          <article className="panel postgame-report">
            <p className="kicker">Causal game report</p>
            <h2>The score is not the explanation.</h2>
            {g.report.map((x) => (
              <p key={x}>{x}</p>
            ))}
            <h3>Decision ledger</h3>
            {g.decisionLedger.map((x, i) => (
              <div key={x}>
                <span>{i + 1}</span>
                {x}
              </div>
            ))}
          </article>
          <article className="panel press-question">
            <p className="kicker">Head coach meeting</p>
            <h2>{q.question}</h2>
            <p>{q.context}</p>
            {q.answered ? (
              <div className="resolved-stamp">
                Your answer is on the permanent record.
              </div>
            ) : (
              q.choices.map((c) => (
                <button
                  onClick={() => set(answerPostgameQuestion(s, c.id))}
                  key={c.id}
                >
                  <strong>{c.title}</strong>
                  <small>{c.effect}</small>
                </button>
              ))
            )}
            <button
              className="primary-button"
              disabled={!q.answered}
              onClick={() => set(advanceWeek(s))}
            >
              {s.week >= 10 ? "Enter the offseason" : "Begin next week"}{" "}
              <span>→</span>
            </button>
          </article>
        </section>
        <section className="drive-log">
          <h2>Snap-by-snap record</h2>
          {g.logs.map((l) => (
            <article key={l.id}>
              <span>Q{l.quarter}</span>
              <div>
                <strong>{l.headline}</strong>
                <p>{l.detail}</p>
                <details>
                  <summary>{l.plays?.length ?? 0} defensive snaps</summary>
                  {l.plays?.map((p) => (
                    <p key={p.id}>
                      {p.down}&amp;{p.distance} · {p.result} · {p.defender}
                    </p>
                  ))}
                </details>
              </div>
              <small>
                {l.pointsAgainst ? `${l.pointsAgainst} allowed` : "Stop"}
              </small>
            </article>
          ))}
        </section>
      </main>
    );
  }
  const sit = g.situations[g.decisionIndex],
    last = g.logs[0];
  return (
    <main className="page-shell game-day">
      <section className="scoreboard">
        <div>
          <small>{s.employer}</small>
          <strong>{g.homeScore}</strong>
        </div>
        <div>
          <span>
            Q{sit.quarter} · {sit.clock}
          </span>
          <strong>
            Decision {g.decisionIndex + 1} of {g.situations.length}
          </strong>
          <small>
            {sit.down}&amp;{sit.distance} · Ball on {sit.yardLine}
          </small>
        </div>
        <div>
          <small>{g.opponent.name}</small>
          <strong>{g.awayScore}</strong>
        </div>
      </section>
      <section className="game-grid">
        <article className="panel situation-card">
          <p className="kicker">{sit.offenseLook}</p>
          <h1>{sit.stakes}</h1>
          <p>
            This is a major coaching decision. The engine will simulate the full
            possession snap by snap, plus your offense’s answering possession.
          </p>
          <div className="decision-options">
            {sit.options.map((o) => (
              <button onClick={() => set(callGameDecision(s, o.id))} key={o.id}>
                <span>
                  <strong>{o.title}</strong>
                  <small>{o.description}</small>
                </span>
                <em>
                  {s.packages.find((p) => p.id === o.packageId)?.name}
                  <br />
                  {o.risk}
                </em>
              </button>
            ))}
          </div>
        </article>
        <aside className="panel sideline-panel">
          <p className="kicker">Live evidence</p>
          <h2>What you know now</h2>
          <p>{g.opponent.note}</p>
          <div className="sideline-read">
            <span>
              Prep <b>{s.prep}</b>
            </span>
            <span>
              Install <b>{s.install}</b>
            </span>
            <span>
              Team trust <b>{s.teamTrust}</b>
            </span>
            <span>
              Locker room <b>{s.lockerRoomMorale}</b>
            </span>
          </div>
          {last && (
            <div className="last-drive">
              <small>Last possession</small>
              <strong>{last.headline}</strong>
              <p>{last.detail}</p>
              <details>
                <summary>Open {last.plays?.length} snaps</summary>
                {last.plays?.map((p) => (
                  <p key={p.id}>
                    {p.down}&amp;{p.distance}: {p.result} · {p.defender}
                  </p>
                ))}
              </details>
            </div>
          )}
        </aside>
      </section>
      <section className="decision-ledger">
        <p className="kicker">Calls that can return later</p>
        {g.decisionLedger.map((x, i) => (
          <span key={x}>
            {i + 1}. {x}
          </span>
        ))}
      </section>
    </main>
  );
}

function Offseason({ s, set }: { s: GameState; set: Setter }) {
  const seniors = s.roster.filter((p) => p.grade === 12);
  return (
    <main className="page-shell offseason">
      <section className="season-dossier">
        <p className="kicker">The season ended. Your life did not.</p>
        <h1>
          {s.wins}–{s.losses}
        </h1>
        <h2>
          {s.offseasonWeeksRemaining
            ? `${s.offseasonWeeksRemaining} offseason periods remain`
            : "Spring camp is ready"}
        </h2>
        <p>
          You have 32 hours per period for relationships, money, health and
          career work. Graduation happens only when camp begins.
        </p>
      </section>
      <section className="offseason-grid">
        <article className="panel">
          <p className="kicker">Life continues</p>
          <h2>Relationship weather</h2>
          {s.relationships.map((r) => (
            <div className="offseason-person" key={r.id}>
              <strong>{r.name}</strong>
              <span>{r.status}</span>
              <small>{r.need}</small>
            </div>
          ))}
          <button onClick={() => set({ ...s, screen: "life" })}>
            Open your life
          </button>
        </article>
        <article className="panel">
          <p className="kicker">Roster turnover preview</p>
          <h2>{seniors.length} seniors will graduate</h2>
          {seniors.slice(0, 10).map((p) => (
            <div className="senior-row" key={p.id}>
              <strong>
                {p.firstName} {p.lastName}
              </strong>
              <span>
                {p.position} · OVR {p.overall}
              </span>
            </div>
          ))}
          <p>
            They move into the alumni record. Returning players advance a grade.
            Incoming freshmen receive hidden ceilings and uncertain evaluations.
          </p>
        </article>
      </section>
      {s.offseasonWeeksRemaining > 0 ? (
        <button
          className="primary-button offseason-next"
          onClick={() => set(advanceOffseasonWeek(s))}
        >
          Advance offseason period <span>→</span>
        </button>
      ) : (
        <button
          className="primary-button offseason-next"
          onClick={() => set(beginNextSeason(s))}
        >
          Begin spring camp and graduate seniors <span>→</span>
        </button>
      )}
    </main>
  );
}

export default function CoachGame() {
  const [s, set] = useState<GameState | null>(null),
    [ready, setReady] = useState(false);
  useEffect(() => {
    const hydrate = window.setTimeout(() => {
      const raw =
        localStorage.getItem(SAVE_KEY) ?? localStorage.getItem(OLD_SAVE_KEY);
      if (raw) {
        try {
          set(migrateGameState(JSON.parse(raw)));
        } catch {
          localStorage.removeItem(SAVE_KEY);
          localStorage.removeItem(OLD_SAVE_KEY);
        }
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(hydrate);
  }, []);
  useEffect(() => {
    if (ready && s) localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  }, [s, ready]);
  if (!ready)
    return <main className="loading-screen">Opening the coaches’ office…</main>;
  if (!s) return <Setup start={(n, p) => set(makeInitialState(n, p))} />;
  const reset = () => {
    if (
      confirm("Start a new career? The current browser save will be erased.")
    ) {
      localStorage.removeItem(SAVE_KEY);
      localStorage.removeItem(OLD_SAVE_KEY);
      set(null);
    }
  };
  const content =
    s.screen === "career" ? (
      <Career s={s} set={set} />
    ) : s.screen === "team" ? (
      <Team s={s} set={set} />
    ) : s.screen === "film" ? (
      <Film s={s} set={set} />
    ) : s.screen === "life" ? (
      <Life s={s} set={set} />
    ) : (
      <Legacy s={s} set={set} />
    );
  return (
    <div className="game-shell">
      <Top s={s} set={set} reset={reset} />
      {content}
      <Incoming s={s} set={set} />
      <Feedback s={s} set={set} />
    </div>
  );
}
