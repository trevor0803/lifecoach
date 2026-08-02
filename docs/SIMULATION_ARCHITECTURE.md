# Simulation architecture

## Goal

Coach’s Legacy is built as a systems simulation rather than a collection of disconnected random events. The game should be capable of producing millions of coherent careers because a smaller number of persistent systems interact—not because millions of paragraphs are written by hand.

## World model

Every durable entity has private state and observed state.

- **Players:** true ratings, potential, personality, health, confidence, academics, relationships, role, development history, and statistics
- **Coaches:** scheme expertise, teaching, evaluation, recruiting, leadership, ethics, ambition, relationships, reputation by audience, and career preferences
- **Programs:** level, resources, administration, expectations, scheme, recruiting territory, staff stability, finances, and culture
- **People:** motivations, trust, respect, closeness, memories, knowledge, incentives, and willingness to advocate or retaliate
- **Jobs:** authority, responsibilities, salary, location, required expertise, hiring decision-makers, competing candidates, and timing

The player sees information through their coach’s access and evaluation ability. A position coach does not receive the same truth or authority as a coordinator, head coach, athletic director, or general manager.

## Scenario engine

A scenario is assembled from five parts:

1. **Trigger:** a real state change, conflict, deadline, opening, need, or discovered fact
2. **Eligible actors:** people who know about it and have a reason to act
3. **Context:** level, role authority, timing, location, history, relationships, and stakes
4. **Choices:** actions actually available to the player in that role and moment
5. **Consequences:** immediate effects, created memories, information spread, and future trigger changes

An event cannot fire merely because it has not been shown recently. Its prerequisites must be true. A reporter cannot expose a private incident without a source, document, witness, or investigative path. A school cannot offer a coach a job that is not open. A player cannot transfer under a rule set that does not allow it.

## Football model

The first release simulates defensive series with these layers:

- Player ability and availability
- Depth-chart role and accumulated fatigue
- Weekly preparation, opponent scouting, and install mastery
- Team and staff trust
- Opponent offensive strength and tendencies
- Defensive call matchup
- Opponent answers and adaptation to repeated calls
- Execution variance

Future play-level simulation expands each snap into formation, personnel, assignment, leverage, recognition, block interaction, pursuit, ball placement, and post-play state. Statistics must always be produced by simulated actions rather than assigned after the result.

## Player evaluation

True overall ability is stored but never displayed directly. The coach receives an estimated range determined by:

- Evaluation confidence
- Coach evaluation skill
- Quantity and quality of observed reps
- Position familiarity
- Health and current role
- Bias and relationship effects

More evidence narrows uncertainty. It does not guarantee a correct conclusion. A buried third-stringer can already possess elite processing ability; development and opportunity determine whether that ceiling becomes a career.

## Career graph

Career movement is a graph, not a ladder. A successful high-school coordinator might become:

- A high-school head coach
- A college position coach
- A college quality-control assistant with less authority
- A coordinator at a smaller program
- A long-term specialist who never seeks a head job

Hiring interest combines performance evidence, scheme fit, relationships, reputation, recruiting geography, salary, family willingness, role preference, competing candidates, and the hiring decision-maker’s needs. Prestige does not automatically equal progress.

## Life and consequence model

Time is the scarce resource connecting football and life. Work can improve preparation while increasing stress, weakening relationships, or damaging teaching performance. Personal time can strengthen health and relationships while leaving football questions unresolved.

Memories store:

- What happened
- Who participated
- Who knows
- How secret it is
- Severity
- When it happened
- Whether it has been resolved

An unsafe choice can appear to succeed because the player was lucky. The game records the decision and witnesses rather than rewarding the outcome as proof of sound judgment.

## Realism validation

Every new action or event should answer:

1. Is it possible under the relevant rules and institution?
2. Does the player’s current role have the authority to do it?
3. Does each actor have a believable motivation?
4. Does the timing make sense?
5. What information is available to each person?
6. What short- and long-term consequences follow?
7. Can the outcome be explained from the recorded game state?

High-school contact practice is modeled as a preparation-versus-health decision. The safety direction follows NFHS guidance to limit full-contact frequency and duration and to consider the greater cumulative exposure of two-way players and thin rosters. College staff and recruiting expansion should be versioned against the current NCAA legislative database rather than hard-coded as timeless truth.

## Planned expansion order

1. Play-level 11-on-11 engine and offensive staff simulation
2. Complete high-school offseason, hiring, roster turnover, and state-specific rules
3. College recruiting, scholarships, academics, staff structures, portal, NIL, and boosters
4. NFL contracts, roster rules, draft, ownership, general managers, and coaching trees
5. Full family aging, marriage, children, health, legal, housing, and retirement systems
6. Long-term league history, awards, records, Hall of Fame evaluation, and historical comparison

## Reference starting points

- [NFHS recommendations for limiting head-impact exposure](https://assets.nfhs.org/umbraco/media/1014885/2014_nfhs_recommendations_and_guidelines_for_minimizing_head_impact_october_2014.pdf)
- [NCAA Division I legislative database](https://web3.ncaa.org/lsdbi/)
- [NFL Football Operations](https://operations.nfl.com/)
