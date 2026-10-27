// The room follows the real time of day in Frankfurt: sky, window, light and background.

// hour, sky top, sky bottom, city lights, stars, sun height, daylight, light colour, key light, ambient,
// light shafts, background top, background bottom
export const MOODS = [
  [0, "#081430", "#2f6a82", 1, 1, -1, 0, "#b9c7ff", 1.0, 0.8, 0, "#2a3546", "#111924"],
  [5.2, "#0b1838", "#34627f", 1, 0.9, -1, 0, "#b9c7ff", 1.0, 0.8, 0, "#2a3546", "#111924"],
  [6.6, "#33467a", "#f4a771", 0.6, 0.15, 0.08, 0.35, "#ffd2a6", 1.35, 0.92, 0.45, "#e9d9d0", "#9aa7bd"],
  [8.6, "#6fa7da", "#d9edf7", 0.08, 0, 0.55, 0.85, "#fff4e6", 1.8, 1.05, 0.28, "#fbfdfe", "#cfdbe3"],
  [12.5, "#4f93d4", "#d2e9f6", 0.04, 0, 0.95, 1, "#ffffff", 1.9, 1.1, 0.18, "#fbfdfe", "#cfdbe3"],
  [16.8, "#5a95cf", "#e4eef2", 0.06, 0, 0.5, 0.9, "#fff0d8", 1.8, 1.05, 0.3, "#fbfcfd", "#d3dde4"],
  [19.2, "#40518f", "#ff9b5e", 0.55, 0.05, 0.06, 0.45, "#ffb47e", 1.3, 0.95, 0.5, "#f1ddd2", "#9da5bc"],
  [20.6, "#15244d", "#4f6c9b", 0.9, 0.55, -0.4, 0.1, "#c7d3ff", 1.05, 0.85, 0.05, "#46546d", "#1c2636"],
  [22, "#081430", "#2f6a82", 1, 1, -1, 0, "#b9c7ff", 1.0, 0.8, 0, "#2a3546", "#111924"],
  [24, "#081430", "#2f6a82", 1, 1, -1, 0, "#b9c7ff", 1.0, 0.8, 0, "#2a3546", "#111924"],
];

// Tapping the window previews these, then returns to the real time.
export const PREVIEWS = [[7, "sunrise"], [12.5, "midday"], [19.2, "sunset"], [23, "night"]];

export function frankfurtHour(date = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Berlin", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(date);
    return +parts.find((p) => p.type === "hour").value + +parts.find((p) => p.type === "minute").value / 60;
  } catch {
    return date.getHours() + date.getMinutes() / 60;
  }
}

// Colours blend in linear light, as THREE.Color.lerp did in the prototype.
const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSrgb = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);
function mixHex(a, b, k) {
  let out = "#";
  for (let i = 1; i < 7; i += 2) {
    const x = toLinear(parseInt(a.slice(i, i + 2), 16) / 255), y = toLinear(parseInt(b.slice(i, i + 2), 16) / 255);
    out += Math.round(toSrgb(x + (y - x) * k) * 255).toString(16).padStart(2, "0");
  }
  return out;
}

export function moodAt(hour) {
  let i = 0;
  while (i < MOODS.length - 2 && MOODS[i + 1][0] <= hour) i++;
  const a = MOODS[i], b = MOODS[i + 1], k = Math.min(1, Math.max(0, (hour - a[0]) / (b[0] - a[0])));
  const n = (j) => a[j] + (b[j] - a[j]) * k, c = (j) => mixHex(a[j], b[j], k);
  return { top: c(1), bot: c(2), lights: n(3), stars: n(4), sunY: n(5), day: n(6), lightC: c(7), key: n(8), hemi: n(9), shaft: n(10), bgTop: c(11), bgBot: c(12) };
}
