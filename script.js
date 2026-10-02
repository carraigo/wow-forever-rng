// Data (GENDERS, FACTIONS, RACES, SPECS) lives in data.js, which loads first.

const ALL_CLASSES = [...new Set(RACES.flatMap(r => r.classes))].sort();
const RESULT_FIELDS = ["gender", "faction", "race", "class", "spec"];
const WEIGHT_RACE = "Per race";
const WEIGHT_COMBO = "Per combination";
const HISTORY_MAX = 3;

const $ = id => document.getElementById(id);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
let current = null;
let rollHistory = [];

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
  current = { gender: pick(genderPool()), race, class: cls, ...rollSpec(cls) };
  record(current);
  show(current, RESULT_FIELDS);
}

function rerollClass() {
  if (!current) return rollAll();
  const options = eligibleClasses(current.race).filter(c => c !== current.class);
  if (!options.length) {
    // The filters allow only the current class, so there is nothing to switch to.
    return setNote("No other class matches your filters.");
  }
  current.class = pick(options);
  Object.assign(current, rollSpec(current.class));
  record(current);
  show(current, ["class", "spec"]);
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
  $("rerollClass").disabled = !c;
  if (!c) { delete document.documentElement.dataset.faction; return; }
  document.documentElement.dataset.faction = c.race.faction;
  $("gender").textContent  = c.gender;
  $("faction").textContent = c.race.faction;
  $("faction").style.color = `var(--${c.race.faction.toLowerCase()})`;
  $("race").textContent    = c.race.name;
  $("class").textContent   = c.class;
  $("class").style.color   = `var(--c-${c.class.toLowerCase()})`;
  $("spec").textContent    = c.spec;
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
    b.addEventListener("click", () => { current = { ...c }; show(current, RESULT_FIELDS); });
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

// No automatic roll on load: the fields show "–" until the user rolls,
// and there is nothing to reroll yet.
$("rerollClass").disabled = true;
