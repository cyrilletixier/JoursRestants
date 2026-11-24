/* ============================================================
   HAZARDS — modèle de risque partagé par toutes les pages.

   Contient les constants de calage et deux fonctions PURES :
     behaviorHazard(sex, opts)  -> m(k), opts = {tabac, alcool, sport, niveau}
     hypothesisHazard(ageNow, causes) -> m(k), causes = {cancer, cardio, neuro}

   Les pages lisent le DOM puis délèguent ici ; l'API du calcul
   n'a ainsi aucune dependance au navigateur.
   ============================================================ */
"use strict";

const TABAC_CALAGE = { H: 1.50, F: 1.40 };
const ALCOOL_CALAGE = { H: 1.067, F: 1.033 };
const SPORT_CALAGE = { H: 1.03, F: 1.0375 };

/* Niveau de vie (proxy patrimoine) : Insee Première n° 2085 (déc. 2025,
   période 2020-2024). Espérance de vie à la naissance des 5 % les plus
   modestes vs 5 % les plus aisés : 72,0 vs 85,0 ans (H), 80,1 vs 88,7 (F),
   soit 13 ans (H) / 9 ans (F) d'écart. À 50 ans, un homme modeste a un
   risque de décès annuel ~7× celui d'un homme aisé. On convertit en
   multiplicateurs de risque constant, en échelle log autour de « moyen »,
   calés numériquement pour reproduire l'écart d'espérance de vie à la
   naissance entre les deux extrêmes (13 ans H, 9 ans F). */
const NIVEAU_FACTORS = {
  H: { tres_modeste: 1.97, modeste: 1.36, moyen: 1.0, aise: 0.71, tres_aise: 0.51 },
  F: { tres_modeste: 1.74, modeste: 1.33, moyen: 1.0, aise: 0.75, tres_aise: 0.59 }
};

/* Comportements : multiplicateurs de risque (hazard ratios) appliqués
   au hazard de mortalité INSEE, en référence au Français moyen.
   Tabac   : Doll et al., BMJ 2004 (écart jamais fumé -> fumeur ~10 ans)
   Alcool  : Wood et al., The Lancet 2018 (forte consommation ~4-5 ans perdus)
   Pattern : Moore et al., PLoS Medicine 2012 (sédentaire ~-3 ans ; actif ~+3 ans)
   Le hazard ajusté est q' = 1 - (1-q)^m.
   Calages : la moyenne INSEE n'est PAS un never-smoker ni un marathonien ;
   les multiplicateurs sont RELATIFS au mix réel de la population du sexe. */
function behaviorHazard(sex, opts) {
  const tabac = opts.tabac, alcool = opts.alcool, sport = opts.sport, niveau = opts.niveau || "moyen";
  const calT = TABAC_CALAGE[sex];
  const calA = ALCOOL_CALAGE[sex];
  const calS = SPORT_CALAGE[sex];

  let mTabac;
  if (tabac === "fume") mTabac = () => 2.5 / calT;
  else if (tabac === "arrete") mTabac = () => 1.25 / calT;
  else if (tabac === "aujourdhui") mTabac = (k) => (1.25 + (2.5 - 1.25) * Math.exp(-k / 7)) / calT;
  else mTabac = () => 1.0 / calT; // jamais fumé : mieux que la moyenne, enfin récompensé

  const mAlcool = alcool === "fort" ? () => 1.4 / calA : (alcool === "modere" ? () => 1.05 / calA : () => 1.0 / calA);
  const mSport = sport === "sedentaire" ? () => 1.3 / calS : (sport === "regulier" ? () => 0.85 / calS : () => 1.0 / calS);
  const mNiveau = () => NIVEAU_FACTORS[sex][niveau] || 1.0;

  // m(k) : hazard ratio k années après aujourd'hui, chaque comportement
  // étant rapporté au mix de la population française du même sexe.
  // Le niveau de vie s'ajoute tel quel : la moyenne de référence est « moyen ».
  return (k) => mTabac(k) * mAlcool(k) * mSport(k) * mNiveau();
}

/* ============================================================
   Hypothèses médicales : « l'IA guérit X ».
   Les trois premières causes de décès en France (Inserm CépiDc),
   avec la part du risque de mortalité qu'elles expliquent, par âge
   (ordres de grandeur, avant / après 75 ans). Éliminer une cause
   ne supprime que sa part du hazard : les risques concurrents
   (sénescence, reste du catalogue) continuent de travailler.
   ============================================================ */

const CAUSES = {
  cancer: { avant75: 0.26, apres75: 0.15 },
  cardio: { avant75: 0.20, apres75: 0.28 },
  neuro:  { avant75: 0.08, apres75: 0.18 }
};

/* Facteur de hazard sous hypothèses : (1 - part éliminée), en fonction
   de l'âge absolu. causes : liste de noms cochés, ex ["cancer","cardio"].
   Retourne m(k) comme les comportements. */
function hypothesisHazard(ageNow, causes) {
  return (k) => {
    if (!causes || causes.length === 0) return 1;
    const a = ageNow + k;
    let f = 0;
    for (const c of causes) f += a < 75 ? CAUSES[c].avant75 : CAUSES[c].apres75;
    return 1 - Math.min(f, 0.9); // au moins 10 % du hazard demeure : la biologie reste souveraine
  };
}

/* Multiplier global : comportements x hypothèses. */
function combinedHazard(ageNow, sex, opts, causes) {
  const mBeh = behaviorHazard(sex, opts);
  const mHyp = hypothesisHazard(ageNow, causes || []);
  return (k) => mBeh(k) * mHyp(k);
}
