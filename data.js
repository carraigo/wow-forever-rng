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
const ROLES = ["Tank", "Healer", "DPS"];

// Specs per class. Each spec lists every role it can fill: a spec that can
// do more than one (e.g. Feral) lists them all, and one is picked at random
// when the Role filter is "Any".
// NOTE: this table uses the classic three-tree layout. Check it against
// your ruleset and edit as needed.
const SPECS = {
  Druid:   [ { name: "Balance",       roles: ["DPS"] },
             { name: "Feral",         roles: ["Tank", "DPS"] },
             { name: "Restoration",   roles: ["Healer"] } ],
  Hunter:  [ { name: "Beast Mastery", roles: ["DPS"] },
             { name: "Marksmanship",  roles: ["DPS"] },
             { name: "Survival",      roles: ["DPS"] } ],
  Mage:    [ { name: "Arcane",        roles: ["DPS"] },
             { name: "Fire",          roles: ["DPS"] },
             { name: "Frost",         roles: ["DPS"] } ],
  Paladin: [ { name: "Holy",          roles: ["Healer"] },
             { name: "Protection",    roles: ["Tank"] },
             { name: "Retribution",   roles: ["DPS"] } ],
  Priest:  [ { name: "Discipline",    roles: ["Healer"] },
             { name: "Holy",          roles: ["Healer"] },
             { name: "Shadow",        roles: ["DPS"] } ],
  Rogue:   [ { name: "Assassination", roles: ["DPS"] },
             { name: "Combat",        roles: ["DPS"] },
             { name: "Subtlety",      roles: ["DPS"] } ],
  Shaman:  [ { name: "Elemental",     roles: ["DPS"] },
             { name: "Enhancement",   roles: ["DPS"] },
             { name: "Restoration",   roles: ["Healer"] } ],
  Warlock: [ { name: "Affliction",    roles: ["DPS"] },
             { name: "Demonology",    roles: ["DPS"] },
             { name: "Destruction",   roles: ["DPS"] } ],
  Warrior: [ { name: "Arms",          roles: ["DPS"] },
             { name: "Fury",          roles: ["DPS"] },
             { name: "Protection",    roles: ["Tank"] } ],
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
