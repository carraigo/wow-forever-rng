# WoW Forever RNG

A small static page that rolls a random World of Warcraft character: gender, faction, race, class and spec. Filters let you narrow the pool, and "Reroll class" keeps the race and gender and picks a new class (with a new spec).

## Features

- **Filters:** gender, faction, race and class. Options update to match each other.
- **Exclude Skyborne:** a checkbox under the filters removes Skyborne from the Race dropdown and from every roll, for players who would rather leave out the paid race. Unticking brings it back. "Clear filters" leaves the checkbox as it is.
- **Spec:** each roll includes a random spec for the rolled class.
- **Odds:** "Per race" gives every race the same chance. "Per combination" gives every valid race and class pair the same chance.
- **Backstory:** each roll comes with a one-line backstory hook. "Reroll backstory" writes a new one for the same character, and "Reroll class" writes a new one to match the new class.
- **Joelinton mode:** tick "Consult Joelinton" and rerolls cost gold: Roll all 10, Reroll class 5, Reroll backstory 3. You start with 50 gold and the first "Roll all" after switching the mode on is free. "Argue with Joelinton" costs 2 gold and has a 30% chance of a free reroll, a 35% chance of nothing and a 35% chance of a 5 gold fine. Turning the mode off and on resets the purse.
- **Roll counting:** if the GoatCounter script is on the page, each roll sends it an event (`roll-all`, `reroll-class` or `reroll-backstory`), so the dashboard shows how often people roll and not only how often the page is opened. Without the script, or with it blocked, rolling works as normal.
- **History:** the last 3 rolls are listed under the result. Click one to restore it. Restoring is free even in Joelinton mode, though Joelinton comments on it. History is kept for the current visit only and clears on refresh.
- **Character card:** "Save card" under the backstory makes a 1200×630 PNG of the character on screen, in its class colour with a faction badge, a simple class symbol, the backstory and the site's address. With Joelinton mode on, the card also shows the gold left. On a computer it downloads; on a phone it opens the share menu. It also counts as a `save-card` event in GoatCounter.
- **Remembered filters:** the filters, the "Exclude Skyborne" checkbox and the weighting are saved in the browser and come back after a refresh or a later visit. "Clear filters" saves the cleared state too. If the browser blocks storage, the page works as before and simply forgets.

## Running it

No build step. Open `index.html` in a browser, or serve the folder with any static host.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure |
| `style.css` | Layout, light/dark themes, faction and class colors |
| `data.js` | Genders, factions, the race/class table, the class/spec table, backstory lines and Joelinton's dialogue |
| `script.js` | Filtering, rolling and display logic |
| `card.js` | Draws and saves the character card |

## Updating the race and class data

All game data is in `data.js`. Edit the `RACES` array; nothing else needs to change.

- Each entry has a `faction`, a `name` and a list of allowed `classes`.
- A race playable by both factions (currently Skyborne) is listed once per faction. When the Faction filter is "Any", that race rolls its faction at random.
- Specs are in the `SPECS` object, keyed by class, as a list of spec names. Check this table against your ruleset.
- Backstory lines are in `BACKSTORY`: general pasts and goals, plus extra pasts per class and extra goals per faction. Each past starts with "who" or "whose" and each goal reads after a comma. Add or edit lines freely.
- Joelinton's lines are in `ORACLE`, including `reactClass` and `reactRace`, the comments on each new character, and `restore`, the comments when a character is brought back from history. Prices, odds and the starting purse are constants at the top of `script.js`.
- The purse and price tags use `--gold` in `style.css`, set once for light mode and once for dark.
- Class symbols for the character card are in `CLASS_ICONS` in `data.js`. They are ordinary emoji, not Blizzard artwork. The card's colours are written out in `CARD_COLORS` at the top of `card.js`, because a canvas cannot read CSS variables.
- A new class needs a color variable in `style.css`, named `--c-<classname>` in lowercase (for example `--c-monk`), in both the light and dark blocks, plus an entry in `CLASS_ICONS` and in `CARD_COLORS`.

## Data source

Race and class combinations: https://www.warcrafttavern.com/forever/guides/race-class-combos/

## Notes

- With "Per race" weighting, a race is picked first, then a class, so races with fewer classes make each of their classes more likely than races with many. Use "Per combination" to even this out.
- Roll animations are disabled for people who have "reduce motion" turned on.
