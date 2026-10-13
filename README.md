# WoW Forever RNG

A small static page that rolls a random World of Warcraft character: gender, faction, race, class and spec. Filters let you narrow the pool, and "Reroll class" keeps the race and gender and picks a new class (with a new spec).

## Features

- **Filters:** gender, faction, race and class. Options update to match each other.
- **Exclude Skyborne:** a checkbox under the filters removes Skyborne from the Race dropdown and from every roll, for players who would rather leave out the paid race. Unticking brings it back. "Clear filters" unticks it too.
- **Spec:** each roll includes a random spec for the rolled class.
- **Odds:** "Per race" gives every race the same chance. "Per combination" gives every valid race and class pair the same chance.
- **Backstory:** each roll comes with a one-line backstory hook. "Reroll backstory" writes a new one for the same character, and "Reroll class" writes a new one to match the new class.
- **Joelinton mode:** tick "Consult Joelinton" and rerolls cost gold: Roll all 10, Reroll class 5, Reroll backstory 3. You start with 50 gold and the first "Roll all" after switching the mode on is free. "Argue with Joelinton" costs 2 gold and has a 30% chance of a free reroll, a 35% chance of nothing and a 35% chance of a 5 gold fine. Turning the mode off and on resets the purse.
- **Roll counting:** if the GoatCounter script is on the page, each roll sends it an event (`roll-all`, `reroll-class` or `reroll-backstory`), so the dashboard shows how often people roll and not only how often the page is opened. Without the script, or with it blocked, rolling works as normal.
- **History:** the last 3 rolls are listed under the result. Click one to restore it. Restoring is free even in Joelinton mode, though Joelinton comments on it. History is kept for the current visit only and clears on refresh.
- **Character card:** "Save card" under the backstory makes a 1200×630 PNG of the character on screen, in its class colour with a faction badge, a simple class symbol, the backstory and the site's address. With Joelinton mode on, the card also shows the gold left. On a computer it downloads; on a phone it opens the share menu. It also counts as a `save-card` event in GoatCounter.
- **The summoning:** after each "Roll all" the character is revealed in a short ceremony over the page: the screen goes dark, the faction's crest draws itself in its colour (a crowned shield for the Alliance, a spiked war shield with crossed axes for the Horde; our own drawings, not Blizzard artwork), the class colour flashes, and the class, spec and a line from Joelinton appear. It stays up for about eight seconds; the X in the corner, a click anywhere or any key closes it sooner. The "Reveal Animation" checkbox turns it off (remembered in the browser), and it never plays for people who have "reduce motion" turned on.
- **Loot quality:** each summoning also reveals a quality, like an item drop, in WoW's item colours: Poor 10%, Common 45%, Uncommon 25%, Rare 13%, Epic 6% and Legendary 1%. It appears only on the summoning, as its name above the character and a glow behind the crest from Uncommon up, with turning rays of light for Epic and Legendary. It is only for show and never changes the race or class odds. Joelinton comments on Poor, Epic and Legendary ones. With the summoning off, no quality is rolled.
- **Remembered filters:** the filters, the "Exclude Skyborne" checkbox and the weighting are saved in the browser and come back after a refresh or a later visit. "Clear filters" saves the cleared state too. If the browser blocks storage, the page works as before and simply forgets.

## Running it

No build step. Open `index.html` in a browser, or serve the folder with any static host.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure |
| `style.css` | Layout, light/dark themes, faction and class colors |
| `data.js` | Genders, factions and their colours, the class table (specs, symbols, colours), the race/class table, backstory lines and Joelinton's dialogue |
| `script.js` | Filtering, rolling and display logic |
| `card.js` | Draws and saves the character card |
| `summon.js` | The reveal ceremony after "Roll all" |

## Updating the race and class data

All game data is in `data.js`. A new race only needs an entry in the `RACES` array. A new class needs an entry in `CLASSES` too, and nothing outside `data.js` needs to change.

- Each entry has a `faction`, a `name` and a list of allowed `classes`.
- A race playable by both factions (currently Skyborne) is listed once per faction. When the Faction filter is "Any", that race rolls its faction at random. It still counts as one race for "Per race" odds, so it is as likely as any other race.
- Everything about a class is in the `CLASSES` table, keyed by class name: its `specs`, the `icon` used on the summoning and the character card (ordinary emoji, not Blizzard artwork), and its colour on the `light` page and on the `dark` page, the summoning and the card. Check the specs against your ruleset. The page turns the colours into CSS variables (`--c-druid` and so on) when it loads.
- Faction colours are in `FACTION_COLORS` in the same way.
- Backstory lines are in `BACKSTORY`: general pasts and goals, plus extra pasts per class and extra goals per faction. Each past starts with "who" or "whose" and each goal reads after a comma. Add or edit lines freely. A class or faction with no lines of its own just uses the general ones.
- Loot qualities are in `QUALITIES`, from worst to best, each with its `chance` (they should add up to 1) and its `color` on the summoning.
- Joelinton's lines are in `ORACLE`, including `reactClass` and `reactRace`, the comments on each new character, `reactQuality`, his comments on a Poor, Epic or Legendary summoning, and `restore`, the comments when a character is brought back from history. Prices, odds and the starting purse are constants at the top of `script.js`.
- The purse and price tags use `--gold` in `style.css`, set once for light mode and once for dark.
- The card's other colours (background, text, gold) are written out in `CARD_COLORS` at the top of `card.js`, because a canvas cannot read CSS variables.
- A new class needs an entry in `CLASSES` with its specs, symbol and two colours. Pick colours that reach 4.5:1 contrast against the page in light and dark mode. Its own backstory lines and Joelinton comments are optional.

## Data source

Race and class combinations: https://www.warcrafttavern.com/forever/guides/race-class-combos/

## Notes

- With "Per race" weighting, a race is picked first, then a class, so races with fewer classes make each of their classes more likely than races with many. Use "Per combination" to even this out.
- Roll animations are disabled for people who have "reduce motion" turned on.
