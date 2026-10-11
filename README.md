# Lifesim

A single-player life simulation with a Football Manager-inspired dashboard. Create a character and build a life across football, motorsport, entrepreneurship, investing, or a regular job.

## Run locally

Use Node.js 22.12+ (Node 24 is verified) and npm.

```sh
npm ci
npm run dev
```

Vite uses port 5173 by default. The game runs entirely in the browser: no database, account, API keys, or paid services are required. Fonts are served locally. `npm run build` produces the static site in `dist/`; `npm run preview` serves that build for validation.

## Play

- The initial dashboard is a playable default life. Choose **Your character → Create a new character** to customize your name, starting age, home city, personality, and initial career. A new life replaces the current browser save.
- Choose a **weekly focus** and advance with **Next week**. You earn income, pay living expenses, develop skills, and see market prices change. Demanding weeks drain energy; rest and training support wellbeing.
- Each career has five levels. Promotions require both the skill threshold and total time shown on the career page. Changing careers preserves experience and unlocked entry fees.
- A life choice arrives every two weeks. Resolve it before advancing. Fifteen scenarios offer different tradeoffs in money, skill, energy, relationships, health, and happiness.
- Three free-time actions are available each week. Meet people, strengthen friendships, or develop a romantic relationship. Connections gradually weaken without attention. Romantic connections need 60 bond; an established partner can become a spouse when their bond reaches 90.
- Trade four fictional assets in whole units. Prices can rise or fall each week. Selling holdings or possessions can recover cash. A negative balance carries 0.5% weekly interest.
- Shop for eleven lifestyle purchases, from a gym membership to property and a yacht. Some carry weekly upkeep. A home replaces rent; a laptop, bicycle, racing simulator, and piano support particular weekly activities. Possessions sell for 80% of their purchase price.
- The entrepreneur path creates your own company. Name it, choose an industry, and balance growth against founder income. Reinvesting reduces pay but accelerates growth; taking income does the reverse. Valuation and hiring respond to simulated growth. The company pauses when you work another career.
- Acquire a football club or F1 team after earning sufficient cash. Weekly outcomes depend on team rating. Choose development, commercial, or balanced management; running costs and sponsorship revenue affect your finances.
- A life ends at age 90 or when health reaches zero. You can review your story or create a new life.

## Saves

Progress automatically saves in this browser's local storage. **Save & settings** can export a JSON backup or import one on another device. Imports are validated and require confirmation before replacing the current life. If a stored save cannot be read, its original contents are preserved as an exportable recovery copy. Browser data deletion clears local progress, so export backups regularly. The game has no cloud sync.

Net worth includes cash, current investments, private company valuation, and the resale value of possessions. Company valuation is paper wealth, not spendable cash.

## Validation

```sh
npm test
npm run build
npm run test:browser
```

Browser tests use Playwright Chromium. To use an installed browser:

```sh
CHROMIUM_PATH=/usr/bin/chromium npm run test:browser
```

Otherwise, install Playwright's browser with `npx playwright install chromium` first. Browser tests start the development server automatically when one is not already running. Set `CI=1` to require a fresh server; port 5173 must then be available.

The engine tests cover career progression, company management, cash flow, trades, events, relationships, ownership, save validation, and long-run simulation. Browser tests cover navigation, creating a character, advancing time, save/load, trading, shopping, relationships, companies, team management, and mobile overflow.

## Structure and scope

- `src/engine.js`: pure state transitions, deterministic seeded randomness, catalogues, and save validation. Actions return new state rather than modifying the current save.
- `src/app.js`: dashboard, screen navigation, dialogs, local persistence, and save import/export.
- `src/style.css`: responsive interface and locally drawn illustrations.
- `tests/`: engine and browser integration tests.

This is a playable foundation, not a complete Football Manager or F1 Manager replacement. Sport careers currently use skill and experience progression, and team ownership uses a simplified weekly results model. Cities are character customization and share one economy. Shopping, relationships, and company-building are simplified systems.

Possible expansions include actual match and race calendars, squads and transfers, contracts and agents, education and qualifications, relocation and distinct economies, families and children, employee recruitment, product launches, and a larger event/item catalogue. Keep these systems connected to the existing life, time, and financial simulation rather than introducing disconnected minigames.
