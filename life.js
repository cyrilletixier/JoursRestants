"use strict";

/* ============================================================
   Tables de mortalité INSEE 2025 (données provisoires), France.
   DEC3 — Quotients de mortalité pour 100 000 survivants à l'âge x,
   par âge atteint dans l'année. Indices : 0 = q(x=0), ..., 100 = q(x=100).
   https://www.insee.fr/fr/statistiques/8999019
   ============================================================ */
const QX = {
  F: [320,61,19,10,7,9,6,9,9,5,8,5,6,7,11,13,14,15,15,17,21,21,23,20,24,25,26,22,26,24,24,35,34,38,33,46,48,51,47,60,59,72,83,79,94,94,114,114,128,143,168,179,200,211,225,244,281,301,331,360,394,425,460,514,569,619,680,714,751,821,895,975,1060,1152,1245,1333,1467,1654,1813,2125,2322,2687,3074,3481,4027,4749,5379,6150,7126,8044,9278,10717,12283,13915,15783,18327,20490,22380,25592,27448,30036],
  H: [405,60,23,19,19,12,13,8,9,7,7,8,8,12,13,21,24,30,38,50,61,58,54,63,61,59,68,62,75,74,74,87,71,89,95,101,100,121,117,131,137,155,168,174,189,216,235,229,240,286,329,339,376,420,473,500,526,595,648,715,748,817,897,973,1078,1160,1294,1365,1486,1602,1721,1884,2067,2185,2342,2586,2755,2964,3270,3587,3978,4512,4875,5460,6216,6863,7966,9125,9999,11193,12907,14492,16533,18232,19527,22358,25041,27511,30353,31253,36685]
};

/* Prolongement au-delà de 100 ans : on extrapole le quotient en
   multipliant par ~1,09 par an jusqu'à atteindre 1 (table fermée à 120). */
function buildFullTable(sex) {
  const t = QX[sex].map(v => v / 100000);
  const n = 10;
  let g = 1;
  for (let i = t.length - n; i < t.length; i++) g *= t[i] / t[i - 1];
  g = Math.pow(g, 1 / n);
  let q = t[t.length - 1] * g;
  while (t.length < 121) {
    t.push(Math.min(q, 1));
    q *= g;
    if (q >= 1) q = 1;
  }
  return t;
}

const TABLES = { F: buildFullTable("F"), H: buildFullTable("H") };

/* ============================================================
   MOTEUR DE SURVIE — fonctionnalités partagées par toutes les pages.
   ============================================================ */

/* Table effective : qx ajusté à l'âge absolu i (k = i - âge actuel).
   Les comportements ne modulent que les années à venir ; le passé est acquis. */
function effectiveTable(sex, ageNow, mfun) {
  const base = TABLES[sex];
  return base.map((q, i) => {
    if (i < ageNow || i < 18) return q;
    const m = mfun(i - ageNow);
    return 1 - Math.pow(1 - q, m);
  });
}

/* Survie de l'âge a à l'âge a+t, sous la table effective (interpolation géométrique intra-annuelle). */
function survFrom(eff, a, t) {
  if (t <= 0) return 1;
  let p = 1;
  let idx = Math.floor(a);
  const frac = a - idx; // partie déjà vécue de l'année idx
  if (t <= 1 - frac) return Math.pow(1 - eff[Math.min(idx, eff.length - 1)], t);
  if (frac > 0) {
    p *= Math.pow(1 - eff[idx], 1 - frac);
    t -= (1 - frac);
    idx++;
  }
  while (t >= 1 && idx < eff.length) {
    p *= (1 - eff[idx]);
    idx++;
    t -= 1;
  }
  if (t > 0 && idx < eff.length) p *= Math.pow(1 - eff[idx], t);
  return p;
}

/* Temps médian restant : plus petit t tel que survie(a -> a+t) <= 0,5. */
function medianRemaining(eff, a) {
  let t = 0;
  while (t < 120 - a) {
    if (survFrom(eff, a, t + 1) <= 0.5) {
      const pBefore = survFrom(eff, a, t);
      const pAfter = survFrom(eff, a, t + 1);
      if (pAfter >= pBefore) return t + 0.5;
      return t + (pBefore - 0.5) / (pBefore - pAfter);
    }
    t++;
  }
  return 120 - a;
}

/* Espérance de vie restante à l'âge a (intégration de la survie, pas de 1/12 d'année). */
function lifeExpectancyRemaining(eff, a) {
  let sum = 0;
  const step = 1 / 12;
  for (let t = step; a + t < 120; t += step) sum += survFrom(eff, a, t) * step;
  return sum;
}


/* Formate un gain (ou une perte) en années : « +2,3 ans » / « -1,2 an ». */
function yearsFmt(y) {
  const sign = y >= 0 ? "+" : "-";
  const a = Math.abs(y);
  return sign + a.toFixed(1).replace(".", ",") + (a >= 2 ? " ans" : " an");
}
