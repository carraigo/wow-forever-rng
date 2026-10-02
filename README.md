# WoW Forever RNG

A small static page that rolls a random World of Warcraft character: gender, faction, race and class. Filters let you narrow the pool, and "Reroll class" keeps the race and gender and picks a new class.

## Running it

No build step. Open `index.html` in a browser, or serve the folder with any static host.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure |
| `style.css` | Layout, light/dark themes, faction and class colors |
| `data.js` | Genders, factions, and the race/class table |
| `script.js` | Filtering, rolling and display logic |

## Updating the race and class data

All game data is in `data.js`. Edit the `RACES` array; nothing else needs to change.

- Each entry has a `faction`, a `name` and a list of allowed `classes`.
- A race playable by both factions (currently Skyborne) is listed once per faction. When the Faction filter is "Any", that race rolls its faction at random.
- A new class needs a color variable in `style.css`, named `--c-<classname>` in lowercase (for example `--c-monk`), in both the light and dark blocks.

## Notes

- Rolls pick a race first, then a class, so races with fewer classes make each of their classes slightly more likely than races with many.
- Roll animations are disabled for people who have "reduce motion" turned on.
