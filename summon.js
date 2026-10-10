// =============================================================================
// Forever Random Character: the summoning
// =============================================================================
// After each "Roll all" the new character is revealed in a short ceremony:
// the screen goes dark, a sigil burns in the faction's colour, the class
// colour flashes, and the character appears with a word from Joelinton.
//
// index.html loads this file after script.js and card.js, so it can use what
// they define (current, reaction, $ ...) as well as CARD_COLORS from card.js.
//
// The ceremony only covers the page; the character is already on screen
// underneath, so skipping it (the X, a click anywhere or any key) loses nothing. It is left
// out for people who have "reduce motion" turned on, and the "Reveal Animation"
// checkbox switches it off.

// ---- Settings ----
const SUMMON_LENGTH = 8000;          // ms from the start until it fades out
const SUMMON_FADE = 400;             // ms the fade out takes
const SUMMON_KEY = "forever-rng-summoning";   // where the checkbox is remembered

// The sigil: two rings, two triangles making a star and eight short marks
// around the edge, in a 200 x 200 box. pathLength="1" lets the CSS draw every
// line in over the same time, however long it really is.
const SIGIL_SVG = `
<svg class="sigil" viewBox="0 0 200 200" aria-hidden="true">
  <circle cx="100" cy="100" r="92" pathLength="1"/>
  <circle cx="100" cy="100" r="70" pathLength="1"/>
  <path d="M100 30 L160.6 135 L39.4 135 Z" pathLength="1"/>
  <path d="M100 170 L39.4 65 L160.6 65 Z" pathLength="1"/>
  <path d="M100 2 V18 M100 182 V198 M2 100 H18 M182 100 H198 M30.7 30.7 L42 42 M158 158 L169.3 169.3 M30.7 169.3 L42 158 M158 42 L169.3 30.7" pathLength="1"/>
</svg>`;

let summonTimer = null;              // the pending fade out, if one is playing

// ---- On or off ----
// The checkbox is remembered in the browser like the filters. If storage is
// blocked it is simply on each visit.
function summoningOn() {
  return $("summonMode").checked;
}

function saveSummoning() {
  try {
    localStorage.setItem(SUMMON_KEY, summoningOn() ? "on" : "off");
  } catch {}
}

function loadSummoning() {
  try {
    if (localStorage.getItem(SUMMON_KEY) === "off") $("summonMode").checked = false;
  } catch {}
}

// ---- The ceremony ----
// Build the overlay for a character and play it. Called by rollAll() in
// script.js after a successful roll.
function summon(character) {
  if (!character || !summoningOn()) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  endSummoning(true);                // a summoning already playing ends at once

  const overlay = document.createElement("div");
  overlay.className = "summoning";
  // The colours go in as CSS variables; the animations in style.css use them.
  overlay.style.setProperty("--sigil", CARD_COLORS[character.race.faction]);
  overlay.style.setProperty("--flash", CARD_COLORS[character.class] || CARD_COLORS.fg);
  // Screen readers already hear the result through the aria-live list, so
  // everything but the close button is hidden from them; it is decoration.
  overlay.innerHTML = `
    <button class="summon-close" type="button" aria-label="Close the summoning">
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3 L13 13 M13 3 L3 13"/></svg>
    </button>
    <div class="summon-body" aria-hidden="true">
    <div class="summon-circle">${SIGIL_SVG}<span class="summon-icon"></span></div>
    <p class="summon-who"></p>
    <p class="summon-class"></p>
    <p class="summon-spec"></p>
    <p class="summon-say"></p>
    <p class="summon-by">Joelinton</p>
    </div>`;
  // Text goes in with textContent so nothing in it is read as HTML.
  overlay.querySelector(".summon-icon").textContent = CLASS_ICONS[character.class] || "";
  overlay.querySelector(".summon-who").textContent =
    `${character.gender} ${character.race.name} · ${character.race.faction}`;
  overlay.querySelector(".summon-class").textContent = character.class;
  overlay.querySelector(".summon-spec").textContent = character.spec;
  const say = reaction(character);
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

// A key pressed during the ceremony ends it. preventDefault stops that same
// key from also pressing the button that has focus (a second "Roll all").
function skipSummoning(event) {
  event.preventDefault();
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
