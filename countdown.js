// =============================================================================
// Forever Random Character: the launch countdown
// =============================================================================
// A line under the title that counts down to WoW Forever's launch, and shows
// the launch time in the visitor's own time zone. Once the servers are up it
// says so for a week, then disappears on its own.
//
// index.html loads this file after script.js, so it can use $ from there.

// ---- Settings ----
// Launch: 4 November 2026 at 3 PM Pacific, which is 23:00 UTC. The "Z" at
// the end means UTC, so the moment is the same wherever the page is opened.
// If Blizzard moves the launch, change this one line.
const LAUNCH_AT = new Date("2026-11-04T23:00:00Z");
const LIVE_FOR_DAYS = 7;   // how long "is live" stays up after launch

// ---- Helpers ----
const SECOND = 1000, MINUTE = 60 * SECOND, HOUR = 60 * MINUTE, DAY = 24 * HOUR;

// 5 -> "05", so the numbers keep their width as they tick.
const twoDigits = n => String(n).padStart(2, "0");

// The launch in the visitor's own time zone, e.g. "Wed 4 Nov, 23:00".
// toLocaleString picks the language and 12 or 24 hour clock from the browser.
const launchLocal = () => LAUNCH_AT.toLocaleString(undefined, {
  weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
});

// ---- Showing it ----
function updateCountdown() {
  const box = $("countdown");
  const left = LAUNCH_AT - Date.now();   // milliseconds until launch

  // A week after launch the countdown has done its job.
  if (left < -LIVE_FOR_DAYS * DAY) {
    box.hidden = true;
    return false;
  }

  box.hidden = false;
  if (left <= 0) {
    box.classList.add("live");
    $("countdownText").textContent = "WoW Forever is live. Roll your character!";
    $("countdownWhen").textContent = "";
    return false;
  }

  const days = Math.floor(left / DAY);
  const hours = Math.floor(left % DAY / HOUR);
  const minutes = Math.floor(left % HOUR / MINUTE);
  const seconds = Math.floor(left % MINUTE / SECOND);
  $("countdownText").innerHTML =
    `WoW Forever launches in <span class="clock">${days}d ${twoDigits(hours)}h ` +
    `${twoDigits(minutes)}m ${twoDigits(seconds)}s</span>`;
  $("countdownWhen").textContent = `${launchLocal()} your time`;
  return true;
}

// Update once now, then every second until launch. setInterval keeps calling
// the function; clearInterval stops it once there is nothing left to count.
if (updateCountdown()) {
  const timer = setInterval(() => {
    if (!updateCountdown()) clearInterval(timer);
  }, SECOND);
}

// =============================================================================
// Dawn of the Final Day
// =============================================================================
// In the last 24 hours before launch, opening the page plays a short title
// card in the style of Majora's Mask: the screen goes black and "Dawn of
// The Final Day" fades in, with the hours left underneath. It only covers
// the page, so skipping it (the X, a click anywhere or any key) loses
// nothing. It plays once per browser tab, so reloading or coming back to
// the tab does not replay it, and it is left out for people who have
// "reduce motion" turned on.
//
// To see it before the final day, open the page with ?dawn on the end of
// the address, e.g. index.html?dawn

// ---- Settings ----
const DAWN_LENGTH = 4200;            // ms from the start until it fades out
const DAWN_FADE = 600;               // ms the fade out takes
const DAWN_KEY = "forever-rng-dawn"; // remembers that this tab has seen it

let dawnTimer = null;                // the pending fade out, if one is playing

// Should the title card play on this page load? Only in the final 24 hours,
// once per tab, and never with "reduce motion" on. ?dawn forces it.
function dawnDue() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (new URLSearchParams(location.search).has("dawn")) return true;
  const left = LAUNCH_AT - Date.now();
  if (left <= 0 || left > DAY) return false;
  // sessionStorage lasts as long as the tab. If it is blocked, the card
  // simply plays on every load.
  try {
    if (sessionStorage.getItem(DAWN_KEY)) return false;
    sessionStorage.setItem(DAWN_KEY, "seen");
  } catch (e) { /* storage blocked */ }
  return true;
}

// The line under the title: "-24 Hours Remain-", counted up so 23h 10m
// left still reads 24, as the game does at dawn. The last hour reads
// "-1 Hour Remains-".
function hoursRemainText() {
  const left = LAUNCH_AT - Date.now();
  const hours = left > 0 && left <= DAY ? Math.ceil(left / HOUR) : 24;
  return hours === 1 ? "-1 Hour Remains-" : `-${hours} Hours Remain-`;
}

function playDawn() {
  const overlay = document.createElement("div");
  overlay.className = "dawn";
  // The countdown under the title already gives the time left in words, so
  // the card itself is hidden from screen readers; only the X is offered.
  overlay.innerHTML = `
    <button class="summon-close dawn-close" type="button" aria-label="Skip the intro">
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3 L13 13 M13 3 L3 13"/></svg>
    </button>
    <div class="dawn-body" aria-hidden="true">
      <p class="dawn-of">Dawn of</p>
      <p class="dawn-day">The Final Day</p>
      <p class="dawn-left"></p>
    </div>`;
  overlay.querySelector(".dawn-left").textContent = hoursRemainText();
  document.body.appendChild(overlay);

  dawnTimer = setTimeout(endDawn, DAWN_LENGTH);
  window.addEventListener("keydown", skipDawn, true);
  // A click anywhere closes it, the X included.
  overlay.addEventListener("click", () => endDawn());
}

// A key pressed during the card ends it. Enter and Space would also press
// whatever button has focus, so preventDefault stops them doing that.
function skipDawn(event) {
  if (event.key === "Enter" || event.key === " ") event.preventDefault();
  endDawn();
}

// Fade the card out and remove it.
function endDawn() {
  clearTimeout(dawnTimer);
  window.removeEventListener("keydown", skipDawn, true);
  for (const overlay of document.querySelectorAll(".dawn:not(.leaving)")) {
    overlay.classList.add("leaving");
    setTimeout(() => overlay.remove(), DAWN_FADE);
  }
}

if (dawnDue()) playDawn();
