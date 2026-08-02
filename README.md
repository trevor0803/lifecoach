# Coach’s Legacy

A football coaching life simulator where the player begins at 22 as a former college prospect, high-school history teacher, and defensive coordinator. The career has no fixed ladder: performance, relationships, staff changes, finances, reputation, job fit, and timing create the path.

## Playable systems

- Ten-week high-school season with weekly story decisions
- Persistent device-local career save
- Full roster with starters, backups, hidden ability, potential, development, health, morale, trust, academics, and season statistics
- Console-style position depth charts and player rating panels
- Imperfect evaluation: ratings are staff estimates with confidence ranges, not revealed truth
- Time-budgeted film, practice, teaching, relationship, health, and networking actions
- Opponent tendencies, defensive game plans, and interactive series-by-series play calling
- Opponent adaptation when the same call is repeated
- Practice contact, fatigue, development, and injury risk
- Personal finances, debt, credit, housing, and mortgage prerequisites
- Persistent relationships and memories that can create delayed consequences
- Nonlinear job market spanning high school, Division III, and FBS support roles
- Season history and multi-year continuation

## Simulation principles

1. The world has an underlying truth that the coach may evaluate incorrectly.
2. Authority is limited by the coach’s current job.
3. Outcomes combine preparation, personnel, matchup, execution, fatigue, and uncertainty.
4. Characters remember decisions and share information through relationships.
5. Career movement requires a plausible opening, fit, advocate, and level of interest.
6. Risky decisions can appear to work without becoming good decisions.

See [docs/SIMULATION_ARCHITECTURE.md](docs/SIMULATION_ARCHITECTURE.md) for the expansion model.

## Development

Requires Node.js 22.13 or newer.

```bash
npm ci
npm run dev
```

Validation:

```bash
npm run lint
npm test
```

The application uses Vinext, React, TypeScript, and CSS. Career state currently saves to versioned local storage on the player’s device.
