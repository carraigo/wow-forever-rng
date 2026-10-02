// Data (GENDERS, FACTIONS, RACES, SPECS, BACKSTORY, ORACLE) lives in data.js, which loads first.

const ALL_CLASSES = [...new Set(RACES.flatMap(r => r.classes))].sort();
const RESULT_FIELDS = ["gender", "faction", "race", "class", "spec"];
const WEIGHT_RACE = "Per race";
const WEIGHT_COMBO = "Per combination";
const HISTORY_MAX = 3;
const ANIMATE_ALL = [...RESULT_FIELDS, "backstory"];
const ORACLE_START = 50;
const PRICE = { roll: 10, class: 5, backstory: 3 };
const ARGUE_COST = 2;      // the oracle bills for her time
const OFFENDED_FINE = 5;

const $ = id => document.getElementById(id);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
let current = null;
let rollHistory = [];
let nextId = 1;
let oracleOn = false, purse = ORACLE_START, freeRerolls = 0;

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
});

// Classes a race can roll right now, given the Class filter.
function eligibleClasses(race) {
  const f = filters();
  return race.classes.filter(c => f.class === "Any" || c === f.class);
}

// Race options depend on faction; class options depend on faction and race.
function refreshOptions() {
  const f = filters();
  const racePool = RACES.filter(r => f.faction === "Any" || r.faction === f.faction);
  fillSelect($("fRace"), [...new Set(racePool.map(r => r.name))], f.race);
  const f2 = filters();
  const classPool = racePool.filter(r => f2.race === "Any" || r.name === f2.race);
  const classes = [...new Set(classPool.flatMap(r => r.classes))].sort();
  fillSelect($("fClass"), classes, f2.class);
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

function matchingRaces() {
  const f = filters();
  return RACES.filter(r =>
    (f.faction === "Any" || r.faction === f.faction) &&
    (f.race === "Any" || r.name === f.race) &&
    eligibleClasses(r).length > 0
  );
}

function genderPool() {
  const g = filters().gender;
  return g === "Any" ? GENDERS : [g];
}

// Pick a random spec for the class.
const rollSpec = cls => ({ spec: pick(SPECS[cls]) });

// "A <race> <class> <past>, <goal>." from the lists in data.js.
function makeBackstory(c) {
  const past = pick([...BACKSTORY.pasts, ...BACKSTORY.classPasts[c.class]]);
  const goal = pick([...BACKSTORY.goals, ...BACKSTORY.factionGoals[c.race.faction]]);
  const article = /^[AEIOU]/i.test(c.race.name) ? "An" : "A";
  return `${article} ${c.race.name} ${c.class} ${past}, ${goal}.`;
}

// ---- The oracle: optional mode where rerolls cost gold ----
function priceOf(kind) {
  if (kind === "roll" && !current) return 0;      // the first roll is free
  return freeRerolls > 0 ? 0 : PRICE[kind];
}
const canAfford = kind => purse >= priceOf(kind);
const oracleSay = text => { $("oracleSay").textContent = text; };

// Pay for an action. Returns false if the player can't afford it.
function spend(kind) {
  if (!oracleOn) return true;
  if (kind === "roll" && !current) {
    oracleSay(pick(ORACLE.first));
  } else if (freeRerolls > 0) {
    freeRerolls--;
    oracleSay(pick(ORACLE.free));
  } else if (purse >= PRICE[kind]) {
    purse -= PRICE[kind];
    const broke = purse < Math.min(...Object.values(PRICE));
    oracleSay(pick(broke ? ORACLE.broke : ORACLE.paid).replace("{cost}", PRICE[kind]));
  } else {
    oracleSay(pick(ORACLE.broke));
    renderOracle();
    return false;
  }
  renderOracle();
  return true;
}

function argue() {
  if (purse < ARGUE_COST) return;
  purse -= ARGUE_COST;
  const r = Math.random();
  if (r < 0.30) {
    freeRerolls++;
    oracleSay(pick(ORACLE.relent));
  } else if (r < 0.65) {
    oracleSay(pick(ORACLE.refuse));
  } else {
    const loss = Math.min(OFFENDED_FINE, purse);
    purse -= loss;
    oracleSay(loss ? pick(ORACLE.offended).replace("{loss}", loss) : pick(ORACLE.nothingToTake));
  }
  renderOracle();
}

// Refresh the purse, the price tags on the buttons and which buttons are enabled.
function renderOracle() {
  $("oracle").hidden = !oracleOn;
  $("purse").textContent = `Purse: ${purse} gold`;
  $("freeCount").textContent = freeRerolls ? `Free rerolls: ${freeRerolls}` : "";
  const tag = kind => !oracleOn ? "" : priceOf(kind) === 0 ? "(free)" : `(${priceOf(kind)}g)`;
  $("costRoll").textContent = tag("roll");
  $("costClass").textContent = tag("class");
  $("costBackstory").textContent = tag("backstory");
  $("roll").disabled = oracleOn && !!current && !canAfford("roll");
  $("rerollClass").disabled = !current || (oracleOn && !canAfford("class"));
  $("rerollBackstory").disabled = oracleOn && !canAfford("backstory");
  $("argue").disabled = purse < ARGUE_COST;
  $("costArgue").textContent = `(${ARGUE_COST}g)`;
}

function rollAll() {
  const races = matchingRaces();
  if (!races.length) { current = null; return show(null); }
  let race, cls;
  if ($("fWeight").value === WEIGHT_COMBO) {
    // Every valid race + class pair is equally likely.
    ({ race, cls } = pick(races.flatMap(r => eligibleClasses(r).map(c => ({ race: r, cls: c })))));
  } else {
    // Every matching race is equally likely, then a class within it.
    race = pick(races);
    cls = pick(eligibleClasses(race));
  }
  if (!spend("roll")) return;
  current = { id: nextId++, gender: pick(genderPool()), race, class: cls, ...rollSpec(cls) };
  current.backstory = makeBackstory(current);
  record(current);
  show(current, ANIMATE_ALL);
}

function rerollClass() {
  if (!current) return rollAll();
  const options = eligibleClasses(current.race).filter(c => c !== current.class);
  if (!options.length) {
    // The filters allow only the current class, so there is nothing to switch to.
    return setNote("No other class matches your filters.");
  }
  if (!spend("class")) return;
  current.id = nextId++;
  current.class = pick(options);
  Object.assign(current, rollSpec(current.class));
  current.backstory = makeBackstory(current);
  record(current);
  show(current, ["class", "spec", "backstory"]);
}

// Keep the same character and write a new backstory for it.
function rerollBackstory() {
  if (!current || !spend("backstory")) return;
  current.backstory = makeBackstory(current);
  const entry = rollHistory.find(h => h.id === current.id);
  if (entry) entry.backstory = current.backstory;
  show(current, ["backstory"]);
}

// Restart the CSS animation on the given result fields, even if the
// value is identical to last time. Fields stagger top to bottom.
function animate(fields) {
  fields.forEach((id, i) => {
    const el = $(id);
    el.style.setProperty("--i", i);
    el.classList.remove("roll");
    void el.offsetWidth; // force reflow so the animation restarts
    el.classList.add("roll");
  });
}

// Short status line under the buttons; cleared by any roll or filter change.
function setNote(text = "") {
  $("note").textContent = text;
  $("note").hidden = !text;
}

function show(c, animateFields = []) {
  setNote();
  $("result").hidden = !c;
  $("msg").hidden = !!c;
  $("backstoryWrap").hidden = !c;
  renderOracle();
  if (!c) { delete document.documentElement.dataset.faction; return; }
  document.documentElement.dataset.faction = c.race.faction;
  $("gender").textContent  = c.gender;
  $("faction").textContent = c.race.faction;
  $("faction").style.color = `var(--${c.race.faction.toLowerCase()})`;
  $("race").textContent    = c.race.name;
  $("class").textContent   = c.class;
  $("class").style.color   = `var(--c-${c.class.toLowerCase()})`;
  $("spec").textContent    = c.spec;
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
  for (const c of rollHistory) {
    const li = document.createElement("li");
    const b = document.createElement("button");
    b.type = "button";
    b.title = "Restore this character";
    const parts = [
      [c.gender],
      [c.race.faction, `var(--${c.race.faction.toLowerCase()})`],
      [c.race.name],
      [c.class, `var(--c-${c.class.toLowerCase()})`],
      [c.spec],
    ];
    for (const [text, color] of parts) {
      const s = document.createElement("span");
      s.textContent = text;
      if (color) s.style.color = color;
      b.appendChild(s);
    }
    b.addEventListener("click", () => { current = { ...c }; show(current, ANIMATE_ALL); });
    li.appendChild(b);
    list.appendChild(li);
  }
}

fillSelect($("fGender"), GENDERS);
fillSelect($("fFaction"), FACTIONS);
fillSelect($("fWeight"), [WEIGHT_RACE, WEIGHT_COMBO], WEIGHT_RACE, false);
refreshOptions();

for (const id of ["fGender", "fFaction", "fRace", "fClass", "fWeight"]) {
  $(id).addEventListener("change", () => setNote());
}
$("fFaction").addEventListener("change", refreshOptions);
$("fRace").addEventListener("change", refreshOptions);
$("clear").addEventListener("click", () => {
  for (const id of ["fGender", "fFaction", "fRace", "fClass"]) $(id).value = "Any";
  refreshOptions();
});
$("clearHistory").addEventListener("click", () => { rollHistory = []; renderHistory(); });
$("roll").addEventListener("click", rollAll);
$("rerollClass").addEventListener("click", rerollClass);
$("rerollBackstory").addEventListener("click", rerollBackstory);
$("argue").addEventListener("click", argue);
$("oracleMode").addEventListener("change", e => {
  oracleOn = e.target.checked;
  purse = ORACLE_START;
  freeRerolls = 0;
  oracleSay(oracleOn ? pick(ORACLE.welcome).replace("{gold}", ORACLE_START) : "");
  setNote();
  renderOracle();
});

// No automatic roll on load: the fields show "–" until the user rolls,
// and there is nothing to reroll yet (renderOracle disables those buttons).
renderOracle();
