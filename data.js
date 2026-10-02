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

// ---- Backstory hooks ----
// A hook reads: "A <race> <class> <past>, <goal>."
// One past is picked from `pasts` plus the class's own list, and one goal
// from `goals` plus the character's faction list. Add lines freely.
const BACKSTORY = {
  pasts: [
    "who fled a burning farmstead and never looked back",
    "who was raised by travelling merchants",
    "who lost a bet to a very large ogre",
    "who never finished their apprenticeship",
    "who woke up in a ditch holding a map and no memory",
    "who is sworn to a cause that no longer exists",
    "who is wanted in three towns for crimes they only half remember",
    "who left home with a single coin and a strong opinion",
  ],
  classPasts: {
    Druid:   ["who talks to trees more than to people", "who lost an argument with a grove and is still sulking"],
    Hunter:  ["whose loyal companion keeps stealing their dinner", "who claims never to have missed a shot, and has no witnesses"],
    Mage:    ["who set their own library on fire during an exam", "who still owes a lich a very overdue book"],
    Paladin: ["who swore a sacred vow before reading the fine print", "whose holy light flickers whenever taxes come up"],
    Priest:  ["who has heard every confession and sworn to forget most of them", "who prays often, mostly for better luck at dice"],
    Rogue:   ["who borrowed something valuable and forgot to return it", "whose last three aliases have all been caught"],
    Shaman:  ["whose totems have started giving unsolicited advice", "who argued with a storm and lost"],
    Warlock: ["who made a deal with a minor demon and now regrets the wording", "whose imp keeps filing formal complaints"],
    Warrior: ["who lost three swords to the same sinkhole", "who has never walked away from a fair fight, or several unfair ones"],
  },
  goals: [
    "and is now seeking the tavern that owes them a debt",
    "hoping to earn a name that isn't just a rumour",
    "determined to prove the rumours wrong",
    "chasing a rumour of treasure that is probably a trap",
    "and is looking for anyone who can cook",
  ],
  factionGoals: {
    Alliance: [
      "bound for the capital to settle an old score",
      "sent to find a lost patrol, whether or not it wants finding",
      "carrying a letter nobody will say who it is for",
    ],
    Horde: [
      "marching to join a warband that doesn't know they're coming",
      "seeking honour, or at least a decent story",
      "owing the clan a favour and dreading the collection",
    ],
  },
};

// ---- The oracle (optional mode: rerolls cost gold) ----
// {gold}, {cost} and {loss} are filled in by script.js.
const ORACLE = {
  welcome: [
    "Welcome, traveller. Fate is free the first time. After that, it costs. You hold {gold} gold.",
    "Ah, a customer. Your first roll is on the house. Every change of heart after that, you pay for. You hold {gold} gold.",
  ],
  first: [
    "Your first roll is free. Don't get used to it.",
    "A fresh start costs nothing. Doubt, however, is expensive.",
  ],
  paid: [
    "That will be {cost} gold. The stars do not work for free.",
    "{cost} gold. I accept that you are indecisive.",
    "Fate has been rerolled, and my fee is {cost} gold.",
    "{cost} gold, please. Second thoughts are my main income.",
  ],
  free: [
    "A free reroll. Enjoy it. I certainly won't.",
    "On the house this time. Do not tell the others.",
  ],
  broke: [
    "Your purse is empty. Keep what fate gave you.",
    "No gold, no reroll. Fate has spoken.",
  ],
  relent: [
    "The oracle sighs. Fine. One free reroll, and no more complaining.",
    "Very well. You wear me down. One free reroll.",
  ],
  refuse: [
    "The oracle stares at you. The answer is still no.",
    "I have heard that argument from far better-dressed adventurers. No.",
    "Interesting. Wrong, but interesting.",
  ],
  offended: [
    "The oracle is offended. {loss} gold for your insolence.",
    "How dare you. {loss} gold, for the insult.",
  ],
  nothingToTake: [
    "The oracle would fine you for that, but your purse is already empty.",
  ],
};
