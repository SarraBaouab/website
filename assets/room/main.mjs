// Starts the 3D room in room mode, switches between the room and the plain page, and runs the room:
// camera moves between stations, taps and keys, the time of day and the animation loop.
import * as THREE from "three";
import { TEXT, STATIONS, LANGS, HELLO } from "./content.mjs";
import { moodAt, frankfurtHour, PREVIEWS } from "./time.mjs";
import { createSound, isAppleMobile } from "./sound.mjs";
import { createEngine, buildShell } from "./shell.mjs";
import { buildStations } from "./stations.mjs";
import { createUI } from "./ui.mjs";
import { createOura } from "./oura.mjs";
import { answer } from "./chat.mjs";
import { clockText } from "./textures.mjs";
import { V3, R, WIN_TH, IVY_TH, LNG, polar } from "./kit.mjs";

const $ = (id) => document.getElementById(id);
const root = document.documentElement;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (reduceMotion) root.dataset.motion = "reduced";
const S = createSound(window);

// ---------------------------------------------------------------- modes
// boot.js handles the mode buttons and the 15-second guard; every switch arrives here as an "sb-mode" event
$("mode-btn").querySelector(".to-plain").textContent = TEXT.mode_to_plain;
$("mode-btn").querySelector(".to-room").textContent = TEXT.mode_to_room;
document.addEventListener("sb-mode", (e) => { if (e.detail === "room") startRoom(); else pause(); });

// ---------------------------------------------------------------- loading and start screens
let loaderTimer = 0;
function showLoader() {
  let p = 0, i = 0;
  $("ld-msg").textContent = TEXT.loading[0];
  loaderTimer = setInterval(() => {
    p = Math.min(93, p + Math.random() * 7); $("ld-pct").textContent = Math.floor(p) + "%"; $("ld-bar").style.width = p + "%";
    if (Math.random() < 0.18) { i = (i + 1) % TEXT.loading.length; $("ld-msg").textContent = TEXT.loading[i]; }
  }, 160);
}
function hideLoader() { clearInterval(loaderTimer); $("ld-pct").textContent = "100%"; $("ld-bar").style.width = "100%"; $("loader").hidden = true; }
function fillStart() {
  $("start-who").textContent = TEXT.start_who; $("start-title").textContent = TEXT.start_title; $("start-sub").textContent = TEXT.start_sub;
  $("enter-sound").textContent = TEXT.enter_sound; $("enter-quiet").textContent = TEXT.enter_quiet; $("start-plain").textContent = TEXT.plain_link;
}

// ---------------------------------------------------------------- the room
let engine = null, shell = null, stations = null, ui = null, oura = null, started = false, tween = null;
const state = { focus: null, entered: false };
const clock = new THREE.Clock();
const forcedHour = (location.search.match(/[?&]h=([\d.]+)/) || [])[1];   // local testing only
const TOD = { hour: forcedHour ? +forcedHour : frankfurtHour(), preview: forcedHour ? +forcedHour : null, idx: -1, anim: null, clock: 30 };

function applyTime(h) { const m = moodAt(h); shell.applyMood(m); stations.applyMood(m); }

function fallBack() {
  // the browser lost (or never had) the graphics the room needs: show the plain page with a note, for this visit
  // only (not remembered, so the next visit tries the room again)
  root.dataset.fallback = "1";
  delete root.dataset.roomok;   // and don't offer the room again on this visit
  clearInterval(loaderTimer);
  pause();
  window.sbMode = "plain"; root.dataset.mode = "plain";
  // full-screen panels hide the header; give it back, so the plain page has its header and CV button
  $("os").hidden = true; $("pv").hidden = true; document.querySelector(".hud").hidden = false;
}

const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
function flyTo(v, dur, done) {
  const { camera, controls } = engine;
  controls.enabled = false;
  // arc over the command table when the straight path would cross it
  const fp = camera.position.clone(), a = new THREE.Vector3(fp.x, 0, fp.z), ab = new THREE.Vector3(v.pos.x, 0, v.pos.z).sub(a);
  const k = THREE.MathUtils.clamp(-a.dot(ab) / Math.max(ab.lengthSq(), 1e-6), 0, 1);
  const ctrl = a.addScaledVector(ab, k).length() < 1.3 ? fp.clone().add(v.pos).multiplyScalar(0.5) : null;
  if (ctrl) ctrl.y = Math.max(ctrl.y, 2.8);
  tween = { fp, ft: controls.target.clone(), tp: v.pos, tt: v.target, ctrl, t: 0, dur: reduceMotion ? 0.01 : dur, done };
}
function viewFor(id) {
  const v = stations.views[id];
  if (!engine.portrait() || id === "screen" || id === "lounge") return { pos: v.pos.clone(), target: v.target.clone() };
  return { pos: v.pos.clone().sub(v.target).multiplyScalar(id === "brain" ? 1.45 : 1.3).add(v.target), target: v.target.clone() };
}

// ---------------------------------------------------------------- focus on a station, and back home
function setFocus(id) {
  state.focus = id;
  if (id) root.dataset.focus = id; else delete root.dataset.focus;
}
// a panel must never make the page scroll sideways; checked once it has settled
function checkOverflow() {
  const measure = () => { root.dataset.overflow = Math.max(root.scrollWidth, document.body.scrollWidth) > innerWidth ? "yes" : "no"; };
  measure(); setTimeout(measure, 900);
}
function leaveFocus() {
  ui.hideCard(); ui.closeChat();
  if (state.focus === "cv") stations.fx.print(false);
  setFocus(null);
}
function activate(id, instant) {
  if (tween || !state.entered) return;
  hideTip();
  if (id === "bot") { openChat(); return; }
  ouraTo(id);
  if (id === "window") { nextPreview(); return; }
  if (id === "tea") { S.pour(); stations.fx.tea(); ui.toast(TEXT.toast_tea); return; }
  if (id === "jasmine") { S.jasmine(); stations.fx.jasmine(); ui.toast(TEXT.toast_jasmine); return; }
  if (id === "ivy") { S.ivy(); stations.fx.ivy(); ui.toast(TEXT.toast_ivy); return; }
  if (state.focus === id) { if (id === "brain") { stations.fx.fireBrain(1.6); S.spark(); } return; }
  if (state.focus) ui.hideCard();
  setFocus(id); $("hint").style.opacity = 0;
  const dur = instant ? 0.01 : 1.1;
  if (id === "lounge") { S.click(); S.zoom(); flyTo(viewFor(id), dur * 1.4, () => ui.toast(TEXT.toast_lounge)); return; }
  if (id === "screen") { S.click(); S.zoom(); flyTo(viewFor(id), dur, () => { ui.openOS(); checkOverflow(); }); return; }
  if (id === "brain") { S.holo(); stations.fx.fireBrain(1.8); } else S.click();
  if (id === "globe") { S.whoosh(); stations.fx.spinGlobe(); }
  if (id === "forensic") { S.data(); stations.fx.consoleLive(4); }
  if (id === "clinical") { S.data(); stations.fx.trainingLive(6); }
  if (id === "cv") { S.printer(); stations.fx.print(true); }
  if (id !== "cv") S.zoom();
  flyTo(viewFor(id), dur, () => { ui.showCard(id); S.open(); checkOverflow(); if (id === "globe") setTimeout(greet, 450); });
}
function goHome() {
  leaveFocus();
  stations.fx.aimGlobe(null); oura.idle();
  flyTo(engine.homeView(), 1.0, () => { engine.controls.enabled = true; });
}

// ---------------------------------------------------------------- Oura: she visits what you look at, and chats from prepared answers
function ouraTo(id) {
  if (["lounge", "tea", "jasmine"].includes(id)) { const lngIn = V3(-LNG.x, 0, -LNG.z).normalize(); oura.visit(LNG.clone().add(V3(0, 1.75, 0)).addScaledVector(lngIn, 0.7), null); return; }
  const v = stations.views[id];
  if (v) {
    const fwd = v.target.clone().sub(v.pos).setY(0).normalize(), right = V3(-fwd.z, 0, fwd.x);
    oura.visit(v.target.clone().addScaledVector(right, -1.0).addScaledVector(fwd, -0.5).add(V3(0, 0.4, 0)), v.target);
  } else if (id === "ivy") oura.visit(polar(IVY_TH, 3.0, 2.3), polar(IVY_TH, 4, 1.8));
  else if (id === "window") oura.visit(polar(WIN_TH, 3.9, 2.4), polar(WIN_TH, R, 1.8));
}
let chatBusy = false;
async function ask(q) {
  q = String(q || "").trim().slice(0, 400); if (!q || chatBusy) return;
  chatBusy = true;
  try {
    if (innerWidth <= 760 || innerHeight <= 500) $("chips").hidden = true;
    ui.addMessage("me", q);
    const p = ui.addMessage("bot", "…"); S.bot(2);
    const a = answer(q);
    await ui.typeOut(p, a.text, () => S.botTalk());
    ui.addGo(p, a.go);
  } finally { chatBusy = false; }
}
function openChat() {
  hideTip(); leaveFocus(); stations.fx.aimGlobe(null);
  setFocus("bot"); $("hint").style.opacity = 0;
  oura.chat(true);
  ui.openChat({ onAsk: ask, onGo: (go) => { closeChat(); activate(go); } });
  S.bot(3); checkOverflow();
  if (ui.chatEmpty()) ui.typeOut(ui.addMessage("bot", ""), TEXT.oura_chat_hello, () => S.botTalk());
}
function closeChat() { ui.closeChat(); if (state.focus === "bot") setFocus(null); oura.idle(); engine.controls.enabled = true; }
$("chat-close").addEventListener("click", () => { S.click(); closeChat(); });

// ---------------------------------------------------------------- the globe greets in her languages
function greet() {
  const p = stations.globeWorld(new THREE.Vector3()).project(engine.camera);
  const x = ((p.x + 1) / 2) * innerWidth, y = ((1 - p.y) / 2) * innerHeight;
  HELLO.forEach(([w, lang], i) => setTimeout(() => {
    ui.bubble(w, lang, Math.max(50, Math.min(innerWidth - 50, x + (i % 2 ? 1 : -1) * (30 + Math.random() * 80))), Math.max(70, y - 40 - Math.random() * 60));
    S.greet(i);
  }, i * 280));
}
function aimGlobe(placeId) {
  stations.fx.aimGlobe(placeId);
  document.querySelectorAll(".place").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.id === placeId)));
  S.tone(988, 0.2, "sine", 0.05); S.tone(1480, 0.3, "sine", 0.03, 0.06);
}

// ---------------------------------------------------------------- the window previews other times of day
function nextPreview() {
  TOD.idx = (TOD.idx + 1) % (PREVIEWS.length + 1);
  if (TOD.idx === PREVIEWS.length) {
    TOD.preview = null; TOD.anim = { from: TOD.hour, to: frankfurtHour(), t: 0 }; S.chime();
    ui.toast(TEXT.toast_real_time.replace("{time}", clockText())); return;
  }
  const [h, name] = PREVIEWS[TOD.idx]; TOD.preview = h; TOD.anim = { from: TOD.hour, to: h, t: 0 }; S.whoosh();
  ui.toast(TEXT.toast_preview.replace("{name}", name));
  if (name === "night") setTimeout(() => { stations.fx.star(); S.chime(); }, 1700);
}
function updateTime(dt) {
  if (TOD.anim) {
    TOD.anim.t = Math.min(1, TOD.anim.t + dt / 1.6); let d = TOD.anim.to - TOD.anim.from; if (d < 0) d += 24;
    TOD.hour = (TOD.anim.from + d * ease(TOD.anim.t)) % 24; applyTime(TOD.hour); if (TOD.anim.t >= 1) TOD.anim = null; return;
  }
  TOD.clock -= dt; if (TOD.clock > 0) return; TOD.clock = 30;
  if (TOD.preview === null) { const h = frankfurtHour(); if (Math.abs(h - TOD.hour) > 0.01) { TOD.hour = h; applyTime(h); } }
}

// ---------------------------------------------------------------- buttons inside panels
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-act]"); if (!b || !ui) return;
  const act = b.dataset.act;
  if (act === "preview") { ui.openPreview(b); checkOverflow(); }
  if (act === "get") { S.deny(); ui.toast(TEXT.toast_get); }
  if (act === "place") aimGlobe(b.dataset.id);
  if (act === "lang") {
    const i = +b.dataset.i, r = b.getBoundingClientRect();
    ui.bubble(HELLO[i][0], HELLO[i][1], Math.max(50, r.left + 60), Math.max(60, r.top - 18));
    S.greet(i); if (LANGS[i].place) aimGlobe(LANGS[i].place);
  }
  if (act === "copy") {
    const mail = b.parentElement.querySelector(".mail"), addr = mail.textContent.trim();
    const selectIt = () => { const r = document.createRange(); r.selectNodeContents(mail); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = TEXT.copy_selected; };
    try { navigator.clipboard.writeText(addr).then(() => { b.textContent = TEXT.copied; S.tone(1318.5, 0.12, "sine", 0.05); }, selectIt); } catch { selectIt(); }
  }
});

// ---------------------------------------------------------------- keys
addEventListener("keydown", (e) => {
  if (!ui || root.dataset.mode !== "room") return;
  if (ui.previewOpen()) { if (e.key === "Escape") ui.closePreview(); if (e.key === "ArrowRight") ui.nextSlide(1); if (e.key === "ArrowLeft") ui.nextSlide(-1); return; }
  if (e.key !== "Escape") return;
  if (ui.osOpen()) ui.closeOS(); else if (state.focus === "bot") closeChat(); else if (state.focus) goHome();
});
function pickFromBar(id) {
  if (state.focus && state.focus !== id && !tween) leaveFocus();
  activate(id);
}

// ---------------------------------------------------------------- pointer: hover and tap
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
ray.params.Points.threshold = 0.02; ray.params.Line.threshold = 0.02;
let hotRoots = [], hovered = null, down = null;
const LABEL = Object.fromEntries(STATIONS.map((s) => [s.id, s.label]));
const pointer = { ndc: new THREE.Vector2(), time: -1e9 };   // where the visitor last pointed, so Oura can look there
const setHover = (id, on) => { if (id === "bot") oura.hover(on); else stations.hover(id, on); };
function pick(x, y) {
  ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(ndc, engine.camera);
  for (const h of ray.intersectObjects(hotRoots, true)) { let o = h.object; while (o && !o.userData.hot) o = o.parent; if (o) return o.userData.hot; }
  return null;
}
function hideTip() { ui.hideTip(); if (hovered) { setHover(hovered, false); hovered = null; $("scene").style.cursor = ""; } }
function wirePointer(canvas) {
  const track = (e) => { pointer.ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); pointer.time = performance.now(); };
  canvas.addEventListener("pointerdown", track);
  canvas.addEventListener("pointermove", track);
  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" || !state.entered || tween || ui.osOpen()) return;
    const id = pick(e.clientX, e.clientY);
    if (state.focus && id && id !== state.focus) { hideTip(); return; }
    if (id !== hovered) { if (hovered) setHover(hovered, false); hovered = id; if (id) { setHover(id, true); S.hover(); } }
    if (id && !state.focus) ui.tip(LABEL[id], e.clientX, e.clientY); else ui.hideTip();
    canvas.style.cursor = id ? "pointer" : "";
  });
  canvas.addEventListener("pointerleave", hideTip);
  canvas.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  canvas.addEventListener("pointerup", (e) => {
    if (!down) return; const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), quick = performance.now() - down.t < 600; down = null;
    if (moved > 8 || !quick || tween || !state.entered) return;
    const id = pick(e.clientX, e.clientY);
    if (id === "bot") { if (state.focus && state.focus !== "bot") leaveFocus(); activate("bot"); return; }
    if (state.focus === "bot") { closeChat(); if (id) activate(id); return; }
    if (state.focus === "lounge") { if (id && id !== "lounge") activate(id); else { S.click(); goHome(); } return; }
    if (state.focus) { if (id === state.focus) activate(state.focus); else { S.click(); goHome(); } return; }
    if (id) activate(id);
  });
}

// ---------------------------------------------------------------- sound and entering
let iosHinted = false;
function soundOn() {
  if (!iosHinted && S.enabled && isAppleMobile()) { iosHinted = true; ui.toast(TEXT.ios_silent); }
}
function setSoundLabel() { const b = $("snd"); b.textContent = S.enabled ? TEXT.sound_on : TEXT.sound_off; b.setAttribute("aria-pressed", String(S.enabled)); }
$("snd").addEventListener("click", () => { S.start(!S.enabled); setSoundLabel(); if (S.enabled) { S.click(); soundOn(); } });
$("enter-sound").addEventListener("click", () => enter(true));
$("enter-quiet").addEventListener("click", () => enter(false));

function enter(withSound, instant) {
  if (withSound) { S.start(true); soundOn(); }   // no audio at all unless the visitor chose it
  state.entered = true;
  oura.arrive(TEXT.oura_hello, reduceMotion ? 50 : 1800);
  $("start").hidden = true; $("snd").hidden = false; setSoundLabel();
  $("hint").textContent = engine.coarse ? TEXT.hint_touch : TEXT.hint_mouse; $("hint").hidden = false;
  setTimeout(() => { $("hint").style.opacity = 0; }, 9000);
  const home = engine.homeView();
  if (instant || reduceMotion) { engine.camera.position.copy(home.pos); engine.controls.target.copy(home.target); engine.controls.enabled = true; }
  else flyTo(home, 2.4, () => { engine.controls.enabled = true; });
}

// ---------------------------------------------------------------- the loop
const shift = { x: 0, y: 0 };
const perf = { n: 0, sum: 0, done: false };
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  const { camera, controls } = engine;
  if (tween) {
    tween.t += dt / tween.dur; const k = ease(Math.min(1, tween.t));
    if (tween.ctrl) camera.position.copy(tween.fp).multiplyScalar((1 - k) * (1 - k)).addScaledVector(tween.ctrl, 2 * k * (1 - k)).addScaledVector(tween.tp, k * k);
    else camera.position.lerpVectors(tween.fp, tween.tp, k);
    controls.target.lerpVectors(tween.ft, tween.tt, k);
    if (tween.t >= 1) { const d = tween.done; tween = null; if (d) d(); }
  }
  controls.update();

  // keep the focused station clear of the panel
  const cardOpen = !$("card").hidden || !$("chat").hidden, wide = innerWidth > 760 || innerHeight <= 500;
  const tx = cardOpen && wide ? 200 : 0, ty = cardOpen && !wide ? innerHeight * 0.26 : 0;
  shift.x += (tx - shift.x) * 0.12; shift.y += (ty - shift.y) * 0.12;
  if (Math.abs(shift.x) < 0.5 && Math.abs(shift.y) < 0.5 && !tx && !ty) camera.clearViewOffset();
  else camera.setViewOffset(innerWidth, innerHeight, shift.x, shift.y, innerWidth, innerHeight);

  stations.update(dt, t, state.focus);
  oura.update(dt, t, camera, pointer);
  shell.update(t);
  updateTime(dt);
  // a slow device switches off the reflection and the glow
  if (state.entered && !perf.done && !tween) {
    perf.n++; perf.sum += dt;
    if (perf.n === 120) { perf.done = true; if (perf.sum / perf.n > 1 / 30) { engine.lowQuality(); root.dataset.quality = "low"; } }
  }
  engine.render();
}
// the room draws and plays sound only while it is the page being shown
function run() {
  if (!engine || root.dataset.mode !== "room") return;
  clock.getDelta(); engine.renderer.setAnimationLoop(frame);
  if (S.enabled) S.resume();
}
function pause() { if (engine) engine.renderer.setAnimationLoop(null); S.suspend(); }
document.addEventListener("visibilitychange", () => { if (document.hidden) S.suspend(); else if (root.dataset.mode === "room" && S.enabled) S.resume(); });

const fontsReady = Promise.race([
  Promise.all(["28px Michroma", "400 40px Sora", "600 28px Sora", "21px 'Nanum Pen Script'"].map((f) => document.fonts.load(f))),
  new Promise((r) => setTimeout(r, 4000)),
]).catch(() => {});

const DEEP = ["brain", "screen", "forensic", "clinical", "globe", "log", "cv", "preview", "home", "lounge", "bot"];
let ready = false, begun = false;
function startRoom() {
  if (started) { if (ready) begin(); return; }
  started = true;
  fillStart();
  showLoader();
  try { engine = createEngine($("scene")); } catch { fallBack(); return; }
  shell = buildShell(engine);
  stations = buildStations(engine);
  oura = createOura(engine.scene, S, engine.renderer.getPixelRatio());
  oura.root.userData.hot = "bot";
  hotRoots = [...stations.hot.values(), oura.root];
  ui = createUI({ sound: S, reduceMotion, coarse: engine.coarse, onGo: (id) => { if (id === "home") goHome(); else activate(id); } });
  ui.buildNav(STATIONS, pickFromBar);
  wirePointer($("scene"));
  $("scene").addEventListener("webglcontextlost", (e) => { e.preventDefault(); fallBack(); });
  addEventListener("resize", () => {
    engine.resize();
    if (state.entered && !state.focus && !tween) { const h = engine.homeView(); engine.camera.position.copy(h.pos); engine.controls.target.copy(h.target); }
  });
  fontsReady.then(() => {
    stations.redraw();
    applyTime(TOD.hour);
    hideLoader();
    root.dataset.quality = "high";
    window.sbRoomStarted = true;
    root.dataset.ready = "1";
    ready = true;
    if (root.dataset.mode === "room") begin();   // unless the visitor chose the plain page while the room was loading
  });
}
// the first time the room is shown: the start screen, or straight to a station for a link like #brain
function begin() {
  if (!begun) {
    begun = true;
    const deep = location.hash.slice(1);
    if (DEEP.includes(deep)) {
      enter(false, true);
      if (deep === "preview") { activate("brain", true); setTimeout(() => { ui.openPreview(null); checkOverflow(); }, 50); }
      else if (deep !== "home") activate(deep, true);
      if (deep === "bot") { engine.camera.lookAt(engine.controls.target); engine.camera.updateMatrixWorld(); oura.place(engine.camera); }
    } else $("start").hidden = false;
  }
  run();
}

if (root.dataset.mode === "room") startRoom();
