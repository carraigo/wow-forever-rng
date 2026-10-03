// =============================================================================
// Forever Random Character: page logic
// =============================================================================
// The game data (GENDERS, FACTIONS, RACES, SPECS, BACKSTORY, ORACLE) lives in
// data.js. index.html loads data.js first, so everything it defines is already
// available by the time this file runs.
//
// How this file is laid out, top to bottom:
//   1. Settings          numbers and names you can tweak safely
//   2. Small helpers     one-line tools used everywhere else
//   3. State             what the page remembers while it is open
//   4. Filters           the dropdowns and which race/class pairs they allow
//   5. Building          making a character and its backstory
//   6. Joelinton         the optional mode where rerolls cost gold
//   7. Actions           what each button does
//   8. Display           putting things on screen
//   9. History           the list of recent rolls
//  10. Wiring            connecting buttons and dropdowns to the functions above
//
// Nothing runs until section 10: everything before it only defines things.

// ---- 1. Settings ----
const ANY = "Any";                   // the "no preference" choice in a dropdown
const WEIGHT_RACE = "Per race";
const WEIGHT_COMBO = "Per combination";
const PAYWALLED_RACE = "Skyborne";   // can be excluded with a checkbox
const HISTORY_MAX = 3;

// These are the ids of elements in index.html.
const FILTER_IDS = ["fGender", "fFaction", "fRace", "fClass"];
const RESULT_FIELDS = ["gender", "faction", "race", "class", "spec"];
// "...list" (the spread operator) unpacks a list into its items, so this is
// the five result fields plus "backstory" in one new list.
const ANIMATE_ALL = [...RESULT_FIELDS, "backstory"];

// Joelinton mode: prices and odds (gold).
const ORACLE_START = 50;
const PRICE = { roll: 10, class: 5, backstory: 3 };
// Object.values(PRICE) is [10, 5, 3]. Math.min wants separate numbers rather
// than a list, so "..." unpacks them: Math.min(10, 5, 3).
const CHEAPEST = Math.min(...Object.values(PRICE));
const ARGUE_COST = 2;        // Joelinton bills for the time
const OFFENDED_FINE = 5;
const RELENT_CHANCE = 0.30;  // argue: free reroll
const REFUSE_CHANCE = 0.35;  // argue: nothing happens (the rest: a fine)

// ---- 2. Small helpers ----
// These use "arrow functions", a short way to write a function:
//   const double = n => n * 2;
// means the same as
//   function double(n) { return n * 2; }

// Find an element on the page by its id. (Just a short name for a long
// built-in; it has nothing to do with the jQuery library.)
const $ = id => document.getElementById(id);

// A random item from a list. Math.random() gives a number from 0 up to (but
// never reaching) 1. Multiplying by the list length and rounding down turns
// that into a valid position: 0, 1, ... length - 1.
const pick = list => list[Math.floor(Math.random() * list.length)];

// The same list with duplicates removed. A Set can only hold each value once,
// and [...set] turns it back into an ordinary list.
const unique = list => [...new Set(list)];

// Does a value pass a dropdown filter? "Any" lets everything through.
const matches = (filter, value) => filter === ANY || filter === value;

// Colors come from CSS variables in style.css, e.g. var(--horde), var(--c-mage).
// Text inside `backticks` can have values dropped in with ${...}.
const factionColor = faction => `var(--${faction.toLowerCase()})`;
const classColor = cls => `var(--c-${cls.toLowerCase()})`;

// Fill {placeholders} in a line of dialogue:
//   fill("That will be {cost} gold.", { cost: 10 })  ->  "That will be 10 gold."
// The pattern /\{(\w+)\}/g finds every {word} in the text. For each one, the
// function is given the whole match (unused, hence "_") and the word inside
// the braces, and returns what to put there instead.
const fill = (text, values) => text.replace(/\{(\w+)\}/g, (_, name) => values[name]);

// Tell the analytics (GoatCounter) that something happened, e.g. a roll, so
// its dashboard shows how the page is used and not only that it was opened.
// "name" is what the event is listed under: "roll-all", "reroll-class" or
// "reroll-backstory".
// GoatCounter's script is loaded separately by index.html. It may not have
// arrived yet, may be blocked by an ad blocker, or may not be on the page at
// all, and then window.goatcounter (or its count function) does not exist.
// "?." means "if this is missing, stop here and do nothing" instead of
// causing an error, so rolling works either way.
const countEvent = name => window.goatcounter?.count?.({ path: name, title: name, event: true });

// ---- 3. State ----
// Everything the page remembers. It is all lost on refresh.
let current = null;          // the character on screen (null = none rolled yet)
let rollHistory = [];        // recent characters, newest first
let nextId = 1;              // each new character gets the next number as its id
const oracle = {
  on: false,                 // is Joelinton mode switched on?
  purse: ORACLE_START,       // gold left
  free: 0,                   // free rerolls won by arguing
  firstRollFree: false,      // true until the first "Roll all" after switching on
};

// ---- 4. Filters ----
// Replace the options in a dropdown.
//   select      the <select> element to fill
//   values      the choices to offer
//   keepValue   stay on this choice if it is still offered
//   withAny     put "Any" at the top (true unless told otherwise)
function fillSelect(select, values, keepValue, withAny = true) {
  const choices = withAny ? [ANY, ...values] : values;
  select.innerHTML = "";     // remove the old options
  for (const value of choices) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  }
  // Keep the previous choice if it survived; otherwise fall back to the first one.
  select.value = values.includes(keepValue) ? keepValue : choices[0];
}

// Read the filter controls into one object, so the rest of the code can say
// filters.race instead of looking the dropdown up each time.
function readFilters() {
  return {
    gender: $("fGender").value,
    faction: $("fFaction").value,
    race: $("fRace").value,
    class: $("fClass").value,
    noPaywalled: $("excludePaywalled").checked,
  };
}

// Is this race still in play after the Faction filter and the "Exclude
// Skyborne" checkbox? (The Race and Class dropdowns are checked separately.)
function isInPool(race, filters) {
  const excluded = filters.noPaywalled && race.name === PAYWALLED_RACE;
  return !excluded && matches(filters.faction, race.faction);
}

// Rebuild the Race and Class dropdowns so they only offer choices that can
// actually be rolled: race options depend on faction; class options depend on
// faction and race.
function refreshOptions() {
  const filters = readFilters();       // read BEFORE the dropdowns are rebuilt
  const racePool = RACES.filter(race => isInPool(race, filters));

  // .map() makes a new list by transforming each item: here, race -> its name.
  fillSelect($("fRace"), unique(racePool.map(race => race.name)), filters.race);

  // Re-read the race: fillSelect resets it to "Any" if the old choice is gone.
  const chosenRace = $("fRace").value;
  const classPool = racePool.filter(race => matches(chosenRace, race.name));
  // .flatMap() is .map() for when each item produces a list: it joins all the
  // little lists of classes into one long list. unique() then removes repeats.
  const classNames = unique(classPool.flatMap(race => race.classes)).sort();
  fillSelect($("fClass"), classNames, filters.class);

  updateHint();
}

// A race that exists in both factions (e.g. Skyborne) is rolled 50/50
// between them unless a faction filter is set. Tell the user.
function updateHint() {
  const filters = readFilters();
  const entriesForRace = RACES.filter(race => race.name === filters.race);
  const shared = filters.race !== ANY && filters.faction === ANY && entriesForRace.length > 1;
  $("hint").hidden = !shared;
  if (shared) {
    $("hint").textContent =
      `${filters.race} is available to both factions. Faction will be picked at random unless you set one.`;
  }
}

// Every valid { race, cls } pair under the filters. Empty means no valid
// combination. "filters = readFilters()" is a default: callers may pass the
// filters in, and if they don't, the dropdowns are read here.
// ("cls" is used because "class" is a reserved word in JavaScript.)
function validPairs(filters = readFilters()) {
  const pairs = [];
  for (const race of RACES) {
    if (!isInPool(race, filters) || !matches(filters.race, race.name)) continue;
    for (const cls of race.classes) {
      // { race, cls } is shorthand for { race: race, cls: cls }.
      if (matches(filters.class, cls)) pairs.push({ race, cls });
    }
  }
  return pairs;
}

// ---- 5. Building a character ----
// A character is a plain object:
//   { id, gender, race, class, spec, backstory }
// where "race" is one whole entry from RACES in data.js, so the faction is
// character.race.faction and the race's name is character.race.name.

// "A <race> <class> <past>, <goal>." from the lists in data.js.
function makeBackstory(character) {
  // General lines and the class's (or faction's) own lines go into one list,
  // then one is picked from the lot.
  const past = pick([...BACKSTORY.pasts, ...BACKSTORY.classPasts[character.class]]);
  const goal = pick([...BACKSTORY.goals, ...BACKSTORY.factionGoals[character.race.faction]]);
  // "An Orc" but "A Troll": the pattern asks whether the name starts (^) with
  // a vowel; the trailing "i" makes it ignore upper/lower case.
  const article = /^[AEIOU]/i.test(character.race.name) ? "An" : "A";
  return `${article} ${character.race.name} ${character.class} ${past}, ${goal}.`;
}

// Give a character a class, with a matching spec and backstory. It counts as
// a new character, so it gets a new id. This changes the object passed in
// rather than returning a new one.
function setClass(character, cls) {
  character.id = nextId++;   // use nextId, then add 1 to it for next time
  character.class = cls;
  character.spec = pick(SPECS[cls]);
  character.backstory = makeBackstory(character);
}

// ---- 6. Joelinton: optional mode where rerolls cost gold ----
// "kind" below is always one of the keys of PRICE: "roll", "class" or "backstory".

function oracleSay(text) {
  $("oracleSay").textContent = text;
}

// What an action costs right now: the first "Roll all" after switching the mode on
// is free, as is any action while free rerolls remain.
function priceOf(kind) {
  if (kind === "roll" && oracle.firstRollFree) return 0;
  return oracle.free > 0 ? 0 : PRICE[kind];
}

function canAfford(kind) {
  return oracle.purse >= priceOf(kind);
}

// Pay for an action and get Joelinton's line about it. Three possible results:
//   ""         Joelinton mode is off, so there is nothing to pay and nothing to say
//   a string   paid (or free): this is what Joelinton says about it
//   null       can't afford it; the caller must stop and not do the action
// The checks run in order, and each "return" ends the function, so a later
// check only runs if every earlier one did not apply.
function charge(kind) {
  if (!oracle.on) return "";

  if (kind === "roll" && oracle.firstRollFree) {
    oracle.firstRollFree = false;
    return pick(ORACLE.first);
  }

  if (oracle.free > 0) {
    oracle.free--;
    return pick(ORACLE.free);
  }

  const cost = PRICE[kind];
  if (oracle.purse < cost) {
    oracleSay(pick(ORACLE.broke));
    renderOracle();
    return null;
  }

  oracle.purse -= cost;
  // If that payment leaves too little for even the cheapest action,
  // Joelinton says so instead of the usual "that will be N gold".
  const lines = oracle.purse < CHEAPEST ? ORACLE.broke : ORACLE.paid;
  return fill(pick(lines), { cost });
}

// Joelinton's comment on a freshly rolled character, based on its class or race.
function reaction(character) {
  // "?? []" means "if there is no entry for this class/race, use an empty
  // list instead", so a race or class without lines doesn't cause an error.
  const classLines = ORACLE.reactClass[character.class] ?? [];
  const raceLines = ORACLE.reactRace[character.race.name] ?? [];
  const lines = [...classLines, ...raceLines];
  return lines.length ? pick(lines) : "";
}

// Have Joelinton say several things in one go, e.g. announce(price, comment).
// "...parts" collects however many arguments were passed into one list.
// filter(Boolean) drops the empty ones, and join(" ") glues the rest together
// with spaces.
function announce(...parts) {
  if (oracle.on) oracleSay(parts.filter(Boolean).join(" "));
}

// "Argue" button: pay a small fee, then one of three things happens.
// One random number from 0 to 1 decides which, by where it lands. With the
// settings at the top of this file (0.30 and 0.35) that works out as:
//   0.00 to 0.30   relents: one free reroll            (RELENT_CHANCE)
//   0.30 to 0.65   refuses: nothing happens            (REFUSE_CHANCE)
//   0.65 to 1.00   is offended: a fine                 (whatever is left)
function argue() {
  if (oracle.purse < ARGUE_COST) return;
  oracle.purse -= ARGUE_COST;

  const luck = Math.random();
  if (luck < RELENT_CHANCE) {
    oracle.free++;
    oracleSay(pick(ORACLE.relent));
  } else if (luck < RELENT_CHANCE + REFUSE_CHANCE) {
    oracleSay(pick(ORACLE.refuse));
  } else {
    // Joelinton can't take more gold than you have left.
    const loss = Math.min(OFFENDED_FINE, oracle.purse);
    oracle.purse -= loss;
    oracleSay(loss > 0 ? fill(pick(ORACLE.offended), { loss }) : pick(ORACLE.nothingToTake));
  }
  renderOracle();
}

// The small price label on a button: "", "(free)" or "(5g)".
function priceTag(kind) {
  if (!oracle.on) return "";
  const price = priceOf(kind);
  return price === 0 ? "(free)" : `(${price}g)`;
}

// Switch Joelinton mode on or off. Either way the purse starts over.
function setOracleMode(on) {
  oracle.on = on;
  oracle.purse = ORACLE_START;
  oracle.free = 0;
  oracle.firstRollFree = on;
  oracleSay(on ? fill(pick(ORACLE.welcome), { gold: ORACLE_START }) : "");
  setNote();
  renderOracle();
}

// Refresh the purse, the price tags on the buttons and which buttons are enabled.
function renderOracle() {
  $("oracle").hidden = !oracle.on;
  $("purse").textContent = `Purse: ${oracle.purse} gold`;
  $("freeCount").textContent = oracle.free ? `Free rerolls: ${oracle.free}` : "";

  $("costRoll").textContent = priceTag("roll");
  $("costClass").textContent = priceTag("class");
  $("costBackstory").textContent = priceTag("backstory");
  $("costArgue").textContent = `(${ARGUE_COST}g)`;

  // A button is switched off when its action can't be paid for.
  // "current" is either a character or null; hasCharacter is true or false.
  const hasCharacter = current !== null;
  $("roll").disabled = oracle.on && hasCharacter && !canAfford("roll");
  $("rerollClass").disabled = !hasCharacter || (oracle.on && !canAfford("class"));
  $("rerollBackstory").disabled = oracle.on && !canAfford("backstory");
  $("argue").disabled = oracle.purse < ARGUE_COST;
}

// ---- 7. Actions ----
// Decide which { race, cls } pair gets rolled.
//   Per combination: every pair is equally likely.
//   Per race: every matching race is equally likely, then a class within it.
function chooseRaceAndClass(pairs) {
  if ($("fWeight").value === WEIGHT_COMBO) return pick(pairs);
  const race = pick(unique(pairs.map(pair => pair.race)));
  return pick(pairs.filter(pair => pair.race === race));
}

// Show a new character: save it to history, display it, and let Joelinton comment.
function commit(oracleLine, animateFields) {
  record(current);
  renderCharacter(current, animateFields);
  announce(oracleLine, reaction(current));
}

// "Roll all" button: a completely new character.
function rollAll() {
  const filters = readFilters();
  const pairs = validPairs(filters);
  if (pairs.length === 0) {
    // The filters rule everything out: show the "no valid combination" message.
    current = null;
    renderCharacter(null);
    return;
  }

  const choice = chooseRaceAndClass(pairs);

  const oracleLine = charge("roll");
  if (oracleLine === null) return;   // couldn't pay: keep the current character

  current = {
    gender: filters.gender === ANY ? pick(GENDERS) : filters.gender,
    race: choice.race,
  };
  setClass(current, choice.cls);     // adds id, class, spec and backstory
  commit(oracleLine, ANIMATE_ALL);
  countEvent("roll-all");
}

// "Reroll class" button: same gender and race, different class.
function rerollClass() {
  if (!current) {
    rollAll();
    return;
  }
  const options = validPairs().filter(
    pair => pair.race === current.race && pair.cls !== current.class
  );
  if (options.length === 0) {
    // The filters allow only the current class, so there is nothing to switch to.
    setNote("No other class matches your filters.");
    return;
  }

  const oracleLine = charge("class");
  if (oracleLine === null) return;

  setClass(current, pick(options).cls);
  commit(oracleLine, ["class", "spec", "backstory"]);
  countEvent("reroll-class");
}

// "Reroll backstory" link: keep the same character and write a new backstory for it.
function rerollBackstory() {
  if (!current) return;
  const oracleLine = charge("backstory");
  if (oracleLine === null) return;

  current.backstory = makeBackstory(current);
  // It is still the same character, so update its history entry (found by
  // id) instead of adding a new one.
  const entry = rollHistory.find(saved => saved.id === current.id);
  if (entry) entry.backstory = current.backstory;

  renderCharacter(current, ["backstory"]);
  announce(oracleLine);
  countEvent("reroll-backstory");
}

// "Clear filters" button. The "Exclude Skyborne" checkbox is left as it is.
function clearFilters() {
  for (const id of FILTER_IDS) $(id).value = ANY;
  refreshOptions();
}

// ---- 8. Display ----
// Play the roll animation on the given result fields (a list of element ids).
//
// The animation is CSS (see ".roll" in style.css) and plays when an element
// gains the "roll" class. An element that already has the class won't replay
// it, so the class has to be taken off and put back on. But if that happens
// in one go the browser sees no change at all, so in between we ask it for a
// measurement (offsetWidth). To answer, it has to apply the removal first.
// The value itself is thrown away; "void" just says that is on purpose.
//
// All classes are removed first so the browser does that work once, not once
// per field. "--i" tells the CSS each field's position so they start one
// after another, top to bottom.
function animate(fields) {
  const elements = fields.map($);    // ids -> elements
  elements.forEach(element => element.classList.remove("roll"));
  void document.body.offsetWidth;
  elements.forEach((element, position) => {
    element.style.setProperty("--i", position);
    element.classList.add("roll");
  });
}

// Short status line under the buttons; cleared by any roll or filter change.
// Calling setNote() with nothing in the brackets clears it.
function setNote(text = "") {
  $("note").textContent = text;
  $("note").hidden = !text;          // an empty text counts as false, so: hide
}

// Put a character on screen, or the "no valid combination" message if there
// is none (character is null).
function renderCharacter(character, animateFields = []) {
  const hasCharacter = character !== null;
  setNote();
  $("result").hidden = !hasCharacter;
  $("msg").hidden = hasCharacter;
  $("backstoryWrap").hidden = !hasCharacter;
  renderOracle();

  // document.documentElement is the <html> element. Its data-faction
  // attribute is what style.css uses to tint the page blue or red.
  const page = document.documentElement;
  if (!hasCharacter) {
    delete page.dataset.faction;
    return;
  }
  page.dataset.faction = character.race.faction;

  $("gender").textContent    = character.gender;
  $("faction").textContent   = character.race.faction;
  $("faction").style.color   = factionColor(character.race.faction);
  $("race").textContent      = character.race.name;
  $("class").textContent     = character.class;
  $("class").style.color     = classColor(character.class);
  $("spec").textContent      = character.spec;
  $("backstory").textContent = character.backstory;
  animate(animateFields);
}

// ---- 9. History (this visit only; resets on refresh) ----
// Add a character to the top of the history, keeping only the newest few.
function record(character) {
  // { ...character } makes a copy. Without it, history would hold the very
  // same object as "current", and rerolling the class later would silently
  // change the saved entry as well.
  rollHistory.unshift({ ...character });           // unshift = add at the front
  rollHistory = rollHistory.slice(0, HISTORY_MAX); // drop anything past the limit
  renderHistory();
}

// One row of the history list: a button showing the character's details.
// "index" is the character's position in rollHistory, stored on the button
// (as data-i) so a click can tell which character to bring back.
function historyButton(character, index) {
  const button = document.createElement("button");
  button.type = "button";
  button.title = "Restore this character";
  button.dataset.i = index;

  // Each part is [text] or [text, color].
  const parts = [
    [character.gender],
    [character.race.faction, factionColor(character.race.faction)],
    [character.race.name],
    [character.class, classColor(character.class)],
    [character.spec],
  ];
  // "const [text, color]" unpacks each part into two names. For parts with
  // no color, "color" is undefined and the "if" below skips it.
  for (const [text, color] of parts) {
    const span = document.createElement("span");
    span.textContent = text;
    if (color) span.style.color = color;
    button.appendChild(span);
  }
  return button;
}

// Redraw the whole history list from rollHistory.
function renderHistory() {
  const list = $("historyList");
  list.innerHTML = "";
  $("historyWrap").hidden = rollHistory.length === 0;
  rollHistory.forEach((character, index) => {
    const item = document.createElement("li");
    item.appendChild(historyButton(character, index));
    list.appendChild(item);
  });
}

function clearRollHistory() {
  rollHistory = [];
  renderHistory();
}

// A click somewhere in the history list. One listener on the whole list
// handles every row, which is simpler than adding one to each button every
// time the list is redrawn. "event.target" is the exact thing clicked (often
// a <span> inside a button), and closest() walks up from it to the button
// that has the data-i attribute.
function restoreFromHistory(event) {
  const button = event.target.closest("button[data-i]");
  if (!button) return;               // the click missed every button
  // dataset values are always text, so "2" is turned back into the number 2.
  // Restoring uses a copy, for the same reason record() saves one.
  current = { ...rollHistory[Number(button.dataset.i)] };
  renderCharacter(current, ANIMATE_ALL);
}

// ---- 10. Wiring ----
// This part runs once, when the page loads.

// Fill the dropdowns.
fillSelect($("fGender"), GENDERS);
fillSelect($("fFaction"), FACTIONS);
fillSelect($("fWeight"), [WEIGHT_RACE, WEIGHT_COMBO], WEIGHT_RACE, false);
refreshOptions();

// addEventListener(what, fn) means "when this happens to that element, run
// fn". The function is passed by name, without brackets: writing rollAll()
// would run it right now instead of handing it over to be run later.

// Filters. Changing any of them clears the status note. The wrapper
// "() => setNote()" is there so setNote is called with nothing; passed
// directly, it would be handed the event and show it as the note.
for (const id of [...FILTER_IDS, "fWeight"]) {
  $(id).addEventListener("change", () => setNote());
}
$("fFaction").addEventListener("change", refreshOptions);
$("fRace").addEventListener("change", refreshOptions);
$("excludePaywalled").addEventListener("change", () => { refreshOptions(); setNote(); });
$("clear").addEventListener("click", clearFilters);

// Rolling.
$("roll").addEventListener("click", rollAll);
$("rerollClass").addEventListener("click", rerollClass);
$("rerollBackstory").addEventListener("click", rerollBackstory);

// History.
$("clearHistory").addEventListener("click", clearRollHistory);
$("historyList").addEventListener("click", restoreFromHistory);

// Joelinton. "event.target" is the checkbox; .checked is true when ticked.
$("oracleMode").addEventListener("change", event => setOracleMode(event.target.checked));
$("argue").addEventListener("click", argue);

// No automatic roll on load: the fields show "–" until the user rolls,
// and there is nothing to reroll yet (renderOracle disables those buttons).
renderOracle();
