const GENDERS = ["Male", "Female"];

const RACES = [
  // Alliance
  { faction: "Alliance", name: "Human",     classes: ["Hunter","Mage","Paladin","Priest","Rogue","Warlock","Warrior"] },
  { faction: "Alliance", name: "Dwarf",     classes: ["Hunter","Paladin","Priest","Rogue","Shaman","Warrior"] },
  { faction: "Alliance", name: "Gnome",     classes: ["Mage","Priest","Rogue","Warlock","Warrior"] },
  { faction: "Alliance", name: "Night Elf", classes: ["Druid","Hunter","Priest","Rogue","Warrior"] },
  { faction: "Alliance", name: "Skyborne",  classes: ["Druid","Hunter","Mage","Rogue","Warrior"] },
  // Horde
  { faction: "Horde", name: "Orc",      classes: ["Hunter","Mage","Rogue","Shaman","Warlock","Warrior"] },
  { faction: "Horde", name: "Undead",   classes: ["Mage","Paladin","Priest","Rogue","Warlock","Warrior"] },
  { faction: "Horde", name: "Tauren",   classes: ["Druid","Hunter","Shaman","Warrior"] },
  { faction: "Horde", name: "Troll",    classes: ["Hunter","Mage","Priest","Rogue","Shaman","Warlock","Warrior"] },
  { faction: "Horde", name: "Skyborne", classes: ["Druid","Hunter","Rogue","Shaman","Warrior"] },
];

const FACTIONS = ["Alliance", "Horde"];
const ALL_CLASSES = [...new Set(RACES.flatMap(r => r.classes))].sort();

const $ = id => document.getElementById(id);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
let current = null;

function fillSelect(el, values, keepValue) {
  el.innerHTML = "";
  for (const v of ["Any", ...values]) {
    const o = document.createElement("option");
    o.value = o.textContent = v;
    el.appendChild(o);
  }
  el.value = values.includes(keepValue) ? keepValue : "Any";
}

const filters = () => ({
  gender: $("fGender").value, faction: $("fFaction").value,
  race: $("fRace").value, class: $("fClass").value,
});

// Race options depend on faction; class options depend on faction + race.
function refreshOptions() {
  const f = filters();
  const racePool = RACES.filter(r => f.faction === "Any" || r.faction === f.faction);
  fillSelect($("fRace"), [...new Set(racePool.map(r => r.name))], f.race);
  const f2 = filters();
  const classPool = racePool.filter(r => f2.race === "Any" || r.name === f2.race);
  fillSelect($("fClass"), [...new Set(classPool.flatMap(r => r.classes))].sort(), f2.class);
}

function matchingRaces() {
  const f = filters();
  return RACES.filter(r =>
    (f.faction === "Any" || r.faction === f.faction) &&
    (f.race === "Any" || r.name === f.race) &&
    (f.class === "Any" || r.classes.includes(f.class))
  );
}

function classPoolFor(race) {
  const f = filters();
  return f.class === "Any" ? race.classes : race.classes.filter(c => c === f.class);
}

function genderPool() {
  const g = filters().gender;
  return g === "Any" ? GENDERS : [g];
}

function rollAll() {
  const races = matchingRaces();
  if (!races.length) return show(null);
  const race = pick(races);
  current = { gender: pick(genderPool()), race, class: pick(classPoolFor(race)) };
  show(current);
}

function rerollClass() {
  if (!current) return rollAll();
  const options = classPoolFor(current.race).filter(c => c !== current.class);
  if (options.length) current.class = pick(options);
  show(current);
}

function show(c) {
  $("result").hidden = !c;
  $("msg").hidden = !!c;
  if (!c) { delete document.documentElement.dataset.faction; return; }
  document.documentElement.dataset.faction = c.race.faction;
  $("gender").textContent  = c.gender;
  $("faction").textContent = c.race.faction;
  $("faction").style.color = `var(--${c.race.faction.toLowerCase()})`;
  $("race").textContent    = c.race.name;
  $("class").textContent   = c.class;
  $("class").style.color   = `var(--c-${c.class.toLowerCase()})`;
}

fillSelect($("fGender"), GENDERS);
fillSelect($("fFaction"), FACTIONS);
refreshOptions();

$("fFaction").addEventListener("change", refreshOptions);
$("fRace").addEventListener("change", refreshOptions);
$("clear").addEventListener("click", () => {
  for (const id of ["fGender", "fFaction", "fRace", "fClass"]) $(id).value = "Any";
  refreshOptions();
});
$("roll").addEventListener("click", rollAll);
$("rerollClass").addEventListener("click", rerollClass);

rollAll();
