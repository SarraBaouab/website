// The room's panels and on-screen helpers: the station card, the main screen with its windows, the Neuro
// Workbench preview, the keyboard bar, toasts, tooltips and greeting bubbles. All copy comes from content.mjs.
// A panel that takes focus gives it back to whatever had it when the panel opened.
import { CARDS, WINS, ICONS, SLIDES, TEXT, GO_LABEL } from "./content.mjs";
import { clockText } from "./textures.mjs";

const $ = (id) => document.getElementById(id);

export function createUI({ sound: S, onGo, reduceMotion = false, coarse = false }) {
  const hud = document.querySelector(".hud");
  const live = (el) => el && el.isConnected && el !== document.body;
  const giveBack = (el) => { if (live(el)) el.focus({ preventScroll: true }); };

  /* ---------------------------------------------------------------- keyboard bar, toast, tooltip, bubbles */
  function buildNav(stations, onPick) {
    const nav = $("kbd-nav"); nav.textContent = "";
    stations.forEach((s) => {
      const b = document.createElement("button"); b.className = "btn small"; b.type = "button"; b.dataset.go = s.id; b.textContent = s.nav;
      b.addEventListener("click", () => onPick(s.id)); nav.appendChild(b);
    });
  }
  let toastTimer = 0;
  function toast(text) { const t = $("toast"); t.textContent = text; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 3000); }
  function tip(text, x, y) { const t = $("tip"); t.textContent = text; t.hidden = false; t.style.left = x + 16 + "px"; t.style.top = y + 14 + "px"; }
  function hideTip() { $("tip").hidden = true; }
  function bubble(text, lang, x, y) {
    const b = document.createElement("span"); b.className = "bubble"; b.textContent = text; b.lang = lang;
    b.style.left = x + "px"; b.style.top = y + "px"; $("bubbles").appendChild(b); setTimeout(() => b.remove(), 2700);
  }

  /* ---------------------------------------------------------------- the station card */
  let cardOpener = null;
  $("card-back").addEventListener("click", () => { S.click(); onGo("home"); });
  function showCard(id) {
    const c = CARDS[id]; if (!c) return;
    cardOpener = document.activeElement;
    $("card-body").innerHTML = c.html; $("card-actions").innerHTML = c.actions || ""; $("card").hidden = false; $("card-body").scrollTop = 0;
    [...$("card-body").children].forEach((el, i) => el.style.setProperty("--i", i));
    ($("card-actions").querySelector("button") || $("card-back")).focus({ preventScroll: true });
  }
  function hideCard() {
    const card = $("card"), had = card.contains(document.activeElement);
    card.hidden = true;
    if (had) giveBack(cardOpener);
    cardOpener = null;
  }

  /* ---------------------------------------------------------------- the main screen */
  const os = $("os"), osWins = $("os-wins"), desk = $("os-desk");
  Object.entries(WINS).forEach(([id, w]) => {
    const b = document.createElement("button"); b.className = "ico"; b.type = "button"; b.innerHTML = ICONS[w.icon] + `<span>${w.name}</span>`;
    b.addEventListener("click", () => openWin(id)); desk.appendChild(b);
  });
  let zTop = 10, winCount = 0, osOpener = null, osClock = 0, bootTimers = [];
  function openWin(id) {
    let w = osWins.querySelector(`[data-id="${id}"]`);
    S.click();
    if (w) { w.style.zIndex = ++zTop; return; }
    const d = WINS[id];
    w = document.createElement("section"); w.className = "win"; w.dataset.id = id; w.setAttribute("aria-label", d.name);
    w.innerHTML = `<header class="win-bar"><span>${d.name}</span><button class="win-x" type="button" aria-label="${TEXT.win_close.replace("{name}", d.name)}">&times;</button></header><div class="win-body">${d.html}</div>`;
    const n = winCount++ % 6; w.style.left = Math.min(260 + n * 36, innerWidth - 320) + "px"; w.style.top = (84 + n * 30) + "px"; w.style.zIndex = ++zTop;
    osWins.appendChild(w);
    w.querySelector(".win-x").addEventListener("click", () => { w.remove(); S.tone(660, 0.08, "sine", 0.04); });
    w.addEventListener("pointerdown", () => { w.style.zIndex = ++zTop; });
    dragWin(w, w.querySelector(".win-bar"));
  }
  function dragWin(win, handle) {
    let on = false, sx = 0, sy = 0, ox = 0, oy = 0;
    handle.addEventListener("pointerdown", (e) => {
      if (e.target.closest("button") || innerWidth <= 760) return;
      on = true; sx = e.clientX; sy = e.clientY; ox = win.offsetLeft; oy = win.offsetTop; handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener("pointermove", (e) => {
      if (!on) return;
      win.style.left = Math.max(-200, Math.min(innerWidth - 120, ox + e.clientX - sx)) + "px";
      win.style.top = Math.max(56, Math.min(innerHeight - 50, oy + e.clientY - sy)) + "px";
    });
    handle.addEventListener("pointerup", () => { on = false; });
  }
  const tickClock = () => { $("os-clock").textContent = TEXT.os_clock.replace("{time}", clockText()); };
  function openOS() {
    osOpener = document.activeElement;
    tickClock(); clearInterval(osClock); osClock = setInterval(tickClock, 15000);
    const boot = $("os-boot"); boot.hidden = false; boot.textContent = "";
    os.hidden = false; hud.hidden = true; hideCard();
    const step = reduceMotion ? 0 : 160;
    bootTimers.forEach(clearTimeout);
    bootTimers = TEXT.boot.map((l, i) => setTimeout(() => { boot.textContent += l + "\n"; S.tone(1760, 0.03, "sine", 0.02); }, i * step));
    bootTimers.push(setTimeout(() => { boot.hidden = true; S.boot(); if (!osWins.children.length) openWin("about"); desk.querySelector(".ico").focus(); }, TEXT.boot.length * step + 250));
  }
  function closeOS() {
    if (os.hidden) return;
    bootTimers.forEach(clearTimeout); bootTimers = []; clearInterval(osClock);
    os.hidden = true; hud.hidden = false; S.off();
    giveBack(osOpener); osOpener = null;
    onGo("home");
  }
  $("os-off").addEventListener("click", closeOS);

  /* ---------------------------------------------------------------- the Neuro Workbench preview */
  let slide = 0, pvOpener = null;
  SLIDES.forEach(() => $("pv-dots").appendChild(document.createElement("span")));
  function showSlide(i) {
    slide = (i + SLIDES.length) % SLIDES.length; const s = SLIDES[slide];
    $("pv-img").src = s.img; $("pv-img").alt = s.alt; $("pv-h").textContent = s.h; $("pv-text").textContent = s.t; $("pv-count").textContent = TEXT.slide_count.replace("{n}", slide + 1).replace("{total}", SLIDES.length);
    [...$("pv-dots").children].forEach((d, k) => d.classList.toggle("on", k === slide));
  }
  function openPreview(fromEl) { pvOpener = fromEl || document.activeElement; showSlide(0); $("pv").hidden = false; hud.hidden = true; S.open(); $("pv-next").focus(); }
  function closePreview() { $("pv").hidden = true; if (os.hidden) hud.hidden = false; S.off(); giveBack(pvOpener); pvOpener = null; }
  $("pv-close").addEventListener("click", closePreview);
  $("pv-prev").addEventListener("click", () => { S.click(); showSlide(slide - 1); });
  $("pv-next").addEventListener("click", () => { S.click(); showSlide(slide + 1); });

  /* ---------------------------------------------------------------- the chat with Oura (prepared answers) */
  let chatH = { onAsk: () => {}, onGo: () => {} }, chatOpener = null;
  $("chat-note").textContent = TEXT.chat_note; $("chat-in").placeholder = TEXT.chat_placeholder;
  TEXT.chips.forEach((q) => { const b = document.createElement("button"); b.type = "button"; b.className = "chip-q"; b.textContent = q; b.addEventListener("click", () => chatH.onAsk(q)); $("chips").appendChild(b); });
  $("chat-form").addEventListener("submit", (e) => { e.preventDefault(); const v = $("chat-in").value; $("chat-in").value = ""; chatH.onAsk(v); });
  function openChat(handlers) {
    chatH = handlers; chatOpener = document.activeElement;
    $("chat").hidden = false; $("chips").hidden = false;
    if (!coarse) setTimeout(() => $("chat-in").focus({ preventScroll: true }), 60);
  }
  function closeChat() {
    const chat = $("chat"), had = chat.contains(document.activeElement);
    chat.hidden = true;
    if (had) giveBack(chatOpener);
    chatOpener = null;
  }
  function addMessage(who, text) {
    const d = document.createElement("div"); d.className = "msg " + who; const p = document.createElement("p"); p.textContent = text; d.appendChild(p);
    $("chat-log").appendChild(d); $("chat-log").scrollTop = 1e6; return p;
  }
  async function typeOut(p, text, onBeat) {
    if (reduceMotion) { p.textContent = text; return; }
    for (let i = 3; i < text.length + 3; i += 3) { p.textContent = text.slice(0, i); if (i % 18 === 0 && onBeat) onBeat(); $("chat-log").scrollTop = 1e6; await new Promise((r) => setTimeout(r, 16)); }
  }
  function addGo(p, go) {
    if (!GO_LABEL[go]) return;
    const b = document.createElement("button"); b.type = "button"; b.className = "btn small"; b.textContent = GO_LABEL[go];
    b.addEventListener("click", () => chatH.onGo(go)); p.parentElement.appendChild(b); $("chat-log").scrollTop = 1e6;
  }
  // keep the chat above the on-screen keyboard
  if (window.visualViewport) {
    const vv = window.visualViewport, fit = () => { const kb = Math.max(0, innerHeight - vv.height - vv.offsetTop); $("chat").style.marginBottom = kb ? kb + "px" : ""; };
    vv.addEventListener("resize", fit); vv.addEventListener("scroll", fit);
  }

  return {
    buildNav, toast, tip, hideTip, bubble, showCard, hideCard, openOS, closeOS, openPreview, closePreview,
    openChat, closeChat, addMessage, typeOut, addGo,
    chatEmpty: () => !$("chat-log").children.length,
    nextSlide: (d) => showSlide(slide + d),
    previewOpen: () => !$("pv").hidden,
    osOpen: () => !os.hidden,
  };
}
