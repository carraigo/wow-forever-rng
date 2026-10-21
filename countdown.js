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
