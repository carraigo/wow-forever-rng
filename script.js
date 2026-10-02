// Data (GENDERS, FACTIONS, ROLES, RACES, SPECS) lives in data.js, which loads first.

const ALL_CLASSES = [...new Set(RACES.flatMap(r => r.classes))].sort();
const RESULT_FIELDS = ["gender", "faction", "race", "class", "spec", "role"];
const WEIGHT_RACE = "Per race";
const WEIGHT_COMBO = "Per combination";
const HISTORY_MAX = 10;

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
  race: $("fRace").value, class: $("fClass").value, role: $("fRole").value,
});

const classHasRole = (cls, role) =>
  role === "Any" || SPECS[cls].some(s => s.roles.includes(role));

// Classes a race can roll right now, given the Class and Role filters.
function eligibleClasses(race) {
  const f = filters();
  return race.classes.filter(c =>
    (f.class === "Any" || c === f.class) && classHasRole(c, f.role));
}

// Race options depend on faction; class options depend on faction, race and role.
function refreshOptions() {
  const f = filters();
  const racePool = RACES.filter(r => f.faction === "Any" || r.faction === f.faction);
  fillSelect($("fRace"), [...new Set(racePool.map(r => r.name))], f.race);
  const f2 = filters();
  const classPool = racePool.filter(r => f2.race === "Any" || r.name === f2.race);
  const classes = [...new Set(classPool.flatMap(r => r.classes))]
    .filter(c => classHasRole(c, f2.role)).sort();
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

// Pick a spec for the class, honouring the Role filter, then a role that
// spec can fill (random when it can fill more than one).
function rollSpec(cls) {
  const role = filters().role;
  const spec = pick(SPECS[cls].filter(s => role === "Any" || s.roles.includes(role)));
  return { spec: spec.name, role: role === "Any" ? pick(spec.roles) : role };
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
  current = { gender: pick(genderPool()), race, class: cls, ...rollSpec(cls) };
  record(current);
  show(current, RESULT_FIELDS);
}

function rerollClass() {
  if (!current) return rollAll();
  const options = eligibleClasses(current.race).filter(c => c !== current.class);
  if (!options.length) return show(current, ["class"]);
  current.class = pick(options);
  Object.assign(current, rollSpec(current.class));
  record(current);
  show(current, ["class", "spec", "role"]);
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

function show(c, animateFields = []) {
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
  $("role").textContent    = c.role;
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
      [c.role],
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
fillSelect($("fRole"), ROLES);
fillSelect($("fWeight"), [WEIGHT_RACE, WEIGHT_COMBO], WEIGHT_RACE, false);
refreshOptions();

$("fFaction").addEventListener("change", refreshOptions);
$("fRace").addEventListener("change", refreshOptions);
$("fRole").addEventListener("change", refreshOptions);
$("clear").addEventListener("click", () => {
  for (const id of ["fGender", "fFaction", "fRace", "fClass", "fRole"]) $(id).value = "Any";
  refreshOptions();
});
$("clearHistory").addEventListener("click", () => { rollHistory = []; renderHistory(); });
$("roll").addEventListener("click", rollAll);
$("rerollClass").addEventListener("click", rerollClass);

// No automatic roll on load: the fields show "–" until the user rolls,
// and there is nothing to reroll yet.
$("rerollClass").disabled = true;
