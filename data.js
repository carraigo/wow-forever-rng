// Game data for the Forever Random Character generator.
// To update for a patch: edit RACES below. No other file needs to change.
//
// Each race entry:
//   faction: "Alliance" | "Horde"
//   name:    display name
//   classes: classes this race can be (alphabetical keeps the list tidy)
//
// A race available to both factions (e.g. Skyborne) is listed once per faction.

const GENDERS = ["Male", "Female"];
const FACTIONS = ["Alliance", "Horde"];

// Specs per class. One is picked at random when a class is rolled.
// NOTE: this table uses the classic three-tree layout. Check it against
// your ruleset and edit as needed.
const SPECS = {
  Druid:   ["Balance", "Feral", "Restoration"],
  Hunter:  ["Beast Mastery", "Marksmanship", "Survival"],
  Mage:    ["Arcane", "Fire", "Frost"],
  Paladin: ["Holy", "Protection", "Retribution"],
  Priest:  ["Discipline", "Holy", "Shadow"],
  Rogue:   ["Assassination", "Combat", "Subtlety"],
  Shaman:  ["Elemental", "Enhancement", "Restoration"],
  Warlock: ["Affliction", "Demonology", "Destruction"],
  Warrior: ["Arms", "Fury", "Protection"],
};

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
