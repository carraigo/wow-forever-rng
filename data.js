// Game data for the Forever Random Character generator.
// A new race only needs an entry in RACES below. A new class needs an entry
// in CLASSES, and adding it to the races in RACES that can play it.
//
// Each race entry:
//   faction: "Alliance" | "Horde"
//   name:    display name
//   classes: classes this race can be (alphabetical keeps the list tidy)
//
// A race available to both factions (e.g. Skyborne) is listed once per faction.

const GENDERS = ["Male", "Female"];
const FACTIONS = ["Alliance", "Horde"];

// Each faction's colour: "light" on the light page, "dark" on the dark page
// and always on the summoning and the character card, which are always dark.
const FACTION_COLORS = {
  Alliance: { light: "#1e5fbf", dark: "#5b9bf0" },
  Horde:    { light: "#b3261e", dark: "#e5534b" },
};

// Everything about a class in one place:
//   specs   one is picked at random when the class is rolled. NOTE: this
//           uses the classic three-tree layout. Check it against your
//           ruleset and edit as needed.
//   icon    a simple symbol for the summoning and the character card.
//           Ordinary emoji rather than Blizzard's class icons.
//   light   its colour on the light page
//   dark    its colour on the dark page, the summoning and the card
// The colours are tuned to reach at least 4.5:1 contrast against the page
// background, including the faint faction tint it takes on after a roll.
// script.js turns them into CSS variables (--c-druid ...) for style.css.
const CLASSES = {
  Druid:   { specs: ["Balance", "Feral", "Restoration"],             icon: "🌿", light: "#b44d00", dark: "#ff7c0a" },
  Hunter:  { specs: ["Beast Mastery", "Marksmanship", "Survival"],   icon: "🏹", light: "#4d7819", dark: "#aad372" },
  Mage:    { specs: ["Arcane", "Fire", "Frost"],                     icon: "🔮", light: "#0a769a", dark: "#3fc7eb" },
  Paladin: { specs: ["Holy", "Protection", "Retribution"],           icon: "🛡️", light: "#b8426f", dark: "#f48cba" },
  Priest:  { specs: ["Discipline", "Holy", "Shadow"],                icon: "🕯️", light: "#6b6b6b", dark: "#ffffff" },
  Rogue:   { specs: ["Assassination", "Combat", "Subtlety"],         icon: "🗡️", light: "#7d6c00", dark: "#fff468" },
  Shaman:  { specs: ["Elemental", "Enhancement", "Restoration"],     icon: "⚡", light: "#0058b0", dark: "#3a93f2" },
  Warlock: { specs: ["Affliction", "Demonology", "Destruction"],     icon: "💀", light: "#5e5fd0", dark: "#8788ee" },
  Warrior: { specs: ["Arms", "Fury", "Protection"],                  icon: "⚔️", light: "#8a6334", dark: "#c69b6d" },
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

// ---- Joelinton (optional mode: rerolls cost gold) ----
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
    "Joelinton sighs. Fine. One free reroll, and no more complaining.",
    "Very well. You wear me down. One free reroll.",
  ],
  refuse: [
    "Joelinton stares at you. The answer is still no.",
    "I have heard that argument from far better-dressed adventurers. No.",
    "Interesting. Wrong, but interesting.",
  ],
  offended: [
    "Joelinton is offended. {loss} gold for your insolence.",
    "How dare you. {loss} gold, for the insult.",
  ],
  // Joelinton's comment on a new character. One line is picked from the
  // character's class and race lines together.
  reactClass: {
    Druid:   ["A Druid. The trees were expecting you.", "A Druid? Try not to turn into anything I would have to clean up."],
    Hunter:  ["A Hunter. Please keep the pet away from my offerings.", "A Hunter. Bold of you to bring a bow into a place with a ceiling."],
    Mage:    ["A Mage. I hope you brought your own fire extinguisher.", "Another Mage. The library budget weeps."],
    Paladin: ["A Paladin. Do try to smite quietly.", "A Paladin. So much light, so little humility."],
    Priest:  ["A Priest. I will pray for your sake. Someone should.", "A Priest. Fate and faith, how neat."],
    Rogue:   ["A Rogue. I am counting my gold. Twice.", "A Rogue. Do not touch anything on the way out."],
    Shaman:  ["A Shaman. The storms send their regards.", "A Shaman. At least your totems will listen to you."],
    Warlock: ["A Warlock. I will not ask what you traded for this.", "A Warlock. The imp can wait outside."],
    Warrior: ["A Warrior. Subtle as ever.", "A Warrior. Please swing at something else."],
  },
  reactRace: {
    "Human":     ["A Human. Reliably unremarkable. Surprise me.", "A Human. The classic choice."],
    "Dwarf":     ["A Dwarf. I trust you brought your own ale.", "A Dwarf. Stout of heart, short of patience."],
    "Gnome":     ["A Gnome. Small, clever and probably on fire.", "A Gnome. Bold. Short, but bold."],
    "Night Elf": ["A Night Elf. You have seen a lot. Please do not mention it.", "A Night Elf. The moon is not impressed either."],
    "Skyborne":  ["A Skyborne. You came a long way for this.", "A Skyborne. Mind the ceiling, and Joelinton."],
    "Orc":       ["An Orc. Let us keep the shouting to a minimum.", "An Orc. A fine choice, if you enjoy being right."],
    "Undead":    ["An Undead. You look better than most of my customers.", "An Undead. Terribly fashionable."],
    "Tauren":    ["A Tauren. Mind the doorframe.", "A Tauren. Gentle giant. Mostly."],
    "Troll":     ["A Troll. Regenerating already, I see.", "A Troll. Ya, mon. Do not repeat that."],
  },
  // Joelinton's comment when a character is brought back from the history
  // list. Going back is free, and Joelinton has noticed.
  restore: [
    "Back to an old one, and not a coin for me. I have noticed.",
    "Fate does not give refunds. And yet here you are, getting one.",
    "Going back costs you nothing. Do not think I approve.",
    "Ah, the one you rolled away from. Bold.",
  ],
  nothingToTake: [
    "Joelinton would fine you for that, but your purse is already empty.",
  ],
};
