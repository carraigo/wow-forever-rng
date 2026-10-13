// =============================================================================
// Forever Random Character: the summoning
// =============================================================================
// After each "Roll all" the new character is revealed in a short ceremony:
// the screen goes dark, the faction's crest draws itself in, the class
// colour flashes, and the character appears with its loot quality and a
// word from Joelinton. The better the quality, the bigger the glow.
//
// index.html loads this file after script.js, so it can use what script.js
// defines ($, saveStored ...) as well as the data in data.js.
//
// The ceremony only covers the page; the character is already on screen
// underneath, so skipping it (the X, a click anywhere or any key) loses nothing. It is left
// out for people who have "reduce motion" turned on, and the "Reveal Animation"
// checkbox switches it off.

// ---- Settings ----
const SUMMON_LENGTH = 8000;          // ms from the start until it fades out
const SUMMON_FADE = 400;             // ms the fade out takes
const SUMMON_KEY = "forever-rng-summoning";   // where the checkbox is remembered

// A crest for each faction, drawn in a 200 x 200 box with the class symbol
// in the middle. They are our own drawings in the spirit of the two faction
// banners, not Blizzard's artwork:
//   Alliance  a knight's shield with a crown, flared top corners and a
//             double band down the middle
//   Horde     a round, notched war shield with three spikes and two axes
// Each <path> is drawn in turn by the CSS, so the order is the drawing order.
// pathLength="1" lets every line take the same time, however long it is.
const CRESTS = {
  Alliance: `
    <path pathLength="1" d="M18 28 C34 40 52 40 66 32 L100 18 L134 32 C148 40 166 40 182 28 C186 96 160 154 100 190 C40 154 14 96 18 28 Z"/>
    <path pathLength="1" d="M100 40 L132 52 C144 56 154 54 160 50 C160 100 140 138 100 164 C60 138 40 100 40 50 C46 54 56 56 68 52 Z"/>
    <path pathLength="1" d="M80 18 L84 2 L92 10 L100 -2 L108 10 L116 2 L120 18"/>
    <path pathLength="1" d="M18 28 L2 6 L34 22 M182 28 L198 6 L166 22"/>
    <path pathLength="1" d="M88 52 V150 M112 52 V150"/>`,
  Horde: `
    <path pathLength="1" d="M100 36 L111 42 L123 40 L131 49 L143 50 L149 61 L160 67 L161 79 L170 87 L168 99 L174 110 L168 121 L170 133 L161 141 L160 153 L149 159 L143 170 L131 171 L123 180 L111 178 L100 184 L89 178 L77 180 L69 171 L57 170 L51 159 L40 153 L39 141 L30 133 L32 121 L26 110 L32 99 L30 87 L39 79 L40 67 L51 61 L57 50 L69 49 L77 40 L89 42 Z"/>
    <path pathLength="1" d="M54 50 L34 6 L74 36 M86 36 L100 -8 L114 36 M126 36 L166 6 L146 50"/>
    <path pathLength="1" d="M64 182 L146 100 M136 182 L54 100"/>
    <path pathLength="1" d="M144 102 L171 109 Q167 133 143 137 L136 110 M56 102 L29 109 Q33 133 57 137 L64 110"/>`,
};

const crestSvg = faction =>
  `<svg class="sigil" viewBox="0 0 200 200" aria-hidden="true">${CRESTS[faction]}</svg>`;

let summonTimer = null;              // the pending fade out, if one is playing

// ---- On or off ----
// The checkbox is remembered in the browser like the filters. If storage is
// blocked it is simply on each visit.
function summoningOn() {
  return $("summonMode").checked;
}

function saveSummoning() {
  saveStored(SUMMON_KEY, summoningOn() ? "on" : "off");
}

function loadSummoning() {
  if (loadStored(SUMMON_KEY) === "off") $("summonMode").checked = false;
}

// ---- The ceremony ----
// Will a summoning play after the next roll? Not if the checkbox is off,
// and never for people who have "reduce motion" turned on.
function willSummon() {
  return summoningOn() && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Build the overlay for a character and play it. Called by rollAll() in
// script.js after a successful roll, with Joelinton's comment on the
// character, so the summoning quotes the same line as his panel, and the
// loot quality rolled for it (an entry from QUALITIES).
function summon(character, say, quality) {
  if (!character || !quality || !willSummon()) return;
  endSummoning(true);                // a summoning already playing ends at once

  const overlay = document.createElement("div");
  overlay.className = "summoning";
  // The colours go in as CSS variables; the animations in style.css use them.
  overlay.style.setProperty("--sigil", FACTION_COLORS[character.race.faction].dark);
  overlay.style.setProperty("--flash", CLASSES[character.class].dark);
  overlay.style.setProperty("--quality", quality.color);
  // style.css gives the better qualities their extra effects from this.
  overlay.dataset.quality = quality.name;
  // Screen readers already hear the result through the aria-live list, so
  // everything but the close button is hidden from them; it is decoration.
  overlay.innerHTML = `
    <button class="summon-close" type="button" aria-label="Close the summoning">
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3 L13 13 M13 3 L3 13"/></svg>
    </button>
    <div class="summon-body" aria-hidden="true">
    <div class="summon-circle">${crestSvg(character.race.faction)}<span class="summon-icon"></span></div>
    <p class="summon-quality"></p>
    <p class="summon-who"></p>
    <p class="summon-class"></p>
    <p class="summon-spec"></p>
    <p class="summon-say"></p>
    <p class="summon-by">Joelinton</p>
    </div>`;
  // Text goes in with textContent so nothing in it is read as HTML.
  overlay.querySelector(".summon-icon").textContent = CLASSES[character.class].icon;
  overlay.querySelector(".summon-quality").textContent = quality.name;
  overlay.querySelector(".summon-who").textContent =
    `${character.gender} ${character.race.name} · ${character.race.faction}`;
  overlay.querySelector(".summon-class").textContent = character.class;
  overlay.querySelector(".summon-spec").textContent = character.spec;
  overlay.querySelector(".summon-say").textContent = say ? `“${say}”` : "";
  document.body.appendChild(overlay);

  summonTimer = setTimeout(() => endSummoning(), SUMMON_LENGTH);
  // Listen for a skip only from the next moment on. Otherwise the very key
  // press that clicked "Roll all" would count as one and skip it at once.
  setTimeout(() => {
    window.addEventListener("keydown", skipSummoning, true);
    // A click anywhere closes it, the X included (the click reaches the
    // overlay from the button inside it).
    overlay.addEventListener("click", () => endSummoning());
  }, 0);
}

// A key pressed during the ceremony ends it. Enter and Space would also
// press the button that has focus (a second "Roll all"), so preventDefault
// stops them doing that. Every other key still does its usual job as well,
// so Tab, refresh (F5, Ctrl+R) and other shortcuts keep working.
function skipSummoning(event) {
  if (event.key === "Enter" || event.key === " ") event.preventDefault();
  endSummoning();
}

// Fade the overlay out and remove it. "now" removes it without the fade.
function endSummoning(now = false) {
  clearTimeout(summonTimer);
  window.removeEventListener("keydown", skipSummoning, true);
  for (const overlay of document.querySelectorAll(".summoning")) {
    if (now) {
      overlay.remove();
      continue;
    }
    overlay.classList.add("leaving");
    setTimeout(() => overlay.remove(), SUMMON_FADE);
  }
}

// ---- Wiring ----
loadSummoning();
$("summonMode").addEventListener("change", saveSummoning);
