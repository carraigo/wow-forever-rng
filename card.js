// =============================================================================
// Forever Random Character: the downloadable character card
// =============================================================================
// "Save card" turns the character on screen into a 1200 x 630 PNG image,
// the size Discord and X use for link previews.
//
// index.html loads this file after script.js, so it can use what script.js
// defines (current, oracle, $ ...) as well as the data in data.js.
//
// The card is drawn on a canvas: a page element you paint on with code, one
// shape or line of text at a time, which can then be saved as an image. It
// never appears on the page; it only exists long enough to be saved.

// ---- Settings ----
const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;
const CARD_PAD = 80;                 // space between the edge and the text
const CARD_TEXT_WIDTH = 760;         // the text column; the icon sits to its right
const CARD_FONT = 'system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif';

// The card is always dark, whatever the page theme, so these are the dark
// colours from style.css written out. (A canvas can't read var(--...) itself.)
const CARD_COLORS = {
  bg: "#111", fg: "#eee", muted: "#8a8a8a", line: "#333", story: "#cfcfcf", gold: "#f0b93a",
  Alliance: "#5b9bf0", Horde: "#e5534b",
  Druid: "#ff7c0a", Hunter: "#aad372", Mage: "#3fc7eb", Paladin: "#f48cba",
  Priest: "#ffffff", Rogue: "#fff468", Shaman: "#3a93f2", Warlock: "#8788ee", Warrior: "#c69b6d",
};

// ---- Helpers ----
// A canvas font is written like CSS: "italic 600 28px" followed by the font names.
const cardFont = (size, weight = 400, style = "normal") => `${style} ${weight} ${size}px ${CARD_FONT}`;

// The biggest font size, up to "size", at which the text fits in maxWidth.
// measureText() tells us how wide the text would be in the current font.
function fitFont(ctx, text, size, maxWidth, weight) {
  ctx.font = cardFont(size, weight);
  while (size > 20 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = cardFont(size, weight);
  }
  return size;
}

// Split text into lines no wider than maxWidth, breaking between words.
// Uses whatever font is currently set on ctx.
function wrapLines(ctx, text, maxWidth) {
  const lines = [];
  let line = "";
  for (const word of text.split(" ")) {
    const attempt = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(attempt).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = attempt;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// A rectangle with rounded corners. Newer browsers have ctx.roundRect, but
// drawing the four arcs by hand works everywhere.
function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

// ---- Drawing ----
// Paint the whole card for a character and return the canvas.
function drawCard(character) {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d");    // "2d" is the drawing toolkit
  const faction = character.race.faction;
  const classColor = CARD_COLORS[character.class] || CARD_COLORS.fg;
  const factionColor = CARD_COLORS[faction];

  // Background: dark, with a soft glow of the class colour in the top right.
  ctx.fillStyle = CARD_COLORS.bg;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  const glow = ctx.createRadialGradient(1000, 120, 0, 1000, 120, 700);
  glow.addColorStop(0, classColor + "40");   // "40" on a colour = about 25% opaque
  glow.addColorStop(1, classColor + "00");   // "00" = fully transparent
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // Border and a thick stripe down the left, in the class colour.
  ctx.strokeStyle = classColor;
  ctx.lineWidth = 4;
  roundedRect(ctx, 16, 16, CARD_WIDTH - 32, CARD_HEIGHT - 32, 20);
  ctx.stroke();
  ctx.fillStyle = classColor;
  ctx.fillRect(16, 36, 12, CARD_HEIGHT - 72);

  // Everything below is drawn from its left edge and its text baseline.
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  // Faction badge, then the gender beside it.
  const badge = faction.toUpperCase();
  ctx.font = cardFont(20, 700);
  const badgeWidth = ctx.measureText(badge).width + 40;
  ctx.fillStyle = factionColor;
  roundedRect(ctx, CARD_PAD, 70, badgeWidth, 36, 18);
  ctx.fill();
  ctx.fillStyle = CARD_COLORS.bg;
  ctx.fillText(badge, CARD_PAD + 20, 95);
  ctx.font = cardFont(22);
  ctx.fillStyle = CARD_COLORS.muted;
  ctx.fillText(character.gender, CARD_PAD + badgeWidth + 20, 96);

  // "Troll Shaman", shrunk if it is too wide for the text column.
  const title = `${character.race.name} ${character.class}`;
  fitFont(ctx, title, 84, CARD_TEXT_WIDTH, 800);
  ctx.fillStyle = CARD_COLORS.fg;
  ctx.fillText(title, CARD_PAD, 200);

  // Spec, in the class colour.
  ctx.font = cardFont(36, 600);
  ctx.fillStyle = classColor;
  ctx.fillText(character.spec, CARD_PAD, 256);

  // Divider.
  ctx.fillStyle = CARD_COLORS.line;
  ctx.fillRect(CARD_PAD, 298, CARD_TEXT_WIDTH, 2);

  // Backstory, wrapped. If it needs more than three lines, the font gets
  // smaller until it fits in three.
  let storySize = 30;
  let lines;
  do {
    storySize -= 2;
    ctx.font = cardFont(storySize, 400, "italic");
    lines = wrapLines(ctx, character.backstory, CARD_TEXT_WIDTH);
  } while (lines.length > 3 && storySize > 18);
  const lineHeight = storySize * 1.5;
  ctx.fillStyle = CARD_COLORS.story;
  lines.forEach((line, i) => ctx.fillText(line, CARD_PAD, 352 + i * lineHeight));

  // Joelinton's purse, when the mode is on.
  if (oracle.on) {
    ctx.font = cardFont(22);
    ctx.fillStyle = CARD_COLORS.gold;
    ctx.fillText(`◆ Consulted Joelinton · ${oracle.purse} gold left`, CARD_PAD, 490);
  }

  // Class symbol in a ring on the right.
  const iconX = 1000, iconY = 200;
  ctx.beginPath();
  ctx.arc(iconX, iconY, 110, 0, Math.PI * 2);
  ctx.fillStyle = "#0b0b0b";
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = classColor;
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = cardFont(100);
  ctx.fillText(CLASS_ICONS[character.class] || "🎲", iconX, iconY + 6);

  // Footer: the site's name on the left; the address and date on the right.
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.font = cardFont(24, 700);
  ctx.fillStyle = CARD_COLORS.fg;
  ctx.fillText("🎲 Forever Random Character", CARD_PAD, 570);
  // Opened straight from a file there is no web address to show, so only
  // the date goes in.
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const where = location.protocol.startsWith("http") ? `${location.host} · ` : "";
  ctx.textAlign = "right";
  ctx.font = cardFont(22);
  ctx.fillStyle = CARD_COLORS.muted;
  ctx.fillText(`${where}Rolled ${date}`, CARD_WIDTH - CARD_PAD, 570);

  return canvas;
}

// ---- Saving ----
// "troll-shaman.png", "night-elf-druid.png": spaces become dashes.
const cardFileName = character =>
  `${character.race.name}-${character.class}`.toLowerCase().replace(/\s+/g, "-") + ".png";

// "Save card" button. On phones (a touch screen as the main pointer) this
// opens the share menu so the card can go straight into a chat app. On
// computers, or where sharing isn't available, it downloads the PNG.
function saveCard() {
  if (!current) return;
  const name = cardFileName(current);
  // toBlob turns the canvas into PNG file data. It works in the background
  // and calls the function it is given once the data is ready.
  drawCard(current).toBlob(async blob => {
    const file = new File([blob], name, { type: "image/png" });
    const isPhone = matchMedia("(pointer: coarse)").matches;
    if (isPhone && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return;
      } catch (error) {
        // Closing the share menu counts as an error ("AbortError"). That
        // was a choice, not a problem, so do nothing. Anything else falls
        // through to a normal download.
        if (error.name === "AbortError") return;
      }
    }
    // A download is a link to the file data, clicked by the code. The link
    // is never added to the page, and the data is freed afterwards.
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }, "image/png");
  countEvent("save-card");
}

$("saveCard").addEventListener("click", saveCard);
