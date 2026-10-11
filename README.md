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

- Choose **Your character → Create a new character** to customize your name, starting age, home city, personality, education, and career interest. Everyone starts looking for work; an interest is an aspiration. A completed-degree background requires age 21+. A new life replaces the current browser save.
- Choose a **weekly focus** and advance with **Next week**. You earn income, pay living expenses, develop skills, and see market prices change. Demanding weeks drain energy; rest and training support wellbeing.
- **Work & education** has vacancies with qualification, skill, and relevant experience requirements. Apply using a free-time action, wait two weeks for a decision, then explicitly accept an offer. Being eligible does not guarantee selection. The regular board refreshes every four weeks; you can apply while employed. Work experience is earned in your actual job, and changing jobs preserves it.
- Study for certificates, degrees, and racing licences. Tuition is charged weekly. The study focus advances one study week; other focuses advance half a study week. Unaffordable tuition pauses progress. A degree also satisfies a certificate requirement in the same field. A qualification unlocks eligible applications only after graduation; withdrawing forfeits partial progress and paid tuition.
- Contracts have their own pay, tenure, and sustained performance. Focused work and wellbeing support performance. Discuss a raise after 13 weeks, then every 26 weeks; it can be refused. Strong performance can also earn a 3% annual merit increase in the same job. A well-connected character can occasionally receive an unusual introduction with different entry requirements and a short application window.
- A life choice arrives every two weeks. Resolve it before advancing. Fifteen scenarios offer different tradeoffs in money, skill, energy, relationships, health, and happiness.
- Three free-time actions are available each week. Meet people, strengthen friendships, or develop a romantic relationship. Connections gradually weaken without attention. Romantic connections need 60 bond; an established partner can become a spouse when their bond reaches 90.
- **Investments** offers fictional listed-company shares, an index fund, crypto, bonds, and a property fund. Crypto supports fractional units; other assets use whole units. Trades have a $1 minimum and weekly liquidity limits. Horizon Technologies and Solstice Energy shares represent actual ownership percentages; controlling more than 50% grants management control. Funds distribute quarterly income, and companies pay dividends when profits and cash allow it. A negative personal balance carries 0.5% weekly interest.
- Collect watches, sports memorabilia, art, and classic cars when dealer listings appear. Estimated values fluctuate. Reselling requires a two-week auction; a high reserve can leave an item unsold. Successful auctions deduct an 8% commission.
- Shop for eleven lifestyle purchases, from a gym membership to property and a yacht. Some carry weekly upkeep. A home replaces rent; a laptop, bicycle, racing simulator, and piano support particular weekly activities. Possessions sell for 80% of their purchase price.
- Found a company with 30 business skill and $5,000 of startup capital. Name it, choose an industry, and decide how much positive profit to draw or retain. Revenue, costs, company cash, staffing, and valuation develop over time. You can keep a job while running it as a side business; quarterly distributions then depend on actual profits and cash.
- **Businesses & clubs** includes two football clubs, a GT racing team, an F1 team, private companies, and listed companies. Rare sale windows offer particular stakes for six weeks. Otherwise, pay a nonrefundable introduction fee, wait two weeks, and hope the owners agree to hear an offer. They may refuse the meeting or reject a low bid. Approaches have a 26-week cooldown.
- Submit a funded bid for a private business or a large block of listed shares. It reserves your cash while owners decide; acceptance still requires explicit closing within three weeks. Withdrawing, rejection, or expiry releases the reservation. A majority stake lets you set that business's strategy; private businesses also accept capital injections. Minority stakes earn proportional dividends. Sports results use a seasonal schedule, with weekly football outings and alternating-week racing outings during the active season.
- A life ends at age 90 or when health reaches zero. You can review your story or create a new life.

## Saves

Progress automatically saves in this browser's local storage. **Save & settings** can export a JSON backup or import one on another device. Imports are validated and require confirmation before replacing the current life. If a stored save cannot be read, its original contents are preserved as an exportable recovery copy. Browser data deletion clears local progress, so export backups regularly. The game has no cloud sync.

Version 0.1 saves upgrade automatically to the new model, preserving existing contract pay, cash, investments, founded companies, and owned clubs. The browser keeps an exportable **pre-update save** before its first automatic conversion. Future employment changes require applications and qualifications.

Net worth includes cash, investments, founded-company valuation, private ownership stakes, collectible estimates after commission, and possessions at their resale value. Listed-company ownership is counted once through its shares. Company valuations and collectible estimates are paper wealth. Submitted and accepted bids reduce uncommitted cash, which is used to determine whether new purchases are affordable.

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

Engine tests cover job eligibility and decisions, education and tuition, performance and pay reviews, market ownership and dividends, bid reservations and expiry, private acquisitions, collectible auctions, legacy saves, and long-run simulation. Browser tests exercise these flows through the dashboard, plus shopping, relationships, import/export, recovery, and mobile layouts.

## Structure and scope

- `src/engine.js`: pure state transitions, deterministic seeded randomness, catalogues, and save validation. Actions return new state rather than modifying the current save.
- `src/world.js`: employment, qualifications, business ownership, negotiations, company operations, and collectible auctions.
- `src/app.js`: dashboard, screen navigation, dialogs, local persistence, and save import/export.
- `src/screens.js`: work, education, business ownership, and collectible interfaces.
- `src/style.css`: responsive interface and locally drawn illustrations.
- `tests/`: engine and browser integration tests.

This is a playable foundation with fictional employers, markets, courses, and licences. Job recruitment and ownership now have prerequisites, waiting periods, and uncertain outcomes. Matches, races, staffing, and company operations still use simplified models. Cities share one economy. Private stakes currently have no sale/exit workflow; company insolvency, tax, loan underwriting, and actual motorsport licence regulations are not yet modeled.

Possible expansions include detailed sports calendars, squads and transfers, contract negotiation and agents, taxes and credit, private-business exits, relocation and distinct economies, families and children, employee recruitment, product launches, and a larger event/item catalogue. Keep these systems connected to the existing life, time, and financial simulation.
