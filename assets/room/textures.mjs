// Every canvas-drawn surface in the room: screens, the window over Frankfurt, floor, tiles and leaves.
// Each maker returns { tex, canvas, g } plus a draw function where the picture changes.
import * as THREE from "three";
import { canvasTex, mirrorX, rr } from "./kit.mjs";
import { LOG_ROWS } from "./content.mjs";

export function clockText() {
  try { return new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Berlin" }); }
  catch { return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }); }
}

function screenBg(g, w, h) {
  const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, "#11293c"); bg.addColorStop(1, "#0a1a27"); g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.strokeStyle = "rgba(127,227,255,.07)"; g.lineWidth = 1;
  for (let x = 0; x < w; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
  for (let y = 0; y < h; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
}

export function makeMainScreen() {
  const t = canvasTex(2048, 640); mirrorX(t.tex);
  t.draw = () => {
    const g = t.g;
    screenBg(g, 2048, 640);
    g.fillStyle = "#7fe3ff"; g.font = "28px Michroma, sans-serif"; g.fillText("Main screen", 120, 118);
    g.fillStyle = "#ffffff"; g.font = "88px Michroma, sans-serif"; g.fillText("Sarra Baouab", 112, 238);
    g.fillStyle = "#cfeaf6"; g.font = "400 40px Sora, sans-serif"; g.fillText("Psychology researcher building new research tools.", 120, 318);
    g.fillStyle = "#86aabd"; g.font = "400 32px Sora, sans-serif"; g.fillText("Frankfurt am Main, " + clockText(), 120, 378);
    let x = 120;
    ["About", "Research", "Experience", "Skills", "CV", "Contact"].forEach((s) => {
      g.font = "600 28px Sora, sans-serif"; const w = g.measureText(s).width + 46;
      rr(g, x, 432, w, 58, 29); g.strokeStyle = "rgba(127,227,255,.65)"; g.lineWidth = 2; g.stroke(); g.fillStyle = "#d9f3ff"; g.fillText(s, x + 23, 470); x += w + 16;
    });
    g.fillStyle = "#7fe3ff"; g.font = "400 27px Sora, sans-serif"; g.fillText("Tap the screen to open my files", 120, 560);
    const mods = [["Forensic and legal", "psychology"], ["Neuropsychology", ""], ["Neurotechnology", ""], ["AI tools for", "psychology"]];
    mods.forEach((m, i) => {
      const cx = 1350 + (i % 2) * 320, cy = 96 + Math.floor(i / 2) * 236;
      rr(g, cx, cy, 296, 210, 20); g.fillStyle = "rgba(127,227,255,.07)"; g.fill(); g.strokeStyle = "rgba(127,227,255,.38)"; g.lineWidth = 2; g.stroke();
      g.strokeStyle = "#7fe3ff"; g.lineWidth = 4; g.lineCap = "round"; g.lineJoin = "round"; const ix = cx + 34, iy = cy + 34;
      g.beginPath();
      if (i === 0) { rr(g, ix, iy, 64, 40, 10); g.moveTo(ix + 14, iy + 40); g.lineTo(ix + 10, iy + 54); g.lineTo(ix + 28, iy + 40); g.moveTo(ix + 84, iy + 24); g.lineTo(ix + 104, iy + 24); g.lineTo(ix + 104, iy + 60); g.lineTo(ix + 96, iy + 60); g.lineTo(ix + 98, iy + 72); g.lineTo(ix + 84, iy + 60); g.lineTo(ix + 70, iy + 60); }
      if (i === 1) { g.ellipse(ix + 50, iy + 36, 48, 34, 0, 0, Math.PI * 2); g.moveTo(ix + 50, iy + 2); g.bezierCurveTo(ix + 38, iy + 22, ix + 62, iy + 46, ix + 50, iy + 70); g.moveTo(ix + 16, iy + 30); g.quadraticCurveTo(ix + 30, iy + 18, ix + 36, iy + 36); g.moveTo(ix + 84, iy + 30); g.quadraticCurveTo(ix + 70, iy + 18, ix + 64, iy + 36); }
      if (i === 2) { g.moveTo(ix, iy + 40); g.lineTo(ix + 28, iy + 40); g.lineTo(ix + 38, iy + 6); g.lineTo(ix + 50, iy + 70); g.lineTo(ix + 60, iy + 28); g.lineTo(ix + 70, iy + 40); g.lineTo(ix + 104, iy + 40); }
      const dots = [[ix + 10, iy + 12], [ix + 10, iy + 62], [ix + 52, iy + 36], [ix + 96, iy + 12], [ix + 96, iy + 62]];
      if (i === 3) dots.forEach(([a, b], k) => { if (k !== 2) { g.moveTo(a, b); g.lineTo(dots[2][0], dots[2][1]); } });
      g.stroke();
      if (i === 3) { g.fillStyle = "#7fe3ff"; dots.forEach(([a, b]) => { g.beginPath(); g.arc(a, b, 8, 0, Math.PI * 2); g.fill(); }); }
      g.fillStyle = "#e6f7ff"; g.font = "600 26px Sora, sans-serif"; g.fillText(m[0], cx + 30, cy + 150); if (m[1]) g.fillText(m[1], cx + 30, cy + 184);
    });
    t.tex.needsUpdate = true;
  };
  return t;
}

export function makeLog() {
  const t = canvasTex(1280, 400); mirrorX(t.tex);
  t.draw = () => {
    const g = t.g; screenBg(g, 1280, 400);
    g.fillStyle = "#7fe3ff"; g.font = "30px Michroma, sans-serif"; g.fillText("Mission log", 60, 76);
    g.strokeStyle = "rgba(127,227,255,.55)"; g.lineWidth = 4; g.beginPath(); g.moveTo(90, 200); g.lineTo(1200, 200); g.stroke();
    LOG_ROWS.forEach(([when, what], i) => {
      const x = 120 + i * 205;
      g.fillStyle = i === LOG_ROWS.length - 1 ? "#ffffff" : "#7fe3ff"; g.beginPath(); g.arc(x, 200, 13, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#7fe3ff"; g.font = "600 24px Sora, sans-serif"; g.fillText(when, x - 22, 158);
      g.fillStyle = "#e6f7ff"; g.font = "400 25px Sora, sans-serif"; what.forEach((l, k) => g.fillText(l, x - 22, 258 + k * 34));
    });
    t.tex.needsUpdate = true;
  };
  return t;
}

// The view over Frankfurt. t.sky holds the time-of-day state (colours as THREE.Color); t.star is the shooting star.
const SKYLINE = (() => {
  let q = 3; const r = () => (q = (q * 16807) % 2147483647) / 2147483647;
  const stars = Array.from({ length: 170 }, () => [r() * 1024, r() * 360, r() < 0.15 ? 3 : 2, 0.3 + r() * 0.7]);
  const towers = [];
  for (let i = 0; i < 26; i++) towers.push([i * 40 - 10 + r() * 10, 34 + r() * 30, 70 + r() * 120]);
  towers.push([140, 50, 330], [400, 62, 420], [540, 54, 372], [650, 44, 300]);
  const wins = towers.map(([x, w, h]) => { const o = []; for (let yy = 632 - h + 14; yy < 622; yy += 18) for (let xx = x + 7; xx < x + w - 7; xx += 14) o.push([xx, yy, r(), r() < 0.7]); return o; });
  return { stars, towers, wins };
})();
export function makeWindow() {
  const t = canvasTex(1024, 632); mirrorX(t.tex);
  t.sky = { top: new THREE.Color("#081430"), bot: new THREE.Color("#2f6a82"), lights: 1, stars: 1, sunY: -1, sunC: new THREE.Color("#ffffff"), day: 0 };
  t.star = { on: false, t: 0 };
  t.draw = () => {
    const g = t.g, SKY = t.sky, hex = (c) => "#" + c.getHexString();
    const sky = g.createLinearGradient(0, 0, 0, 632); sky.addColorStop(0, hex(SKY.top)); sky.addColorStop(1, hex(SKY.bot)); g.fillStyle = sky; g.fillRect(0, 0, 1024, 632);
    if (SKY.stars > 0.02) SKYLINE.stars.forEach(([x, y, z, a]) => { g.fillStyle = `rgba(255,255,255,${(a * SKY.stars).toFixed(3)})`; g.fillRect(x, y, z, z); });
    if (SKY.sunY > -0.1) {   // the sun
      const sy = 520 - SKY.sunY * 420, glow = g.createRadialGradient(300, sy, 0, 300, sy, 170);
      glow.addColorStop(0, "#ffffff"); glow.addColorStop(0.12, hex(SKY.sunC)); glow.addColorStop(0.3, "rgba(255,236,200,.35)"); glow.addColorStop(1, "rgba(255,236,200,0)");
      g.fillStyle = glow; g.fillRect(130, sy - 170, 340, 340);
    } else if (SKY.stars > 0.5) {   // a crescent moon
      g.fillStyle = "#fff4d6"; g.beginPath(); g.arc(760, 90, 26, 0, Math.PI * 2); g.fill();
      g.fillStyle = hex(SKY.top); g.beginPath(); g.arc(749, 83, 23, 0, Math.PI * 2); g.fill();
    }
    const bc = hex(new THREE.Color("#0a1626").lerp(new THREE.Color("#7f95aa"), SKY.day));
    SKYLINE.towers.forEach(([x, w, h], i) => {
      g.fillStyle = bc; g.fillRect(x, 632 - h, w, h);
      g.globalAlpha = 0.3 + 0.7 * SKY.lights;
      SKYLINE.wins[i].forEach(([xx, yy, k, cool]) => { if (k < 0.36 * SKY.lights + 0.03) { g.fillStyle = cool ? "#bfefff" : "#ffd88f"; g.fillRect(xx, yy, 6, 9); } });
      g.globalAlpha = 1;
    });
    g.fillStyle = bc;
    g.beginPath(); g.moveTo(140, 302); g.lineTo(165, 250); g.lineTo(190, 302); g.fill(); g.fillRect(429, 140, 4, 72);   // Messeturm, Commerzbank Tower
    g.beginPath(); g.arc(567, 260, 27, Math.PI, 0); g.fill(); g.fillRect(565, 160, 4, 76);                               // Main Tower
    g.fillRect(866, 170, 14, 462); g.beginPath(); g.ellipse(873, 236, 40, 13, 0, 0, Math.PI * 2); g.fill(); g.fillRect(871, 100, 4, 72); // Europaturm
    g.fillStyle = "#ff6b6b"; [[431, 138], [567, 158], [873, 98]].forEach(([x, y]) => g.fillRect(x - 2, y, 5, 5));
    if (t.star.on) {
      const x = 120 + t.star.t * 700, y = 50 + t.star.t * 200, grad = g.createLinearGradient(x - 200, y - 57, x, y);
      grad.addColorStop(0, "rgba(255,255,255,0)"); grad.addColorStop(1, "rgba(255,255,255,1)");
      g.strokeStyle = grad; g.lineWidth = 4; g.beginPath(); g.moveTo(x - 200, y - 57); g.lineTo(x, y); g.stroke();
    }
    t.tex.needsUpdate = true;
  };
  return t;
}

// The interview console: station name and a data-free case-file icon (no voices, no language tags).
export function makeConsole() {
  const t = canvasTex(768, 384);
  t.draw = (time, live) => {
    const g = t.g; screenBg(g, 768, 384);
    g.fillStyle = "#7fe3ff"; g.font = "24px Michroma, sans-serif"; g.fillText("Forensic psychology", 36, 58);
    g.strokeStyle = "#7fe3ff"; g.lineWidth = 5; g.lineJoin = "round";
    g.beginPath(); g.moveTo(60, 110); g.lineTo(165, 110); g.lineTo(190, 136); g.lineTo(330, 136); g.lineTo(330, 320); g.lineTo(60, 320); g.closePath(); g.stroke();
    g.fillStyle = "rgba(217,243,255,.22)"; [[380, 150, 300], [380, 192, 250], [380, 234, 280], [380, 276, 180]].forEach(([x, y, w]) => { rr(g, x, y, w, 14, 7); g.fill(); });
    if (live) { g.fillStyle = "rgba(127,227,255,.4)"; g.fillRect(60, 140 + ((time * 120) % 175), 270, 3); }
    t.tex.needsUpdate = true;
  };
  return t;
}

// The training bay: a session timer only (no microphone, voice or scores).
export function makeTraining() {
  const t = canvasTex(768, 384);
  t.left = 300;
  t.draw = () => {
    const g = t.g; screenBg(g, 768, 384);
    g.fillStyle = "#7fe3ff"; g.font = "24px Michroma, sans-serif"; g.fillText("Training session", 36, 58);
    const m = Math.floor(t.left / 60), sec = Math.floor(t.left % 60);
    g.fillStyle = "#ffffff"; g.font = "96px Michroma, sans-serif"; g.fillText(`0${m}:${sec < 10 ? "0" : ""}${sec}`, 36, 220);
    g.fillStyle = "#86aabd"; g.font = "400 22px Sora, sans-serif"; g.fillText("Session timer", 40, 270);
    g.fillStyle = "rgba(127,227,255,.25)"; rr(g, 36, 310, 696, 12, 6); g.fill();
    g.fillStyle = "#7fe3ff"; rr(g, 36, 310, 696 * (t.left / 300), 12, 6); g.fill();
    t.tex.needsUpdate = true;
  };
  return t;
}

export const makeCvScreen = () => canvasTex(256, 128, (g) => {
  screenBg(g, 256, 128); g.fillStyle = "#ffffff"; g.font = "30px Michroma, sans-serif"; g.fillText("CV", 22, 58);
  g.fillStyle = "#7fe3ff"; g.font = "600 19px Sora, sans-serif"; g.fillText("Tap to print", 22, 100);
});
export const makePaper = () => canvasTex(256, 340, (g) => {
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, 256, 340); g.fillStyle = "#0f1f2b"; g.font = "700 22px Sora, sans-serif"; g.fillText("Sarra Baouab", 22, 44);
  g.fillStyle = "#066c92"; g.font = "600 13px Sora, sans-serif"; g.fillText("Psychology researcher", 22, 66);
  g.fillStyle = "#c9d4dc"; for (let i = 0; i < 12; i++) { g.fillRect(22, 92 + i * 19, i % 4 === 0 ? 90 : 160 + ((i * 37) % 50), 7); }
});
export const makeTableTop = () => canvasTex(512, 512, (g) => {
  g.fillStyle = "#0d2230"; g.beginPath(); g.arc(256, 256, 256, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "rgba(127,227,255,.55)"; g.lineWidth = 3; [90, 150, 230].forEach((r) => { g.beginPath(); g.arc(256, 256, r, 0, Math.PI * 2); g.stroke(); });
  for (let i = 0; i < 72; i++) { const a = (i / 72) * Math.PI * 2, r1 = i % 6 ? 214 : 200; g.beginPath(); g.moveTo(256 + Math.cos(a) * r1, 256 + Math.sin(a) * r1); g.lineTo(256 + Math.cos(a) * 228, 256 + Math.sin(a) * 228); g.stroke(); }
  g.lineWidth = 8; g.strokeStyle = "rgba(127,227,255,.8)"; [[0.2, 1.3], [2.4, 3.1], [4.0, 5.4]].forEach(([a, b]) => { g.beginPath(); g.arc(256, 256, 180, a, b); g.stroke(); });
});
export const makeFloor = () => canvasTex(1024, 1024, (g) => {
  g.fillStyle = "#eef3f6"; g.fillRect(0, 0, 1024, 1024);
  g.strokeStyle = "rgba(20,60,80,.07)"; g.lineWidth = 1.5;
  const s = 20, hgt = Math.sqrt(3) * s;
  for (let col = 0; col < 36; col++) for (let row = 0; row < 32; row++) {
    const cx = col * s * 1.5, cy = row * hgt + (col % 2 ? hgt / 2 : 0);
    g.beginPath(); for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; g[k ? "lineTo" : "moveTo"](cx + Math.cos(a) * s, cy + Math.sin(a) * s); } g.closePath(); g.stroke();
  }
  g.strokeStyle = "rgba(20,60,80,.13)"; g.lineWidth = 3; [360, 420].forEach((r) => { g.beginPath(); g.arc(512, 512, r, 0, Math.PI * 2); g.stroke(); });
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; g.beginPath(); g.moveTo(512 + Math.cos(a) * 420, 512 + Math.sin(a) * 420); g.lineTo(512 + Math.cos(a) * 512, 512 + Math.sin(a) * 512); g.stroke(); }
});
export function makeBackground() {
  const t = canvasTex(64, 512);
  t.draw = (a, b) => { const g = t.g, gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#" + a.getHexString()); gr.addColorStop(1, "#" + b.getHexString()); g.fillStyle = gr; g.fillRect(0, 0, 64, 512); t.tex.needsUpdate = true; };
  return t;
}
// Tunisian tiles for the jasmine planter: cobalt borders, blue eight-point stars, yellow hearts, green corners.
export const makeTiles = () => canvasTex(512, 160, (g) => {
  g.fillStyle = "#f7f3ea"; g.fillRect(0, 0, 512, 160);
  g.fillStyle = "#1f4e9c"; g.fillRect(0, 0, 512, 16); g.fillRect(0, 144, 512, 16);
  g.fillStyle = "#f7f3ea"; for (let x = 8; x < 512; x += 16) { g.beginPath(); g.arc(x, 8, 3, 0, Math.PI * 2); g.arc(x, 152, 3, 0, Math.PI * 2); g.fill(); }
  for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) {
    const cx = 32 + i * 64, cy = 48 + j * 64;
    g.fillStyle = "#3c8d5a"; [[-32, -32], [32, -32], [-32, 32], [32, 32]].forEach(([dx, dy]) => { g.beginPath(); g.arc(cx + dx, cy + dy, 13, 0, Math.PI * 2); g.fill(); });
    g.fillStyle = "#1f4e9c"; [0, Math.PI / 4].forEach((rot) => { g.save(); g.translate(cx, cy); g.rotate(rot); g.fillRect(-16, -16, 32, 32); g.restore(); });
    g.fillStyle = "#f2c14e"; g.beginPath(); g.arc(cx, cy, 8, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#f7f3ea"; g.beginPath(); g.arc(cx, cy, 3, 0, Math.PI * 2); g.fill();
  }
});
export const makeFrond = () => canvasTex(256, 64, (g) => {
  g.strokeStyle = "#2f7d3e"; g.lineWidth = 3; g.beginPath(); g.moveTo(4, 32); g.lineTo(252, 32); g.stroke(); g.fillStyle = "#3fa553";
  for (let x = 12; x < 248; x += 8) { const l = 27 * Math.sin((x / 256) * Math.PI) + 3; [1, -1].forEach((d) => { g.beginPath(); g.ellipse(x + 6, 32 - d * l / 2, 2.6, l / 2, d * 0.5, 0, Math.PI * 2); g.fill(); }); }
});
export const makePuff = () => canvasTex(64, 64, (g) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, "rgba(255,255,255,.9)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
