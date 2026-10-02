// Data (GENDERS, FACTIONS, RACES, SPECS, BACKSTORY, ORACLE) lives in data.js, which loads first.

const WEIGHT_RACE = "Per race";
const WEIGHT_COMBO = "Per combination";
const RESULT_FIELDS = ["gender", "faction", "race", "class", "spec"];
const ANIMATE_ALL = [...RESULT_FIELDS, "backstory"];
const HISTORY_MAX = 3;
const PAYWALLED_RACE = "Skyborne";   // can be excluded with a checkbox

// Oracle mode: prices and odds (gold).
const ORACLE_START = 50;
const PRICE = { roll: 10, class: 5, backstory: 3 };
const CHEAPEST = Math.min(...Object.values(PRICE));
const ARGUE_COST = 2;        // the oracle bills for her time
const OFFENDED_FINE = 5;
const RELENT_CHANCE = 0.30;  // argue: free reroll
const REFUSE_CHANCE = 0.35;  // argue: nothing happens (the rest: a fine)

// ---- Small helpers ----
const $ = id => document.getElementById(id);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const unique = arr => [...new Set(arr)];
const matches = (filter, value) => filter === "Any" || filter === value;
const factionColor = f => `var(--${f.toLowerCase()})`;
const classColor = c => `var(--c-${c.toLowerCase()})`;
// Fill {placeholders} in a line of dialogue.
const fill = (text, vars) => text.replace(/\{(\w+)\}/g, (_, k) => vars[k]);

// ---- State ----
let current = null;          // the character on screen
let rollHistory = [];
let nextId = 1;
const oracle = { on: false, purse: ORACLE_START, free: 0, firstRollFree: false };

// ---- Filters ----
function fillSelect(el, values, keepValue, withAny = true) {
  el.innerHTML = "";
  for (const v of withAny ? ["Any", ...values] : values) {
    const o = document.createElement("option");
    o.value = o.textContent = v;
    el.appendChild(o);
  }
  el.value = values.includes(keepValue) ? keepValue : (withAny ? "Any" : values[0]);
}

const filters = () => ({
  gender: $("fGender").value, faction: $("fFaction").value,
  race: $("fRace").value, class: $("fClass").value,
  noPaywalled: $("excludePaywalled").checked,
});

// Is this race allowed under the filters (ignoring faction, race and class choices)?
const raceAllowed = (r, f) => !(f.noPaywalled && r.name === PAYWALLED_RACE);

// Race options depend on faction; class options depend on faction and race.
function refreshOptions() {
  const f = filters();
  const racePool = RACES.filter(r => matches(f.faction, r.faction) && raceAllowed(r, f));
  fillSelect($("fRace"), unique(racePool.map(r => r.name)), f.race);
  const race = $("fRace").value;   // may have been reset by the line above
  const classPool = racePool.filter(r => matches(race, r.name));
  fillSelect($("fClass"), unique(classPool.flatMap(r => r.classes)).sort(), f.class);
  updateHint();
}

// A race that exists in both factions (e.g. Skyborne) is rolled 50/50
// between them unless a faction filter is set. Tell the user.
function updateHint() {
  const f = filters();
  const shared = f.race !== "Any" && f.faction === "Any" &&
    RACES.filter(r => r.name === f.race).length > 1;
  $("hint").hidden = !shared;
  if (shared) {
    $("hint").textContent =
      `${f.race} is available to both factions. Faction will be picked at random unless you set one.`;
  }
}

// Every valid { race, cls } pair under the filters. Empty means no valid combination.
function validPairs(f = filters()) {
  return RACES
    .filter(r => raceAllowed(r, f) && matches(f.faction, r.faction) && matches(f.race, r.name))
    .flatMap(race => race.classes.filter(c => matches(f.class, c)).map(cls => ({ race, cls })));
}

// ---- Building a character ----
// "A <race> <class> <past>, <goal>." from the lists in data.js.
function makeBackstory(c) {
  const past = pick([...BACKSTORY.pasts, ...BACKSTORY.classPasts[c.class]]);
  const goal = pick([...BACKSTORY.goals, ...BACKSTORY.factionGoals[c.race.faction]]);
  const article = /^[AEIOU]/i.test(c.race.name) ? "An" : "A";
  return `${article} ${c.race.name} ${c.class} ${past}, ${goal}.`;
}

// Give a character a class, with a matching spec and backstory. It counts as a new character.
function setClass(c, cls) {
  c.id = nextId++;
  c.class = cls;
  c.spec = pick(SPECS[cls]);
  c.backstory = makeBackstory(c);
}

// ---- The oracle: optional mode where rerolls cost gold ----
const oracleSay = text => { $("oracleSay").textContent = text; };

// What an action costs right now: the first "Roll all" after switching the mode on
// is free, as is any action while free rerolls remain.
function priceOf(kind) {
  if (kind === "roll" && oracle.firstRollFree) return 0;
  return oracle.free > 0 ? 0 : PRICE[kind];
}
const canAfford = kind => oracle.purse >= priceOf(kind);

// Pay for an action. Returns the oracle's line for it ("" when the mode is off),
// or null if you can't afford it.
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
  if (oracle.purse < PRICE[kind]) {
    oracleSay(pick(ORACLE.broke));
    renderOracle();
    return null;
  }
  oracle.purse -= PRICE[kind];
  const lines = oracle.purse < CHEAPEST ? ORACLE.broke : ORACLE.paid;
  return fill(pick(lines), { cost: PRICE[kind] });
}

// The oracle's comment on a freshly rolled character, based on its class or race.
function reaction(c) {
  const lines = [...(ORACLE.reactClass[c.class] ?? []), ...(ORACLE.reactRace[c.race.name] ?? [])];
  return lines.length ? pick(lines) : "";
}

function announce(...parts) {
  if (oracle.on) oracleSay(parts.filter(Boolean).join(" "));
}

function argue() {
  if (oracle.purse < ARGUE_COST) return;
  oracle.purse -= ARGUE_COST;
  const r = Math.random();
  if (r < RELENT_CHANCE) {
    oracle.free++;
    oracleSay(pick(ORACLE.relent));
  } else if (r < RELENT_CHANCE + REFUSE_CHANCE) {
    oracleSay(pick(ORACLE.refuse));
  } else {
    const loss = Math.min(OFFENDED_FINE, oracle.purse);
    oracle.purse -= loss;
    oracleSay(loss ? fill(pick(ORACLE.offended), { loss }) : pick(ORACLE.nothingToTake));
  }
  renderOracle();
}

// Refresh the purse, the price tags on the buttons and which buttons are enabled.
function renderOracle() {
  const tag = kind => !oracle.on ? "" : priceOf(kind) === 0 ? "(free)" : `(${priceOf(kind)}g)`;
  $("oracle").hidden = !oracle.on;
  $("purse").textContent = `Purse: ${oracle.purse} gold`;
  $("freeCount").textContent = oracle.free ? `Free rerolls: ${oracle.free}` : "";
  $("costRoll").textContent = tag("roll");
  $("costClass").textContent = tag("class");
  $("costBackstory").textContent = tag("backstory");
  $("costArgue").textContent = `(${ARGUE_COST}g)`;
  $("roll").disabled = oracle.on && !!current && !canAfford("roll");
  $("rerollClass").disabled = !current || (oracle.on && !canAfford("class"));
  $("rerollBackstory").disabled = oracle.on && !canAfford("backstory");
  $("argue").disabled = oracle.purse < ARGUE_COST;
}

// ---- Actions ----
// Show a new character: save it to history, display it, and let the oracle comment.
function commit(line, animateFields) {
  record(current);
  renderCharacter(current, animateFields);
  announce(line, reaction(current));
}

function rollAll() {
  const f = filters();
  const pairs = validPairs(f);
  if (!pairs.length) { current = null; return renderCharacter(null); }

  // Per combination: every pair is equally likely. Per race: every matching
  // race is equally likely, then a class within it.
  let choice;
  if ($("fWeight").value === WEIGHT_COMBO) {
    choice = pick(pairs);
  } else {
    const race = pick(unique(pairs.map(p => p.race)));
    choice = pick(pairs.filter(p => p.race === race));
  }

  const line = charge("roll");
  if (line === null) return;
  current = { gender: f.gender === "Any" ? pick(GENDERS) : f.gender, race: choice.race };
  setClass(current, choice.cls);
  commit(line, ANIMATE_ALL);
}

function rerollClass() {
  if (!current) return rollAll();
  const options = validPairs().filter(p => p.race === current.race && p.cls !== current.class);
  if (!options.length) {
    // The filters allow only the current class, so there is nothing to switch to.
    return setNote("No other class matches your filters.");
  }
  const line = charge("class");
  if (line === null) return;
  setClass(current, pick(options).cls);
  commit(line, ["class", "spec", "backstory"]);
}

// Keep the same character and write a new backstory for it.
function rerollBackstory() {
  if (!current) return;
  const line = charge("backstory");
  if (line === null) return;
  current.backstory = makeBackstory(current);
  const entry = rollHistory.find(h => h.id === current.id);
  if (entry) entry.backstory = current.backstory;
  renderCharacter(current, ["backstory"]);
  announce(line);
}

// ---- Display ----
// Restart the CSS animation on the given result fields, even if the value is
// identical to last time. Fields stagger top to bottom. All classes are removed
// first so the browser only has to recalculate layout once, not once per field.
function animate(fields) {
  const els = fields.map($);
  els.forEach(el => el.classList.remove("roll"));
  void document.body.offsetWidth; // one forced reflow so the animation restarts
  els.forEach((el, i) => {
    el.style.setProperty("--i", i);
    el.classList.add("roll");
  });
}

// Short status line under the buttons; cleared by any roll or filter change.
function setNote(text = "") {
  $("note").textContent = text;
  $("note").hidden = !text;
}

function renderCharacter(c, animateFields = []) {
  setNote();
  $("result").hidden = !c;
  $("msg").hidden = !!c;
  $("backstoryWrap").hidden = !c;
  renderOracle();
  if (!c) { delete document.documentElement.dataset.faction; return; }
  document.documentElement.dataset.faction = c.race.faction;
  $("gender").textContent    = c.gender;
  $("faction").textContent   = c.race.faction;
  $("faction").style.color   = factionColor(c.race.faction);
  $("race").textContent      = c.race.name;
  $("class").textContent     = c.class;
  $("class").style.color     = classColor(c.class);
  $("spec").textContent      = c.spec;
  $("backstory").textContent = c.backstory;
  animate(animateFields);
}

// ---- History (this visit only; resets on refresh) ----
function record(c) {
  rollHistory.unshift({ ...c });
  rollHistory.length = Math.min(rollHistory.length, HISTORY_MAX);
  renderHistory();
}

function renderHistory() {
  const list = $("historyList");
  list.innerHTML = "";
  $("historyWrap").hidden = !rollHistory.length;
  rollHistory.forEach((c, i) => {
    const li = document.createElement("li");
    const b = document.createElement("button");
    b.type = "button";
    b.title = "Restore this character";
    b.dataset.i = i;
    const parts = [
      [c.gender],
      [c.race.faction, factionColor(c.race.faction)],
      [c.race.name],
      [c.class, classColor(c.class)],
      [c.spec],
    ];
    for (const [text, color] of parts) {
      const s = document.createElement("span");
      s.textContent = text;
      if (color) s.style.color = color;
      b.appendChild(s);
    }
    li.appendChild(b);
    list.appendChild(li);
  });
}

// ---- Wiring ----
fillSelect($("fGender"), GENDERS);
fillSelect($("fFaction"), FACTIONS);
fillSelect($("fWeight"), [WEIGHT_RACE, WEIGHT_COMBO], WEIGHT_RACE, false);
refreshOptions();

for (const id of ["fGender", "fFaction", "fRace", "fClass", "fWeight"]) {
  $(id).addEventListener("change", () => setNote());
}
$("fFaction").addEventListener("change", refreshOptions);
$("excludePaywalled").addEventListener("change", () => { refreshOptions(); setNote(); });
$("fRace").addEventListener("change", refreshOptions);
$("clear").addEventListener("click", () => {
  for (const id of ["fGender", "fFaction", "fRace", "fClass"]) $(id).value = "Any";
  refreshOptions();
});
$("roll").addEventListener("click", rollAll);
$("rerollClass").addEventListener("click", rerollClass);
$("rerollBackstory").addEventListener("click", rerollBackstory);
$("argue").addEventListener("click", argue);
$("clearHistory").addEventListener("click", () => { rollHistory = []; renderHistory(); });
$("historyList").addEventListener("click", e => {
  const btn = e.target.closest("button[data-i]");
  if (!btn) return;
  current = { ...rollHistory[Number(btn.dataset.i)] };
  renderCharacter(current, ANIMATE_ALL);
});
$("oracleMode").addEventListener("change", e => {
  oracle.on = e.target.checked;
  oracle.purse = ORACLE_START;
  oracle.free = 0;
  oracle.firstRollFree = oracle.on;
  oracleSay(oracle.on ? fill(pick(ORACLE.welcome), { gold: ORACLE_START }) : "");
  setNote();
  renderOracle();
});

// No automatic roll on load: the fields show "–" until the user rolls,
// and there is nothing to reroll yet (renderOracle disables those buttons).
renderOracle();
