// Decides, before the first paint, whether this visit shows the 3D room or the plain page.
// The plain page is the fallback for every case the room cannot handle, so nobody sees a blank screen.
(function () {
  var root = document.documentElement;
  var KEY = "sb-mode";
  var guard = 0;

  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function canDraw3D() {
    try { var c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); }
    catch (e) { return false; }
  }
  function apply(mode) { window.sbMode = mode; root.dataset.mode = mode; }
  function tell(mode) { document.dispatchEvent(new CustomEvent("sb-mode", { detail: mode })); }

  // If the room has not drawn its first frame 15 seconds after it was asked for, show the plain page instead,
  // the same way a visitor's switch does (but not remembered). A newer request for the room starts a new wait.
  function armGuard() {
    var mine = ++guard;
    setTimeout(function () {
      if (mine === guard && window.sbMode === "room" && !window.sbRoomStarted) { root.dataset.fallback = "1"; apply("plain"); tell("plain"); }
    }, 15000);
  }

  // The room needs import maps and WebGL. Only then is it offered (data-roomok shows the mode button).
  var possible = !!(window.HTMLScriptElement && HTMLScriptElement.supports && HTMLScriptElement.supports("importmap"));
  if (possible && !canDraw3D()) { possible = false; root.dataset.nowebgl = "1"; }
  if (possible) root.dataset.roomok = "1";

  var mode = "room";
  if (/[?&]plain\b/.test(location.search) || location.hash === "#plain") mode = "plain";
  else if (stored() === "plain") mode = "plain";
  else if (!possible) mode = "plain";
  apply(mode);
  if (mode === "room") armGuard();

  window.sbSetMode = function (next) {
    try { localStorage.setItem(KEY, next); } catch (e) { /* the choice just isn't remembered */ }
    apply(next);
    if (next === "room") armGuard();
    tell(next);
  };

  // The mode buttons work from the first moment, before the room's own code has loaded.
  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest && e.target.closest("#mode-btn, #start-plain");
    if (!b) return;
    window.sbSetMode(b.id === "start-plain" || window.sbMode === "room" ? "plain" : "room");
  });
})();
