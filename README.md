# Lifesim

A single-player life simulation with a Football Manager-inspired dashboard. Start at school or as an adult, then build a life through sport, music, content creation, entrepreneurship, investing, or regular employment.

## Run locally

Use Node.js 22.12+ (Node 24 is verified) and npm.

```sh
npm ci
npm run dev
```

Vite uses port 5173 by default. The game runs entirely in the browser: no database, account, API keys, or paid services are required. Fonts are served locally. `npm run build` produces the static site in `dist/`; `npm run preview` serves that build for validation.

## Play

- Choose **Your character → Create a new character** to customize your name, age (12–60), city, personality, education, and life path. Choosing a sport sets the form to age 14 and starts local participation. You can override the age. A completed-degree background requires age 21+. A new life replaces the current browser save.
- School-age characters start with $500. Guardians cover housing; unemployed teenagers receive $25 allowance and pay $15 personal costs each week, plus purchases and sport fees. School continues alongside hobbies and graduation at 18 awards a qualification if grades are sufficient. Adult characters start with $12,500; adult employment requires age 18+.
- Choose a **weekly focus** and advance with **Next week**. You earn income, pay living expenses, develop skills, and see market prices change. Demanding weeks drain energy; rest and training support wellbeing.
- **Work & education** has ordinary vacancies with qualification, skill, age, and relevant experience requirements. Apply using a free-time action, wait two weeks, then explicitly accept an offer. Eligibility does not guarantee selection. The board refreshes every four weeks; you can apply while employed. Professional playing and driving contracts are handled by the sports pathway, and never appear as job-board applications.
- **Sport & development** starts football through a school team or local amateur club. Choose a position and training plan, play seasonal matches, build ability and coach trust, and potentially receive an academy trial. Trials take two weeks and can fail; an offered academy place still needs acceptance. Academy development can lead to a development-squad contract, then senior club offers. Age, sustained participation, fitness, ability, discipline, and results matter. Contracts last 104 weeks; expiry stops wages, while a proven player can seek another club through scouting. Football injuries require recovery, and retirement ends playing income.
- Motorsport begins with karting, then driver development and offered F4, F3, F2, and F1 seats. National, international, and top-level licences gate progression. Higher categories require relevant professional experience, and tuition and competition costs need funding. Basketball develops from local or school participation through academy and league offers. Tennis develops through local competition, academy, and tour sponsorship; professional tournament wins can earn prize money in addition to sponsorship income. You can keep unpaid hobbies alongside a job; signing a paid sporting contract replaces your existing paid contract.
- Study for certificates, degrees, and racing licences. Tuition is charged weekly. The study focus advances one study week; other focuses advance half a study week. Unaffordable tuition pauses progress. A degree also satisfies a certificate requirement in the same field. A qualification unlocks eligible applications only after graduation; withdrawing forfeits partial progress and paid tuition.
- Employment contracts have their own pay, tenure, and sustained performance. Discuss a raise after 13 weeks, then every 26 weeks; it can be refused. Strong performance can earn a 3% annual merit increase. Sporting pay changes through offered contracts. Well-connected characters can occasionally receive unusual job introductions with different entry requirements.
- A life choice arrives every two weeks. School-age lives receive school, youth sport, creativity, and friendship scenarios; adults receive the existing fifteen scenarios. Resolve the choice before advancing.
- Three free-time actions are available each week. Meet people, strengthen friendships, or develop a romantic relationship. Connections gradually weaken without attention. Romantic connections need 60 bond; an established partner can become a spouse when their bond reaches 90.
- **Investments** offers fictional listed-company shares, an index fund, crypto, bonds, and a property fund. Crypto supports fractional units; other assets use whole units. Trades have a $1 minimum and weekly liquidity limits. Horizon Technologies and Solstice Energy shares represent actual ownership percentages; controlling more than 50% grants management control. Funds distribute quarterly income, and companies pay dividends when profits and cash allow it. A negative personal balance carries 0.5% weekly interest.
- Collect watches, sports memorabilia, art, and classic cars when dealer listings appear. Estimated values fluctuate. Reselling requires a two-week auction; a high reserve can leave an item unsold. Successful auctions deduct an 8% commission.
- **Lifestyle & shopping** has 57 possessions: everyday essentials, clothing, music and creator equipment, training gear, hobbies, vehicles, homes, and luxury travel. Filter by category, search, sort by price, or show only owned items. Some purchases have age restrictions and recurring upkeep. Equipment supports particular habits or production quality. An owned home replaces rent, while every owned property's maintenance remains payable. Ordinary possessions sell for 80% of their purchase price; buying a luxury item does not buy an audience.
- Eight repeatable experiences include dinners, concerts, travel, football camps, creative workshops, and networking. Each uses cash and a free-time action, has a cooldown, and changes wellbeing, connections, craft, or training.
- **Social media & fame** offers Lens photos, Loop short videos, ViewTube long videos, and Streamroom live streams. Accounts require age 13+ and a phone or computer; publishing needs appropriate recording equipment. Choose a niche, privacy, and authentic, polished, or clickbait content. Each post costs cash, an action, and energy; at most two posts can be produced per week. Audience results arrive the following week. Content skill, equipment, subject knowledge, reputation, and luck affect reach. Inactivity loses followers, and viral posts are rare.
- Recent public accounts with 1,000 followers can earn advertising income. Brands can approach accounts with 5,000 followers and strong reputation. Accepting a collaboration earns no immediate cash: deliver labelled public content with sufficient quality within three weeks. Missed delivery earns no fee and harms reputation. Private accounts retain their existing audience but do not earn advertising or sponsorship income through discovery. Fame also reflects sporting reputation and music fans.
- **Music & creativity** supports singers, rappers, and producers. Choose a role and genre, practise vocals, lyrics, and production, then record after eight sessions. A release costs $150, requires recording equipment, and takes four weeks. Streams generate simulated royalties of $0.002 each, while audiences and production quality affect results. Local gig invitations depend on craft and practice; booking earns a fee only after a successful performance. Established artists can receive label offers: a 52-week agreement pays an advance, retains half the royalties, and recoups the advance from your share before further royalty cash is paid.
- Found a company with 30 business skill and $5,000 of startup capital. Name it, choose an industry, and decide how much positive profit to draw or retain. Revenue, costs, company cash, staffing, and valuation develop over time. You can keep a job while running it as a side business; quarterly distributions then depend on actual profits and cash.
- **Businesses & clubs** includes two football clubs, a GT racing team, an F1 team, private companies, and listed companies. Rare sale windows offer particular stakes for six weeks. Otherwise, pay a nonrefundable introduction fee, wait two weeks, and hope the owners agree to hear an offer. They may refuse the meeting or reject a low bid. Approaches have a 26-week cooldown.
- Submit a funded bid for a private business or a large block of listed shares. It reserves your cash while owners decide; acceptance still requires explicit closing within three weeks. Withdrawing, rejection, or expiry releases the reservation. A majority stake lets you set that business's strategy; private businesses also accept capital injections. Minority stakes earn proportional dividends. Sports results use a seasonal schedule, with weekly football outings and alternating-week racing outings during the active season.
- A life ends at age 90 or when health reaches zero. You can review your story or create a new life.

## Saves

Progress automatically saves in this browser's local storage. **Save & settings** can export a JSON backup or import one on another device. Imports are validated and require confirmation before replacing the current life. If a stored save cannot be read, its original contents are preserved as an exportable recovery copy. Browser data deletion clears local progress, so export backups regularly. The game has no cloud sync.

Version 0.1 and 0.2 saves upgrade automatically, preserving contract pay, cash, investments, founded companies, and owned clubs. Existing professional players and drivers keep their contracts; outstanding athlete job applications are retired in favour of development and scouting. The browser keeps an exportable **pre-update save** before automatic conversion. Its storage key stays unchanged so existing lives are found.

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

Engine tests cover youth finances, school graduation, sporting recruitment and licensing, contract expiry, practical equipment, experiences, creator production, privacy, sponsor delivery, music releases, gigs, label recoupment, and save migration, alongside employment, investments, acquisitions, and relationships. Browser tests exercise these flows through the dashboard, plus import/export, recovery, and mobile layouts.

## Structure and scope

- `src/engine.js`: pure state transitions, deterministic seeded randomness, catalogues, and save validation. Actions return new state rather than modifying the current save.
- `src/world.js`: employment, qualifications, business ownership, negotiations, company operations, and collectible auctions.
- `src/app.js`: dashboard, screen navigation, dialogs, local persistence, and save import/export.
- `src/screens.js`: work, education, business ownership, and collectible interfaces.
- `src/life.js`: school, football development, social platforms, fame, and experiences.
- `src/sport.js`: karting/motorsport, basketball, and tennis development and recruitment.
- `src/music.js`: creative craft, recording, royalties, performances, and label agreements.
- `src/catalogue.js`: expanded possessions and repeatable experiences.
- `src/life-screens.js`: sports, music, social media, and shopping interfaces.
- `src/style.css`: responsive interface and locally drawn illustrations.
- `tests/`: engine and browser integration tests.

This is a playable foundation with fictional employers, markets, platforms, courses, and licences. Recruitment, audience growth, creative earnings, and ownership have prerequisites, waiting periods, and uncertain outcomes. Matches, races, tournaments, music distribution, algorithms, staffing, and company operations use simplified models. Cities share one economy. Actual sports regulations, copyright/licensing administration, tax, loan underwriting, insolvency, and private-business exits are not yet modeled.

Possible expansions include detailed sports calendars, squads and transfers, contract negotiation and agents, taxes and credit, private-business exits, relocation and distinct economies, families and children, employee recruitment, product launches, and a larger event/item catalogue. Keep these systems connected to the existing life, time, and financial simulation.
