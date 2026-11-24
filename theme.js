/* ============================================================
   Thèmes Jours Restants — quatre tenues pour la même Faucheuse.

   Le thème est appliqué sur <html> dès le <head> (pas de flash
   d'au-revoir visuel), mémorisé en localStorage, et basculé par
   un petit interrupteur de pastilles fixé en haut à gauche.
   ============================================================ */
"use strict";

(function () {
  var THEMES = {
    nuit:      { label: "Nuit",      dot: "#7ec8a9" },
    terminal:  { label: "Terminal",  dot: "#4ade80" },
    parchemin: { label: "Parchemin", dot: "#c9b98a" },
    neon:      { label: "Néon",      dot: "#e05fff" }
  };
  var ORDER = ["nuit", "terminal", "parchemin", "neon"];

  function readSaved() {
    try { return localStorage.getItem("jr-theme") || "nuit"; } catch (e) { return "nuit"; }
  }

  function apply(theme) {
    if (!Object.prototype.hasOwnProperty.call(THEMES, theme)) theme = "nuit";
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("jr-theme", theme); } catch (e) { /* navigation privée : la Faucheuse ne tient pas de journal */ }
  }

  /* Appliqué immédiatement : le site se souvient de vos goûts, pas de vos jours. */
  apply(readSaved());

  function mount() {
    var current = document.documentElement.getAttribute("data-theme") || "nuit";
    var box = document.createElement("div");
    box.className = "theme-switch";
    box.setAttribute("aria-label", "Choix du thème");
    ORDER.forEach(function (t) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ts-btn" + (t === current ? " active" : "");
      b.title = "Thème : " + THEMES[t].label;
      b.setAttribute("aria-label", "Thème : " + THEMES[t].label);
      b.style.background = THEMES[t].dot;
      b.addEventListener("click", function () {
        apply(t);
        var all = box.querySelectorAll(".ts-btn");
        for (var i = 0; i < all.length; i++) all[i].classList.remove("active");
        b.classList.add("active");
      });
      box.appendChild(b);
    });
    document.body.appendChild(box);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
