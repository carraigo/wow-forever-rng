# WoW Forever RNG

A small static page that rolls a random World of Warcraft character: gender, faction, race, class, spec and role. Filters let you narrow the pool, and "Reroll class" keeps the race and gender and picks a new class (with a new spec and role).

## Features

- **Filters:** gender, faction, race, class and role. Options update to match each other.
- **Role and spec:** each roll includes a spec and the role it plays. Choosing a role narrows the classes to those that can fill it.
- **Odds:** "Per race" gives every race the same chance. "Per combination" gives every valid race and class pair the same chance.
- **History:** the last 10 rolls are listed under the result. Click one to restore it. History is kept for the current visit only and clears on refresh.

## Running it

No build step. Open `index.html` in a browser, or serve the folder with any static host.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure |
| `style.css` | Layout, light/dark themes, faction and class colors |
| `data.js` | Genders, factions, roles, the race/class table and the class/spec table |
| `script.js` | Filtering, rolling and display logic |

## Updating the race and class data

All game data is in `data.js`. Edit the `RACES` array; nothing else needs to change.

- Each entry has a `faction`, a `name` and a list of allowed `classes`.
- A race playable by both factions (currently Skyborne) is listed once per faction. When the Faction filter is "Any", that race rolls its faction at random.
- Specs are in the `SPECS` array, keyed by class. Each spec lists every role it can fill (for example, Feral Druid lists Tank and DPS). Check this table against your ruleset.
- A new class needs a color variable in `style.css`, named `--c-<classname>` in lowercase (for example `--c-monk`), in both the light and dark blocks.

## Data source

The race/class table reflects the Forever ruleset as entered by the project owner.

- Source: _add link here_
- Last verified: _add date here_

Update the last-verified date whenever you check the table against the game, since this is the part most likely to go stale after a patch.

## Notes

- With "Per race" weighting, a race is picked first, then a class, so races with fewer classes make each of their classes more likely than races with many. Use "Per combination" to even this out.
- Roll animations are disabled for people who have "reduce motion" turned on.
