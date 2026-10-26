// Theme toggle for the portfolio pages. Shares the "theme" key with the atlas (controls.js),
// so a choice made on one page holds on the others. The pre-paint snippet in each <head> applies it.
(function () {
  var btn = document.getElementById("theme-btn");
  if (!btn) return;
  var root = document.documentElement;
  function current() {
    var t = root.dataset.theme;
    if (t === "light" || t === "dark") return t;
    return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function label() {
    var next = current() === "dark" ? "light" : "dark";
    btn.textContent = next === "dark" ? "Dark" : "Light";
    btn.setAttribute("aria-label", "Switch to " + next + " theme");
  }
  btn.addEventListener("click", function () {
    var next = current() === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (e) {}
    label();
  });
  label();
})();
