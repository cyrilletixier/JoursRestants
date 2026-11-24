/* ============================================================
   API Jours Restants — bibliothèque statique, calcul 100 % local.

   Dépendance : life.js chargé avant (tables INSEE + moteur de survie).
   Contrat : JoursRestantsApi.compute(naissance, sexe)
     - naissance : "YYYY-MM-DD"
     - sexe : "H" | "F"
     - retour : objet JSON (jamais d'exception, les verrues vont dans "erreur")

   Le calcul utilise les tables neutres (mortalité moyenne du sexe),
   hors comportements : tabac, alcool, sport et niveau de vie se règlent
   sur la page d'accueil, qui a déjà assez de case à cocher pour l'ego.
   ============================================================ */
"use strict";

var JoursRestantsApi = (function () {

  function iso(d) {
    return d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");
  }

  function compute(naissance, sexe) {
    var s = String(sexe || "").trim().toUpperCase();
    if (s !== "H" && s !== "F") {
      return { erreur: "sexe invalide : attendu \"H\" ou \"F\"." };
    }
    var str = String(naissance || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return { erreur: "naissance invalide : attendu \"YYYY-MM-DD\"." };
    }
    var birth = new Date(str + "T00:00:00");
    var now = new Date();
    if (isNaN(birth.getTime())) {
      return { erreur: "naissance illisible : ce n'est pas une date, c'est un cri." };
    }
    if (birth > now) {
      return { erreur: "naissance dans le futur : pas encore né, revenez après l'accouchement." };
    }
    var age = (now - birth) / (365.2425 * 86400000);
    if (age >= 120) {
      return { erreur: "au-delà de 120 ans, la table de mortalité rend son tablier." };
    }

    var eff = effectiveTable(s, age, function () { return 1.0; });
    var med = medianRemaining(eff, age);
    var jours = Math.round(med * 365.2425);
    var dateDeces = new Date(now.getTime() + jours * 86400000);
    var esperance = lifeExpectancyRemaining(eff, age);

    return {
      naissance: str,
      sexe: s,
      age_actuel_ans: Math.floor(age),
      jours_restants: jours,
      interpretation: "jours restants avec 50 % de chance (médiane)",
      date_deces_probable: iso(dateDeces),
      esperance_vie_restante_ans: Math.round(esperance * 10) / 10,
      source: "INSEE, tables de mortalité 2025 provisoires, France, population moyenne du sexe"
    };
  }

  return { compute: compute, version: "1.0" };
})();
