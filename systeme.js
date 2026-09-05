/* =====================================================================
   SYSTÈME DU JEU — BOX COLLECTOR
   =====================================================================
   Ce fichier est TOUT le moteur du jeu : raretés, calcul automatique
   des probabilités, économie, sauvegarde, rendu de l'interface,
   animation façon roulette de casino, et gestion des clics.

   Il ne contient AUCUNE donnée de contenu. Tout le contenu (raretés,
   boîtes, DLC) vit dans UN SEUL fichier à côté : contenu.js — lui seul
   est fait pour être modifié à la main. Tu n'as normalement jamais
   besoin de toucher à celui-ci.

   contenu.js doit être chargé AVANT ce fichier dans index.html.

   La sauvegarde utilise localStorage (standard du navigateur, marche
   sur GitHub Pages, en local, ou sur n'importe quel hébergeur statique,
   même en ouvrant le fichier directement sans serveur).
   ===================================================================== */

(function () {
"use strict";

/* =====================================================================
   1. SYSTÈME — raretés, calcul automatique des probabilités
   ===================================================================== */

/* Palette cyclique : attribuée automatiquement aux raretés dans l'ordre
   où elles apparaissent dans contenu.js. Autant de raretés que tu veux,
   la couleur suit toujours (elle boucle si tu dépasses la liste). */
const PALETTE_RARETE = [
  "#9b96ad", "#6fcf97", "#57ccf2", "#b98bfc", "#f2994a", "#d8b46a", "#eb5757",
  "#ff8fc0", "#63e6e2", "#c9e26b", "#7c9cf2", "#ffb454",
];

let RARETES = [];
let PALIER = {};
let INDEX_RARETE = {};
let SEUIL_PRESTIGE = 0;

/* Construit la liste des raretés à partir de la simple liste de noms
   NOMS_RARETES (définie dans contenu.js), du plus courant au plus rare.
   Le poids de chaque palier est calculé automatiquement par décroissance
   géométrique : tu n'as jamais besoin de choisir un nombre toi-même,
   juste d'ordonner des noms. */
function construireRaretes(noms) {
  RARETES = noms.map((label, i) => ({
    cle: slug(label),
    label,
    couleur: PALETTE_RARETE[i % PALETTE_RARETE.length],
    /* Poids RÉEL (non arrondi, jamais figé à un plancher) pour que chaque
       rareté supplémentaire reste strictement plus rare que la précédente,
       même au-delà de 7-8 raretés. Seul l'AFFICHAGE (dans generateur.html)
       arrondit pour rester lisible ; le calcul du jeu utilise ce nombre tel quel. */
    poids: 1000 / Math.pow(3, i),
  }));
  PALIER = Object.fromEntries(RARETES.map((r) => [r.cle, r]));
  INDEX_RARETE = Object.fromEntries(RARETES.map((r, i) => [r.cle, i]));
  SEUIL_PRESTIGE = Math.max(0, RARETES.length - 2);
}

/* Retrouve une rareté qu'elle soit écrite avec son nom exact ("Peu rare")
   ou sa forme technique ("peu_rare") — pour rester tolérant quand on
   écrit contenu.js à la main. */
function trouverRarete(saisie) {
  const cible = slug(String(saisie || ""));
  return RARETES.find((r) => r.cle === cible) || null;
}

function multiplicateurChance(cleRarete, chanceActuelle) {
  const n = RARETES.length;
  const centre = (n - 1) / 2;
  const sensibilite = centre > 0 ? (INDEX_RARETE[cleRarete] - centre) / centre : 0;
  return Math.max(0.05, 1 + chanceActuelle * 0.08 * sensibilite);
}

function slug(texte) {
  return String(texte)
    .replace(/œ/g, "oe").replace(/Œ/g, "OE")
    .replace(/æ/g, "ae").replace(/Æ/g, "AE")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

/* =====================================================================
   2. CONTENU DU JEU — lu depuis contenu.js (NOMS_RARETES, BOITES_DE_BASE,
   DLC_PACKS), chargé juste avant ce fichier. Tout se passe en synchrone,
   pas de serveur requis.
   ===================================================================== */

let BOITES_PAR_ID = {};
let DLC_PAR_ID = {};
let DLC_PAR_CODE = {};

/* Prépare tout le contenu et VÉRIFIE qu'il est cohérent (id uniques,
   raretés existantes...). Retourne la liste des erreurs trouvées (vide
   si tout va bien) — pratique pour repérer une faute de frappe dans
   contenu.js sans avoir à deviner pourquoi le jeu ne se lance pas. */
function preparerContenu() {
  construireRaretes(NOMS_RARETES);

  const erreurs = [];
  const idsVus = new Set();
  const boitesParId = {};

  function preparerBoite(box, contexte) {
    if (!box.id) box.id = slug(box.nom);
    if (idsVus.has(box.id)) {
      erreurs.push(`Deux boîtes ont le même identifiant "${box.id}" (${contexte}). Renomme l'une des deux.`);
    }
    idsVus.add(box.id);
    box.items.forEach((it) => {
      const palier = trouverRarete(it.rarete);
      if (!palier) {
        erreurs.push(`Objet "${it.nom}" (boîte "${box.nom}") : rareté "${it.rarete}" introuvable dans NOMS_RARETES.`);
        it.rarete = RARETES[0] ? RARETES[0].cle : "";
      } else {
        it.rarete = palier.cle;
      }
      it.id = box.id + "_" + slug(it.nom);
    });
    boitesParId[box.id] = box;
  }

  BOITES_DE_BASE.forEach((b) => preparerBoite(b, "boîte de base"));
  DLC_PACKS.forEach((dlc) => {
    if (!dlc.id) dlc.id = slug(dlc.nom);
    dlc.boites.forEach((b) => preparerBoite(b, `DLC "${dlc.nom}"`));
  });

  BOITES_PAR_ID = boitesParId;
  DLC_PAR_ID = Object.fromEntries(DLC_PACKS.map((d) => [d.id, d]));
  DLC_PAR_CODE = Object.fromEntries(DLC_PACKS.map((d) => [d.code.toUpperCase(), d]));

  return erreurs;
}

function afficherErreursContenu(erreurs) {
  document.getElementById("bc-tabs").innerHTML = "";
  document.getElementById("bc-content").innerHTML = `
    <div style="text-align:left; line-height:1.65; font-size:13.5px; color:var(--bc-text-dim);">
      <p style="color:var(--bc-danger); font-weight:600; margin-bottom:10px;">Il y a une erreur dans contenu.js :</p>
      <ul style="margin:0 0 12px 18px; padding:0;">
        ${erreurs.map((e) => `<li style="margin-bottom:4px;">${escHtml(e)}</li>`).join("")}
      </ul>
      <p>Corrige contenu.js puis recharge la page.</p>
    </div>`;
}


/* =====================================================================
   4. AMÉLIORATIONS
   ===================================================================== */

const UPGRADES = {
  revenu: {
    nom: "Revenu passif", desc: "Augmente l'or gagné de 5 par seconde à chaque niveau.",
    coutBase: 40, croissance: 1.6, max: 30, effet: (n) => 1 + n * 5,
  },
  chance_max: {
    nom: "Plafond de chance", desc: "Augmente le plafond réglable de ta Chance (voir le curseur ci-dessous).",
    coutBase: 100, croissance: 1.5, max: 15, effet: (n) => n,
  },
  remise: {
    nom: "Négociation", desc: "Réduit le prix des boîtes en boutique (-4%/niveau, max 40%).",
    coutBase: 50, croissance: 1.4, max: 10, effet: (n) => Math.min(n * 0.04, 0.4),
  },
};
function coutAmelioration(id, niveau) {
  const u = UPGRADES[id];
  return Math.round(u.coutBase * Math.pow(u.croissance, niveau));
}

/* =====================================================================
   5. MOTEUR DE BOÎTE — poids, tirage, probabilités
   ===================================================================== */

function nbParRarete(box) {
  const c = {};
  box.items.forEach((it) => { c[it.rarete] = (c[it.rarete] || 0) + 1; });
  return c;
}
function poidsEffectif(box, item, chanceActuelle) {
  const compte = nbParRarete(box)[item.rarete];
  return (PALIER[item.rarete].poids * multiplicateurChance(item.rarete, chanceActuelle)) / compte;
}
function probabilites(box, chanceActuelle) {
  const poids = box.items.map((it) => poidsEffectif(box, it, chanceActuelle));
  const total = poids.reduce((a, b) => a + b, 0);
  return box.items.map((it, i) => ({ item: it, pct: (100 * poids[i]) / total }));
}
function tirerPondere(items, poids) {
  const total = poids.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= poids[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}
function tirerItem(box, chanceActuelle) {
  const poids = box.items.map((it) => poidsEffectif(box, it, chanceActuelle));
  return tirerPondere(box.items, poids);
}

/* =====================================================================
   6. ÉTAT DU JOUEUR — sauvegarde persistante
   ===================================================================== */

const SAVE_KEY = "box_collector_save";
const CAP_HORS_LIGNE_SEC = 4 * 3600;

function nouvelEtat() {
  const boites = {};
  Object.keys(BOITES_PAR_ID).forEach((id) => { boites[id] = 0; });
  return {
    or: 30,
    boites,
    coutsBoites: {},
    collection: {},
    upgrades: { revenu: 0, chance_max: 0, remise: 0 },
    chanceActuelle: 0,
    dlcDebloques: [],
    stats: { boitesOuvertesTotal: 0, orGagneTotal: 0, fusionsTotal: 0, boitesVenduesTotal: 0, boitesAcheteesTotal: 0, cheatsUtilises: 0, xp: 0, tempsJeuSecondes: 0, meilleurNiveauAtteint: 0 },
    missions: { rang: 0, compteurId: 0, actives: [] },
    succesDebloques: [],
    succesCachesDebloques: [],
    tutorielVu: false,
    prestige: 0,
    derniereMaj: Date.now(),
  };
}

let state = nouvelEtat();
let sauvegardeEnCours = null;

function chargerEtat() {
  try {
    const brut = localStorage.getItem(SAVE_KEY);
    if (brut) {
      const data = JSON.parse(brut);
      const base = nouvelEtat();
      Object.keys(base).forEach((k) => { if (!(k in data)) data[k] = base[k]; });
      Object.keys(BOITES_PAR_ID).forEach((id) => { if (!(id in data.boites)) data.boites[id] = 0; });
      Object.keys(UPGRADES).forEach((id) => { if (!(id in data.upgrades)) data.upgrades[id] = 0; });
      Object.keys(base.stats).forEach((k) => { if (!(k in data.stats)) data.stats[k] = base.stats[k]; });
      if (!data.coutsBoites) data.coutsBoites = {};
      Object.keys(BOITES_PAR_ID).forEach((id) => {
        if (!(id in data.coutsBoites)) data.coutsBoites[id] = data.boites[id] * prixBoite(BOITES_PAR_ID[id]);
      });
      state = data;

      const ecouleSec = Math.max(0, Math.min(CAP_HORS_LIGNE_SEC, (Date.now() - state.derniereMaj) / 1000));
      const gain = Math.floor(ecouleSec * revenuParSec());
      if (gain > 0) {
        state.or += gain;
        state.stats.orGagneTotal += gain;
        setTimeout(() => afficherToast("Pendant ton absence : +" + formaterNombre(gain) + " or"), 400);
      }
    }
  } catch (e) {
    /* stockage indisponible (navigation privée, etc.) : partie non persistée */
  }
  state.derniereMaj = Date.now();
}

function sauvegarder() {
  state.derniereMaj = Date.now();
  clearTimeout(sauvegardeEnCours);
  sauvegardeEnCours = setTimeout(() => {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }
    catch (e) { /* stockage indisponible, on continue sans bloquer le jeu */ }
  }, 250);
}

function revenuParSec() {
  const base = UPGRADES.revenu.effet(state.upgrades.revenu);
  const bonusSucces = 1 + 0.01 * state.succesDebloques.length;
  return base * bonusSucces * bonusPrestige();
}
function bonusPrestige() { return 1 + 0.05 * (state.prestige || 0); }
function peutPrestiger() { return niveauPourXp(state.stats.xp || 0) >= 20; }
function chanceMax() { return UPGRADES.chance_max.effet(state.upgrades.chance_max); }
function remise() { return UPGRADES.remise.effet(state.upgrades.remise); }
function prixBoite(box) { return Math.max(1, Math.round(box.prix * (1 - remise()))); }
function prixRevente(box, qte, possede) {
  if (!possede || !qte) return 0;
  const coutTotal = state.coutsBoites[box.id] || possede * prixBoite(box);
  return Math.floor((coutTotal / possede) * 0.7) * qte;
}
function boitesDisponibles() {
  const dispo = [...BOITES_DE_BASE];
  DLC_PACKS.forEach((dlc) => { if (state.dlcDebloques.includes(dlc.id)) dispo.push(...dlc.boites); });
  return dispo;
}

function chiffreRomain(n) {
  const valeurs = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let reste = n, resultat = "";
  for (const [val, sym] of valeurs) { while (reste >= val) { resultat += sym; reste -= val; } }
  return resultat;
}

/* Regroupe les boîtes disponibles par catégorie : "Jeu de base" puis un
   groupe par DLC débloqué, numéroté en chiffres romains dans leur ordre
   d'apparition dans contenu.js. Utilisé par la Boutique et l'onglet Ouvrir. */
function categoriesBoites(filtre) {
  const categories = [];
  const baseFiltrees = BOITES_DE_BASE.filter((b) => !filtre || filtre(b));
  if (baseFiltrees.length) categories.push({ titre: "Jeu de base", boites: baseFiltrees });
  DLC_PACKS.forEach((dlc, index) => {
    if (!state.dlcDebloques.includes(dlc.id)) return;
    const boitesFiltrees = dlc.boites.filter((b) => !filtre || filtre(b));
    if (boitesFiltrees.length) {
      categories.push({ titre: `DLC ${chiffreRomain(index + 1)} — ${dlc.nom}`, boites: boitesFiltrees });
    }
  });
  return categories;
}

function formaterNombre(n) { return Math.round(n).toLocaleString("fr-FR"); }
function formaterDuree(secondes) {
  const s = Math.max(0, Math.floor(secondes));
  const jours = Math.floor(s / 86400);
  const heures = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (jours > 0) return `${jours}j ${heures}h`;
  if (heures > 0) return `${heures}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${sec}s`;
  return `${sec}s`;
}
function escHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* =====================================================================
   6bis. MISSIONS — objectifs rotatifs, pour toujours avoir un but actif
   ===================================================================== */

function sommeRareteCumulee(rareteMin) {
  const seuil = INDEX_RARETE[rareteMin];
  let total = 0;
  Object.values(BOITES_PAR_ID).forEach((box) => {
    box.items.forEach((it) => {
      if (INDEX_RARETE[it.rarete] >= seuil) total += state.collection[it.id] || 0;
    });
  });
  return total;
}

function genererMission(rang, idUnique) {
  const choix = Math.floor(Math.random() * 5);

  if (choix === 4) {
    const niveauActuel = niveauPourXp(state.stats.xp || 0);
    if (niveauActuel >= 10) {
      const cibleNiveau = niveauActuel + 2 + Math.floor(rang / 5);
      return {
        id: idUnique, type: "defi_rang", baseline: 0, cible: cibleNiveau,
        texte: `Défi de rang : atteins le niveau ${cibleNiveau}`,
        recompense: Math.round(cibleNiveau * 55),
      };
    }
    // pas encore niveau 10 : repli sur une mission classique
    const cibleOuvrir = 5 + rang * 2;
    return {
      id: idUnique, type: "ouvrir", baseline: state.stats.boitesOuvertesTotal, cible: cibleOuvrir,
      texte: `Ouvre ${cibleOuvrir} boîtes`, recompense: Math.round(cibleOuvrir * 6),
    };
  }
  if (choix === 0) {
    const cible = 5 + rang * 2;
    return {
      id: idUnique, type: "ouvrir", baseline: state.stats.boitesOuvertesTotal, cible,
      texte: `Ouvre ${cible} boîtes`, recompense: Math.round(cible * 6),
    };
  }
  if (choix === 1) {
    const cible = Math.round(400 * Math.pow(rang + 1, 1.2));
    return {
      id: idUnique, type: "or", baseline: state.stats.orGagneTotal, cible,
      texte: `Gagne ${cible} or au total`, recompense: Math.round(cible * 0.35),
    };
  }
  if (choix === 2) {
    // Vise une position dans la liste RÉELLE des raretés (quelle qu'elle soit),
    // qui progresse avec le rang sans jamais dépasser l'avant-dernière.
    const indexMax = Math.max(1, RARETES.length - 2);
    const indexCible = Math.min(1 + Math.floor(rang / 2), indexMax);
    const palier = RARETES[indexCible];
    const cible = 1 + Math.floor(rang / 3);
    return {
      id: idUnique, type: "rarete", params: { rareteCle: palier.cle }, baseline: sommeRareteCumulee(palier.cle), cible,
      texte: `Obtiens ${cible} objet${cible > 1 ? "s" : ""} ${palier.label} ou mieux`,
      recompense: Math.round(cible * (60 + rang * 15)),
    };
  }
  const ids = Object.keys(UPGRADES);
  const upgradeId = ids[Math.floor(Math.random() * ids.length)];
  let cible = Math.min(UPGRADES[upgradeId].max, state.upgrades[upgradeId] + 2 + Math.floor(rang / 4));
  if (cible <= state.upgrades[upgradeId]) {
    const cibleOuvrir = 5 + rang * 2;
    return {
      id: idUnique, type: "ouvrir", baseline: state.stats.boitesOuvertesTotal, cible: cibleOuvrir,
      texte: `Ouvre ${cibleOuvrir} boîtes`, recompense: Math.round(cibleOuvrir * 6),
    };
  }
  return {
    id: idUnique, type: "niveau", params: { upgradeId }, baseline: 0, cible,
    texte: `Atteins le niveau ${cible} en ${UPGRADES[upgradeId].nom}`, recompense: Math.round(cible * 45),
  };
}

function valeurActuelleMission(m) {
  if (m.type === "ouvrir") return state.stats.boitesOuvertesTotal - m.baseline;
  if (m.type === "or") return state.stats.orGagneTotal - m.baseline;
  if (m.type === "rarete") return sommeRareteCumulee(m.params.rareteCle) - m.baseline;
  if (m.type === "niveau") return state.upgrades[m.params.upgradeId];
  if (m.type === "defi_rang") return niveauPourXp(state.stats.xp || 0);
  return 0;
}

function assurerMissions() {
  while (state.missions.actives.length < 3) {
    state.missions.compteurId += 1;
    state.missions.actives.push(genererMission(state.missions.rang, state.missions.compteurId));
  }
}

function reclamerMission(idMission) {
  const idx = state.missions.actives.findIndex((m) => String(m.id) === String(idMission));
  if (idx < 0) return;
  const m = state.missions.actives[idx];
  if (valeurActuelleMission(m) < m.cible) return;
  state.or += m.recompense;
  state.stats.orGagneTotal += m.recompense;
  state.missions.actives.splice(idx, 1);
  state.missions.rang += 1;
  ajouterXp(15);
  assurerMissions();
  sauvegarder();
  afficherToast(`Mission accomplie : +${formaterNombre(m.recompense)} or`);
  verifierSucces();
  verifierSuccesCaches();
  render();
}

/* =====================================================================
   6ter. FUSION — donner une utilité aux objets en double
   ===================================================================== */

const FUSION_COUT = 5;

function rareteSuperieure(cle) {
  const idx = INDEX_RARETE[cle];
  return idx < RARETES.length - 1 ? RARETES[idx + 1].cle : null;
}

function itemsFusionnables() {
  const liste = [];
  Object.values(BOITES_PAR_ID).forEach((box) => {
    box.items.forEach((it) => {
      const qte = state.collection[it.id] || 0;
      if (qte >= FUSION_COUT + 1) liste.push({ box, item: it, qte });
    });
  });
  return liste;
}

function fusionner(boxId, itemId) {
  const box = BOITES_PAR_ID[boxId];
  if (!box) return;
  const item = box.items.find((i) => i.id === itemId);
  if (!item) return;
  const qte = state.collection[itemId] || 0;
  if (qte < FUSION_COUT + 1) return;

  state.collection[itemId] = qte - FUSION_COUT;
  state.stats.fusionsTotal = (state.stats.fusionsTotal || 0) + 1;
  ajouterXp(8);

  const superieure = rareteSuperieure(item.rarete);
  const itemsCible = superieure ? box.items.filter((i) => i.rarete === superieure) : [];
  let message;
  if (itemsCible.length > 0) {
    const gagne = itemsCible[Math.floor(Math.random() * itemsCible.length)];
    state.collection[gagne.id] = (state.collection[gagne.id] || 0) + 1;
    message = `Tu obtiens : ${gagne.nom} (${PALIER[gagne.rarete].label})`;
  } else {
    const gain = 40 + INDEX_RARETE[item.rarete] * 30;
    state.or += gain;
    state.stats.orGagneTotal += gain;
    message = `+${gain} or (rareté déjà maximale dans cette boîte)`;
  }
  sauvegarder();
  afficherToast("Fusion : " + message);
  verifierSucces();
  verifierSuccesCaches();
  render();
}

/* =====================================================================
   6quinquies. SUCCÈS — objectifs permanents, précis, avec de vraies
   récompenses qui s'accumulent (or immédiat + bonus de revenu à vie).
   Se reconstruit à partir du contenu chargé (raretés, DLC...), donc
   s'adapte automatiquement à ce que tu définis dans contenu.js.
   ===================================================================== */

let SUCCES = [];

function pourcentageCollectionTotal() {
  const tous = Object.values(BOITES_PAR_ID).flatMap((b) => b.items);
  if (!tous.length) return 0;
  const obtenus = tous.filter((it) => (state.collection[it.id] || 0) > 0).length;
  return (100 * obtenus) / tous.length;
}
function estBoiteComplete(box) {
  return box.items.every((it) => (state.collection[it.id] || 0) > 0);
}

function construireSucces() {
  const liste = [];

  liste.push({ id: "ouvrir_1", titre: "Premier pas", description: "Ouvre ta première boîte.", recompense: 20, condition: () => state.stats.boitesOuvertesTotal >= 1 });
  liste.push({ id: "ouvrir_25", titre: "Collectionneur débutant", description: "Ouvre 25 boîtes au total.", recompense: 60, condition: () => state.stats.boitesOuvertesTotal >= 25 });
  liste.push({ id: "ouvrir_100", titre: "Collectionneur assidu", description: "Ouvre 100 boîtes au total.", recompense: 200, condition: () => state.stats.boitesOuvertesTotal >= 100 });
  liste.push({ id: "ouvrir_500", titre: "Collectionneur acharné", description: "Ouvre 500 boîtes au total.", recompense: 800, condition: () => state.stats.boitesOuvertesTotal >= 500 });

  liste.push({ id: "or_500", titre: "Petit pécule", description: "Gagne 1 500 or au total.", recompense: 100, condition: () => state.stats.orGagneTotal >= 1500 });
  liste.push({ id: "or_5000", titre: "Bourse bien garnie", description: "Gagne 20 000 or au total.", recompense: 800, condition: () => state.stats.orGagneTotal >= 20000 });
  liste.push({ id: "or_50000", titre: "Fortune", description: "Gagne 300 000 or au total.", recompense: 6000, condition: () => state.stats.orGagneTotal >= 300000 });

  if (DLC_PACKS.length > 0) {
    liste.push({ id: "dlc_premier", titre: "Nouveaux horizons", description: "Débloque ton premier DLC.", recompense: 100, condition: () => state.dlcDebloques.length >= 1 });
    if (DLC_PACKS.length > 1) {
      liste.push({ id: "dlc_tous", titre: "Tout inclus", description: "Débloque tous les DLC disponibles.", recompense: 400, condition: () => state.dlcDebloques.length >= DLC_PACKS.length });
    }
  }

  liste.push({ id: "fusion_premiere", titre: "Alchimiste débutant", description: "Réalise ta première fusion.", recompense: 50, condition: () => (state.stats.fusionsTotal || 0) >= 1 });
  liste.push({ id: "fusion_10", titre: "Maître fusionneur", description: "Réalise 10 fusions.", recompense: 300, condition: () => (state.stats.fusionsTotal || 0) >= 10 });

  liste.push({ id: "missions_5", titre: "Suis les objectifs", description: "Réclame 5 missions.", recompense: 80, condition: () => state.missions.rang >= 5 });
  liste.push({ id: "missions_25", titre: "Chasseur d'objectifs", description: "Réclame 25 missions.", recompense: 500, condition: () => state.missions.rang >= 25 });

  liste.push({ id: "boite_complete", titre: "Set complet", description: "Complète tous les objets d'une même boîte.", recompense: 200, condition: () => Object.values(BOITES_PAR_ID).some(estBoiteComplete) });
  [25, 50, 75].forEach((seuil) => {
    liste.push({ id: "collection_" + seuil, titre: `Collection ${seuil}%`, description: `Atteins ${seuil}% de la collection totale.`, recompense: seuil * 6, condition: () => pourcentageCollectionTotal() >= seuil });
  });
  liste.push({ id: "collection_100", titre: "Collection légendaire", description: "Débloque tous les objets du jeu, toutes boîtes confondues.", recompense: 2000, condition: () => pourcentageCollectionTotal() >= 100 });

  liste.push({ id: "upgrade_max_1", titre: "Spécialiste", description: "Atteins le niveau maximum d'une amélioration.", recompense: 300, condition: () => Object.keys(UPGRADES).some((id) => state.upgrades[id] >= UPGRADES[id].max) });
  liste.push({ id: "upgrade_max_tous", titre: "Maître absolu", description: "Atteins le niveau maximum des trois améliorations.", recompense: 1200, condition: () => Object.keys(UPGRADES).every((id) => state.upgrades[id] >= UPGRADES[id].max) });

  RARETES.slice(1).forEach((r, idx) => {
    liste.push({
      id: "rarete_" + r.cle,
      titre: `Premier objet ${r.label}`,
      description: `Obtiens un objet de rareté ${r.label} ou mieux.`,
      recompense: 30 * (idx + 2) * (idx + 2),
      condition: () => sommeRareteCumulee(r.cle) >= 1,
    });
  });

  return liste;
}

function verifierSucces() {
  const nouveaux = [];
  SUCCES.forEach((s) => {
    if (state.succesDebloques.includes(s.id)) return;
    if (s.condition()) {
      state.succesDebloques.push(s.id);
      state.or += s.recompense;
      state.stats.orGagneTotal += s.recompense;
      ajouterXp(25);
      nouveaux.push(s);
    }
  });
  if (nouveaux.length) {
    sauvegarder();
    nouveaux.forEach((s, i) => {
      setTimeout(() => afficherToast(`🏆 Succès débloqué : ${s.titre} (+${formaterNombre(s.recompense)} or, +1% revenu à vie)`), i * 1700);
    });
  }
  return nouveaux;
}

/* =====================================================================
   6sexies. SUCCÈS CACHÉS DU DEV — définis dans succes_caches.js.
   Totalement invisibles avant déblocage, aucune récompense en or :
   ce sont des clins d'œil, pas des objectifs stratégiques.
   ===================================================================== */

const META_RESET_KEY = "box_collector_a_reset";

function construireEtatPourSuccesCaches() {
  const valeursCollection = Object.values(state.collection);
  let aDejaReinitialise = false;
  try { aDejaReinitialise = localStorage.getItem(META_RESET_KEY) === "1"; } catch (e) { /* stockage indisponible */ }
  return {
    or: state.or,
    orGagneTotal: state.stats.orGagneTotal,
    boitesOuvertesTotal: state.stats.boitesOuvertesTotal,
    boitesVenduesTotal: state.stats.boitesVenduesTotal || 0,
    fusionsTotal: state.stats.fusionsTotal || 0,
    cheatsUtilises: state.stats.cheatsUtilises || 0,
    exemplairesMaxUnItem: valeursCollection.length ? Math.max(...valeursCollection) : 0,
    chanceActuelle: state.chanceActuelle,
    chanceMax: chanceMax(),
    pourcentageCollection: pourcentageCollectionTotal(),
    missionsRang: state.missions.rang,
    succesDebloquesCount: state.succesDebloques.length,
    succesTotalCount: SUCCES.length,
    dlcDebloquesCount: state.dlcDebloques.length,
    dlcTotalCount: DLC_PACKS.length,
    niveau: niveauPourXp(state.stats.xp || 0),
    rang: rangPourNiveau(niveauPourXp(state.stats.xp || 0)),
    aDejaReinitialise,
  };
}

function renderSuccesCaches() {
  const zone = document.getElementById("bc-succes-caches");
  if (!zone) return;
  if (typeof SUCCES_CACHES === "undefined" || !state.succesCachesDebloques.length) {
    zone.innerHTML = `<p class="bc-succes-cache-vide">??? Certains secrets attendent d'être découverts en jouant...</p>`;
    return;
  }
  zone.innerHTML = state.succesCachesDebloques
    .map((id) => SUCCES_CACHES.find((s) => slug(s.titre) === id))
    .filter(Boolean)
    .map(
      (s) => `
      <div class="bc-succes-cache-carte">
        <p class="bc-succes-cache-titre">🕵️ ${escHtml(s.titre)}</p>
        <p class="bc-succes-cache-commentaire">${escHtml(s.commentaire)}</p>
      </div>`
    )
    .join("");
}

function verifierSuccesCaches() {
  if (typeof SUCCES_CACHES === "undefined") return;
  const etat = construireEtatPourSuccesCaches();
  const nouveaux = [];
  SUCCES_CACHES.forEach((s) => {
    const id = slug(s.titre);
    if (state.succesCachesDebloques.includes(id)) return;
    let ok = false;
    try { ok = !!s.condition(etat); } catch (e) { ok = false; }
    if (ok) { state.succesCachesDebloques.push(id); ajouterXp(40); nouveaux.push(s); }
  });
  if (nouveaux.length) {
    sauvegarder();
    renderSuccesCaches();
    nouveaux.forEach((s, i) => {
      setTimeout(() => afficherToast(`🕵️ Succès caché débloqué : ${s.titre}`), i * 1700);
    });
  }
}

/* =====================================================================
   6nonies. NIVEAU & RANG — une XP transversale, gagnée par toutes les
   activités du jeu, avec un titre qui progresse par palier.
   ===================================================================== */

const RANGS = [
  { seuil: 1, titre: "Novice", couleur: "#9b96ad", chevrons: 0, etoiles: 0, halo: false },
  { seuil: 5, titre: "Amateur", couleur: "#8bc78f", chevrons: 1, etoiles: 0, halo: false },
  { seuil: 10, titre: "Collectionneur", couleur: "#57ccf2", chevrons: 2, etoiles: 0, halo: false },
  { seuil: 15, titre: "Expert", couleur: "#7c9cf2", chevrons: 3, etoiles: 0, halo: false },
  { seuil: 20, titre: "Maître", couleur: "#b98bfc", chevrons: 4, etoiles: 0, halo: false },
  { seuil: 30, titre: "Grand Maître", couleur: "#f2994a", chevrons: 4, etoiles: 1, halo: false },
  { seuil: 40, titre: "Légende", couleur: "#d8b46a", chevrons: 4, etoiles: 2, halo: false },
  { seuil: 50, titre: "Mythique", couleur: "#eb5757", chevrons: 4, etoiles: 2, halo: true },
];

function rangObjetPourNiveau(niveau) {
  let objet = RANGS[0];
  RANGS.forEach((r) => { if (niveau >= r.seuil) objet = r; });
  return objet;
}
function rangPourNiveau(niveau) { return rangObjetPourNiveau(niveau).titre; }

/* Petite étoile à 5 branches, réutilisée dans l'emblème de rang. */
function etoilePetiteRang(cx, cy, couleur, taille) {
  const s = taille / 5;
  return `<g transform="translate(${cx},${cy}) scale(${s})"><path d="M0,-5 L1.3,-1.6 L5,-1 L2.3,1.5 L3,5 L0,3 L-3,5 L-2.3,1.5 L-5,-1 L-1.3,-1.6 Z" fill="${couleur}"/></g>`;
}

/* Emblème de rang : un anneau + des chevrons empilés + des étoiles selon le
   rang, plus un halo pour le rang le plus prestigieux. S'adapte tout seul
   si tu modifies chevrons/etoiles/halo dans RANGS ci-dessus. */
function genererEmblemeRang(rang, taille) {
  const c = rang.couleur;
  const yBase = [46, 40, 34, 28];
  let chevronsSvg = "";
  for (let i = 0; i < rang.chevrons; i++) {
    const y = yBase[i];
    chevronsSvg += `<path d="M20 ${y} L32 ${y - 7} L44 ${y}" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  let etoilesSvg = "";
  if (rang.etoiles === 1) {
    etoilesSvg += etoilePetiteRang(32, 12, c, 4.5);
  } else if (rang.etoiles >= 2) {
    etoilesSvg += etoilePetiteRang(21, 15, c, 3.5);
    etoilesSvg += etoilePetiteRang(43, 15, c, 3.5);
  }
  const halo = rang.halo
    ? `<circle cx="32" cy="32" r="30" fill="none" stroke="${c}" stroke-width="1" opacity="0.45"/><circle cx="32" cy="32" r="26" fill="${c}" opacity="0.08"/>`
    : "";
  return `<svg viewBox="0 0 64 64" width="${taille}" height="${taille}">
    ${halo}
    <circle cx="32" cy="32" r="26" fill="none" stroke="${c}" stroke-width="2.5"/>
    ${chevronsSvg}
    ${etoilesSvg}
  </svg>`;
}

let rankupTimer = null;
function afficherOverlayRang(niveau, rangObjet, libelle, dureeMs) {
  const overlay = document.getElementById("bc-rankup-overlay");
  if (!overlay) return;
  const embl = document.getElementById("bc-rankup-embleme");
  const txtNiveau = document.getElementById("bc-rankup-niveau");
  const txtTitre = document.getElementById("bc-rankup-titre");
  const txtLabel = document.getElementById("bc-rankup-label");
  embl.innerHTML = genererEmblemeRang(rangObjet, 120);
  txtNiveau.textContent = "Niveau " + niveau;
  txtTitre.textContent = rangObjet.titre;
  if (txtLabel) txtLabel.textContent = libelle;
  overlay.style.setProperty("--rankup-glow", hexRgba(rangObjet.couleur, 0.65));
  overlay.classList.add("bc-visible");
  clearTimeout(rankupTimer);
  rankupTimer = setTimeout(() => overlay.classList.remove("bc-visible"), dureeMs);
}

function afficherAnimationRankUp(niveau, rangObjet) {
  afficherOverlayRang(niveau, rangObjet, "Rang supérieur", 3200);
}

function afficherRangActuel() {
  const niveau = niveauPourXp(state.stats.xp || 0);
  afficherOverlayRang(niveau, rangObjetPourNiveau(niveau), "Ton rang actuel", 4000);
}

function ajouterXp(montant) {
  const niveauAvant = niveauPourXp(state.stats.xp || 0);
  const rangAvant = rangPourNiveau(niveauAvant);
  state.stats.xp = (state.stats.xp || 0) + montant;
  const niveauApres = niveauPourXp(state.stats.xp);
  const rangApres = rangPourNiveau(niveauApres);
  if (niveauApres > niveauAvant) {
    if (rangApres !== rangAvant) {
      const rangObjet = rangObjetPourNiveau(niveauApres);
      setTimeout(() => afficherAnimationRankUp(niveauApres, rangObjet), 300);
    } else {
      setTimeout(() => afficherToast(`🎖️ Niveau ${niveauApres} atteint — ${rangApres} !`), 300);
    }
  }
}

function renderNiveauBar() {
  const zone = document.getElementById("bc-niveau-bar");
  if (!zone) return;
  const xp = state.stats.xp || 0;
  const niveau = niveauPourXp(xp);
  const rangObjet = rangObjetPourNiveau(niveau);
  const seuilActuel = xpRequisePour(niveau);
  const seuilSuivant = xpRequisePour(niveau + 1);
  const xpDansNiveau = xp - seuilActuel;
  const xpPourNiveau = Math.max(1, seuilSuivant - seuilActuel);
  const pct = Math.min(100, Math.round((100 * xpDansNiveau) / xpPourNiveau));
  zone.innerHTML = `
    <div class="bc-niveau-row">
      <span class="bc-niveau-txt">
        <span class="bc-niveau-embleme-mini">${genererEmblemeRang(rangObjet, 24)}</span>
        Niveau ${niveau} <span class="bc-niveau-rang">· ${escHtml(rangObjet.titre)}</span>
      </span>
      <span class="bc-niveau-xp">${formaterNombre(xpDansNiveau)} / ${formaterNombre(xpPourNiveau)} XP</span>
    </div>
    <div class="bc-progress-bar" style="margin:5px 0 0;"><div class="bc-progress-fill" style="width:${pct}%; background:${rangObjet.couleur};"></div></div>`;
}

/* =====================================================================
   6undecies. PRESTIGE — repartir de zéro contre un bonus permanent,
   réservé aux joueurs ayant atteint le rang Maître (niveau 20) ou plus.
   ===================================================================== */

function effectuerPrestige() {
  if (!peutPrestiger()) return;
  const bonusActuel = Math.round((bonusPrestige() - 1) * 100);
  const bonusApres = Math.round((1 + 0.05 * ((state.prestige || 0) + 1) - 1) * 100);
  if (!window.confirm(
    `Faire un Prestige ?\n\nOr, boîtes, collection, améliorations et niveau repartent de zéro.\n` +
    `Succès, succès cachés, DLC et statistiques cumulées restent acquis.\n\n` +
    `Bonus de revenu permanent : +${bonusActuel}% → +${bonusApres}%.`
  )) return;

  const niveauAtteint = niveauPourXp(state.stats.xp || 0);
  state.stats.meilleurNiveauAtteint = Math.max(state.stats.meilleurNiveauAtteint || 0, niveauAtteint);
  state.prestige = (state.prestige || 0) + 1;

  state.or = 30;
  Object.keys(state.boites).forEach((id) => { state.boites[id] = 0; });
  state.coutsBoites = {};
  state.collection = {};
  state.upgrades = { revenu: 0, chance_max: 0, remise: 0 };
  state.chanceActuelle = 0;
  state.missions = { rang: 0, compteurId: 0, actives: [] };
  state.stats.xp = 0;

  ui.tab = "prestige";
  ui.qte = {};
  ui.ouvrirDetail = null;
  ui.probasVisible = {};
  ui.dernierLog = null;

  assurerMissions();
  sauvegarder();
  afficherToast(`Prestige ${state.prestige} ! Bonus de revenu permanent : +${bonusApres}%.`);
  render();
  renderBonusBadge();
}

function renderPrestige() {
  const niveau = niveauPourXp(state.stats.xp || 0);
  const eligible = peutPrestiger();
  const bonusActuel = Math.round((bonusPrestige() - 1) * 100);
  const bonusApres = Math.round((1 + 0.05 * ((state.prestige || 0) + 1) - 1) * 100);
  const record = state.stats.meilleurNiveauAtteint || 0;
  const recordRang = record ? rangObjetPourNiveau(record).titre : "—";

  return `
    <div class="bc-card" style="max-width:500px;">
      <p class="bc-card-nom" style="font-size:16px; margin-bottom:6px;">Prestige</p>
      <p class="bc-card-sub" style="margin-bottom:16px;">Repars de zéro pour un bonus de revenu permanent et cumulable. Réservé aux joueurs de rang Maître (niveau 20) ou plus.</p>
      <div class="bc-row" style="margin-bottom:8px;"><span class="bc-owned">Prestige actuel</span><span class="bc-price">${state.prestige || 0}</span></div>
      <div class="bc-row" style="margin-bottom:8px;"><span class="bc-owned">Bonus de revenu actuel</span><span class="bc-price">+${bonusActuel}%</span></div>
      <div class="bc-row" style="margin-bottom:16px;"><span class="bc-owned">Bonus après ce Prestige</span><span class="bc-price">+${bonusApres}%</span></div>
      <button class="bc-btn bc-btn-plein" data-action="prestige" ${eligible ? "" : "disabled"}>
        ${eligible ? "Faire un Prestige" : `Atteins le niveau 20 (actuellement ${niveau})`}
      </button>
    </div>
    <p style="font-size:12px;color:var(--bc-text-mute);margin:16px 0 6px;">
      Conservé après un Prestige : succès, succès cachés, DLC débloqués, statistiques cumulées.<br>
      Repart à zéro : or, boîtes, collection, améliorations, chance, missions, niveau.
    </p>
    <p style="font-size:12.5px;color:var(--bc-text-dim);">Record personnel : niveau ${record} (${escHtml(recordRang)})</p>`;
}

/* =====================================================================
   6septies. CHEATS DU DEV — codes secrets à saisir dans le panneau latéral
   ===================================================================== */



/* XP cumulée nécessaire pour ATTEINDRE ce niveau (niveau 1 = 0 XP).
   Courbe douce mais qui se creuse avec le niveau : régler juste "50" et
   "1.6" ci-dessous suffit à retoucher tout le rythme de progression. */
function xpRequisePour(niveau) {
  if (niveau <= 1) return 0;
  return Math.round(50 * Math.pow(niveau - 1, 1.6));
}
function niveauPourXp(xp) {
  let niveau = 1;
  while (xpRequisePour(niveau + 1) <= xp) niveau++;
  return niveau;
}

const CHEATS = {
  INFINITEGOLD: {
    description: "Argent illimité",
    appliquer: () => { state.or += 999999999; state.stats.orGagneTotal += 999999999; },
  },
  FULLCOLLECTION: {
    description: "Tous les objets débloqués",
    appliquer: () => {
      DLC_PACKS.forEach((d) => {
        if (!state.dlcDebloques.includes(d.id)) {
          d.boites.forEach((b) => { if (!(b.id in state.boites)) state.boites[b.id] = 0; });
          state.dlcDebloques.push(d.id);
        }
      });
      Object.values(BOITES_PAR_ID).forEach((box) => {
        box.items.forEach((it) => { state.collection[it.id] = Math.max(1, state.collection[it.id] || 0); });
      });
    },
  },
  INFINITEBOXES: {
    description: "Boîtes infinies",
    appliquer: () => { Object.keys(BOITES_PAR_ID).forEach((id) => { state.boites[id] = 999999; }); },
  },
  ALLDLC: {
    description: "Tous les DLC débloqués",
    appliquer: () => {
      DLC_PACKS.forEach((d) => {
        if (!state.dlcDebloques.includes(d.id)) {
          d.boites.forEach((b) => { if (!(b.id in state.boites)) state.boites[b.id] = 0; });
          state.dlcDebloques.push(d.id);
        }
      });
    },
  },
  ALLACHIEVEMENTS: {
    description: "Tous les succès débloqués",
    appliquer: () => {
      SUCCES.forEach((s) => {
        if (!state.succesDebloques.includes(s.id)) {
          state.succesDebloques.push(s.id);
          state.or += s.recompense;
          state.stats.orGagneTotal += s.recompense;
        }
      });
    },
  },
};

/* =====================================================================
   6decies. TUTORIEL DE BIENVENUE — affiché au premier lancement, ou en
   cliquant sur le bouton d'aide ("?") dans l'en-tête.
   ===================================================================== */

const TUTORIEL_SLIDES = [
  {
    titre: "Bienvenue dans Open It",
    texte: "Un jeu de collection où l'or tombe tout seul, seconde après seconde. Ouvre des boîtes, complète ta collection, et laisse-toi surprendre par ce que tu trouveras.",
  },
  {
    titre: "Boutique & Ouverture",
    texte: "Achète des boîtes dans l'onglet Boutique avec ton or. File ensuite dans l'onglet Ouvrir pour les déballer : chaque ouverture lance une petite roulette façon casino avant de révéler ton objet.",
  },
  {
    titre: "Collection & Fusion",
    texte: "L'onglet Collection garde une trace de tout ce que tu as trouvé. Trop de doublons d'un même objet ? L'onglet Fusion permet d'en sacrifier plusieurs pour tenter d'obtenir un objet plus rare.",
  },
  {
    titre: "Missions & Succès",
    texte: "Des objectifs se renouvellent sans arrêt dans l'onglet Missions. L'onglet Succès garde lui une trace permanente de tes exploits, chacun ajoutant un petit bonus de revenu qui dure pour toujours.",
  },
  {
    titre: "Niveau & Rang",
    texte: "Presque tout ce que tu fais te rapporte de l'XP. Clique n'importe quand sur la barre de niveau, en haut, pour voir ton rang en grand.",
  },
  {
    titre: "Le petit plus",
    texte: "Le panneau à droite regroupe le journal des mises à jour, des cheats secrets du dev, et des succès cachés à découvrir par toi-même. Et si besoin, tu peux exporter ta sauvegarde dans un fichier depuis ce même panneau.",
  },
];

let tutoIndex = 0;

function renderTutoriel() {
  const corps = document.getElementById("bc-tuto-corps");
  const dots = document.getElementById("bc-tuto-dots");
  const btnPrec = document.getElementById("bc-tuto-btn-prec");
  const btnSuiv = document.getElementById("bc-tuto-btn-suiv");
  if (!corps || !dots || !btnPrec || !btnSuiv) return;
  const slide = TUTORIEL_SLIDES[tutoIndex];
  corps.innerHTML = `<h2 class="bc-tuto-titre">${escHtml(slide.titre)}</h2><p class="bc-tuto-texte">${escHtml(slide.texte)}</p>`;
  dots.innerHTML = TUTORIEL_SLIDES.map((_, i) => `<span class="bc-tuto-dot ${i === tutoIndex ? "actif" : ""}"></span>`).join("");
  btnPrec.style.visibility = tutoIndex === 0 ? "hidden" : "visible";
  btnSuiv.textContent = tutoIndex === TUTORIEL_SLIDES.length - 1 ? "Commencer à jouer" : "Suivant";
}

function ouvrirTutoriel() {
  tutoIndex = 0;
  renderTutoriel();
  const overlay = document.getElementById("bc-tuto-overlay");
  if (overlay) overlay.classList.add("bc-visible");
}

function fermerTutoriel() {
  const overlay = document.getElementById("bc-tuto-overlay");
  if (overlay) overlay.classList.remove("bc-visible");
  if (!state.tutorielVu) {
    state.tutorielVu = true;
    sauvegarder();
  }
}

/* =====================================================================
   6octies. JOURNAL DES MISES À JOUR — défini dans journal.js
   ===================================================================== */

function renderActualites() {
  const zone = document.getElementById("bc-journal");
  if (!zone) return;
  if (typeof JOURNAL_MISES_A_JOUR === "undefined" || !JOURNAL_MISES_A_JOUR.length) {
    zone.innerHTML = `<p class="bc-succes-cache-vide">Aucune mise à jour pour le moment.</p>`;
    return;
  }
  zone.innerHTML = JOURNAL_MISES_A_JOUR.map(
    (post) => `
    <div class="bc-journal-entree">
      <p class="bc-journal-date">${escHtml(post.date)}</p>
      <p class="bc-journal-titre">${escHtml(post.titre)}</p>
      <p class="bc-journal-texte">${escHtml(post.texte)}</p>
    </div>`
  ).join("");
}

/* =====================================================================
   6quater. BONUS SURPRISE — un petit rendez-vous actif de temps en temps
   ===================================================================== */

let bonusActif = null;
const BONUS_DELAI_MIN_MS = 90 * 1000;
const BONUS_DELAI_MAX_MS = 180 * 1000;
const BONUS_DUREE_MS = 25 * 1000;

function planifierBonus() {
  const delai = BONUS_DELAI_MIN_MS + Math.random() * (BONUS_DELAI_MAX_MS - BONUS_DELAI_MIN_MS);
  setTimeout(() => {
    if (!bonusActif) {
      bonusActif = { valeur: Math.max(20, Math.round(revenuParSec() * 45)), expireA: Date.now() + BONUS_DUREE_MS };
      renderBonusBadge();
    }
    planifierBonus();
  }, delai);
}

function renderBonusBadge() {
  const zone = document.getElementById("bonus-zone");
  if (!zone) return;
  zone.innerHTML = bonusActif
    ? `<button class="bc-bonus-btn" data-action="reclamer-bonus">Bonus : +${formaterNombre(bonusActif.valeur)} or</button>`
    : "";
}

function reclamerBonus() {
  if (!bonusActif) return;
  state.or += bonusActif.valeur;
  state.stats.orGagneTotal += bonusActif.valeur;
  afficherToast(`Bonus récupéré : +${formaterNombre(bonusActif.valeur)} or`);
  bonusActif = null;
  renderBonusBadge();
  sauvegarder();
  renderHeader();
}

/* =====================================================================
   7. ÉTAT D'INTERFACE (non sauvegardé) + RENDU
   ===================================================================== */

const ui = { tab: "boutique", qte: {}, ouvrirDetail: null, probasVisible: {}, animEnCours: false };

const TABS = [
  { id: "boutique", label: "Boutique", render: renderBoutique },
  { id: "ouvrir", label: "Ouvrir", render: renderOuvrir },
  { id: "missions", label: "Missions", render: renderMissions },
  { id: "succes", label: "Succès", render: renderSucces },
  { id: "fusion", label: "Fusion", render: renderFusion },
  { id: "collection", label: "Collection", render: renderCollection },
  { id: "ameliorations", label: "Améliorations", render: renderAmeliorations },
  { id: "dlc", label: "DLC", render: renderDlc },
  { id: "stats", label: "Statistiques", render: renderStatistiques },
  { id: "prestige", label: "Prestige", render: renderPrestige },
];

function renderHeader() {
  document.getElementById("stat-or").textContent = formaterNombre(state.or);
  document.getElementById("stat-income").textContent = "+" + formaterNombre(revenuParSec());
  const totalBoites = Object.values(state.boites).reduce((a, b) => a + b, 0);
  document.getElementById("stat-boxes").textContent = totalBoites;
}
function renderTabs() {
  document.getElementById("bc-tabs").innerHTML = TABS.map(
    (t) => `<button class="bc-tab ${ui.tab === t.id ? "actif" : ""}" data-action="tab" data-tab="${t.id}">${t.label}</button>`
  ).join("");
}
function renderContent() {
  const tab = TABS.find((t) => t.id === ui.tab) || TABS[0];
  document.getElementById("bc-content").innerHTML = tab.render();
}
function render() {
  renderHeader();
  renderNiveauBar();
  renderTabs();
  renderContent();
}

function champQuantite(ctx, qte) {
  return `<input class="bc-step-val bc-step-input" type="number" min="1" value="${qte}" data-action="qte-saisie" data-ctx="${ctx}" aria-label="Quantité">`;
}

function renderBoutique() {
  const categories = categoriesBoites();
  if (!categories.length) return `<div class="bc-empty">Aucune boîte disponible.</div>`;

  const carteBoite = (box) => {
    const prix = prixBoite(box);
    const qte = ui.qte["shop:" + box.id] || 1;
    const owned = state.boites[box.id] || 0;
    const total = prix * qte;
    const prixHtml =
      remise() > 0
        ? `<span class="bc-price-old">${box.prix} or</span><span class="bc-price">${prix} or</span>`
        : `<span class="bc-price">${prix} or</span>`;
    return `
    <div class="bc-card" style="--bc-mat:${box.matiere}">
      <p class="bc-card-nom">${escHtml(box.nom)}</p>
      <p class="bc-card-sub">${box.items.length} objets à collectionner</p>
      <div class="bc-row">
        ${prixHtml}
        <span class="bc-owned">possédées : ${owned}</span>
      </div>
      <div class="bc-stepper">
        <button class="bc-step-btn" data-action="qte-moins" data-ctx="shop:${box.id}">−</button>
        ${champQuantite("shop:" + box.id, qte)}
        <button class="bc-step-btn" data-action="qte-plus" data-ctx="shop:${box.id}">+</button>
        <button class="bc-step-max" data-action="qte-max-achat" data-box="${box.id}">max</button>
      </div>
      <button class="bc-btn bc-btn-plein" data-action="acheter" data-box="${box.id}">Acheter (${total} or)</button>
      <button class="bc-btn bc-btn-fantome" data-action="vendre" data-box="${box.id}" ${owned < 1 ? "disabled" : ""}>Revendre (${prixRevente(box, Math.min(qte, owned), owned)} or)</button>
      <div class="bc-msg" id="msg-shop-${box.id}"></div>
    </div>`;
  };

  return categories
    .map(
      (cat) => `
    <div class="bc-categorie">
      <h3 class="bc-categorie-titre">${escHtml(cat.titre)}</h3>
      <div class="bc-grid">${cat.boites.map(carteBoite).join("")}</div>
    </div>`
    )
    .join("");
}

function renderProbas(probas) {
  return (
    `<div class="bc-probas">` +
    probas
      .map(
        ({ item, pct }) => `
      <div class="bc-proba-row">
        <span class="bc-dot" style="background:${PALIER[item.rarete].couleur}"></span>
        <span class="bc-proba-nom">${escHtml(item.nom)}</span>
        <span class="bc-proba-pct">${pct.toFixed(pct < 1 ? 2 : 1)}%</span>
      </div>`
      )
      .join("") +
    `</div>`
  );
}

function renderDetailOuverture(box) {
  const maxQte = state.boites[box.id];
  const qte = Math.min(ui.qte["open:" + box.id] || 1, maxQte);
  const probasOn = !!ui.probasVisible[box.id];
  const probas = probabilites(box, state.chanceActuelle);
  return `
  <div class="bc-detail" id="zone-ouverture">
    <div class="bc-detail-head">
      <h3>${escHtml(box.nom)}</h3>
      <button class="bc-lien" data-action="voir-probas" data-box="${box.id}">${probasOn ? "masquer" : "voir"} les probabilités</button>
    </div>
    ${probasOn ? renderProbas(probas) : ""}
    <div class="bc-stepper">
      <button class="bc-step-btn" data-action="qte-moins" data-ctx="open:${box.id}">−</button>
      ${champQuantite("open:" + box.id, qte)}
      <button class="bc-step-btn" data-action="qte-plus" data-ctx="open:${box.id}" data-max="${maxQte}">+</button>
      <button class="bc-step-max" data-action="qte-max-ouvrir" data-box="${box.id}">max (${maxQte})</button>
    </div>
    <button class="bc-btn bc-btn-plein" data-action="ouvrir" data-box="${box.id}">Ouvrir ${qte} boîte${qte > 1 ? "s" : ""}</button>
    <div id="reel-host"></div>
    <div id="anim-controles"></div>
    ${renderJournal(box.id)}
  </div>`;
}

function renderJournal(boxId) {
  if (!ui.dernierLog || ui.dernierLog.boxId !== boxId || !ui.dernierLog.items.length) return "";
  return (
    `<div class="bc-log" id="bc-log">` +
    ui.dernierLog.items
      .map((it) => {
        const palier = PALIER[it.rarete];
        return `<div class="bc-log-row"><span class="bc-dot" style="background:${palier.couleur}"></span><span>${escHtml(it.nom)}</span><span style="color:var(--bc-text-mute)">— ${palier.label}</span></div>`;
      })
      .join("") +
    `</div>`
  );
}

function renderOuvrir() {
  const categories = categoriesBoites((b) => (state.boites[b.id] || 0) > 0);
  if (!categories.length) return `<div class="bc-empty">Tu n'as aucune boîte à ouvrir. Direction la Boutique !</div>`;

  const carteBoite = (box) => `
    <div class="bc-card" style="--bc-mat:${box.matiere}">
      <p class="bc-card-nom">${escHtml(box.nom)}</p>
      <p class="bc-card-sub">Possédées : ${state.boites[box.id]}</p>
      <button class="bc-btn bc-btn-plein" data-action="choisir-ouvrir" data-box="${box.id}">Ouvrir</button>
    </div>`;

  let html = categories
    .map(
      (cat) => `
    <div class="bc-categorie">
      <h3 class="bc-categorie-titre">${escHtml(cat.titre)}</h3>
      <div class="bc-grid">${cat.boites.map(carteBoite).join("")}</div>
    </div>`
    )
    .join("");

  if (ui.ouvrirDetail && (state.boites[ui.ouvrirDetail] || 0) > 0) {
    html += renderDetailOuverture(BOITES_PAR_ID[ui.ouvrirDetail]);
  } else {
    ui.ouvrirDetail = null;
  }
  return html;
}

function renderMissions() {
  assurerMissions();
  const cartes = state.missions.actives
    .map((m) => {
      const val = Math.min(m.cible, Math.max(0, valeurActuelleMission(m)));
      const pct = Math.round((100 * val) / m.cible);
      const pret = val >= m.cible;
      return `
      <div class="bc-card">
        <p class="bc-card-nom" style="margin:0 0 8px;">${escHtml(m.texte)}</p>
        <div class="bc-progress-bar"><div class="bc-progress-fill" style="width:${pct}%; background:${pret ? "var(--bc-gold)" : "var(--bc-emerald)"}"></div></div>
        <div class="bc-row" style="margin:8px 0 10px;">
          <span class="bc-owned">${val} / ${m.cible}</span>
          <span class="bc-price">+${formaterNombre(m.recompense)} or</span>
        </div>
        <button class="bc-btn ${pret ? "bc-btn-plein" : "bc-btn-fantome"}" data-action="reclamer-mission" data-id="${m.id}" ${pret ? "" : "disabled"}>
          ${pret ? "Réclamer" : "En cours..."}
        </button>
      </div>`;
    })
    .join("");
  return (
    `<div class="bc-grid">${cartes}</div>` +
    `<p style="font-size:12px;color:var(--bc-text-mute);margin-top:14px;">Rang d'objectifs : ${state.missions.rang} — un nouvel objectif apparaît dès que tu en réclames un.</p>`
  );
}

function hexRgba(hex, alpha) {
  const h = String(hex).replace("#", "");
  const r = parseInt(h.substring(0, 2), 16), g = parseInt(h.substring(2, 4), 16), b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* Glyphes SVG minimalistes (traits, viewBox 24x24) associés à chaque
   catégorie de succès. Ajoute une entrée ici si tu crées une nouvelle
   catégorie dans construireSucces(). */
const GLYPHES_SUCCES = {
  etoile: '<path d="M12 3l2.6 5.6 6 .7-4.4 4.2 1.2 6.1L12 16.7l-5.4 2.9 1.2-6.1L3.4 9.3l6-.7L12 3z"/>',
  coffre: '<rect x="4" y="10" width="16" height="8" rx="1.2"/><path d="M4 10l1.6-4.2h12.8L20 10"/><circle cx="12" cy="14" r="1.1"/>',
  piece: '<circle cx="12" cy="12" r="7.2"/><circle cx="12" cy="12" r="3"/>',
  portail: '<polygon points="12,3.5 18.5,7.5 18.5,16.5 12,20.5 5.5,16.5 5.5,7.5"/>',
  fusion: '<circle cx="9.3" cy="12" r="5.3"/><circle cx="14.7" cy="12" r="5.3"/>',
  fanion: '<line x1="6" y1="4" x2="6" y2="20"/><path d="M6 5h12l-4 3.5L18 12H6"/>',
  checklist: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3.2h6v2.2H9z"/><path d="M8.3 12.2l2 2 4.6-5"/>',
  couronne: '<path d="M4 17h16"/><path d="M4 17l1.4-8L9 12.5l3-6.5 3 6.5 3.6-3.5L20 17"/>',
  gemme: '<path d="M6 9h12l-6 11z"/><path d="M6 9l3-5h6l3 5"/><path d="M9.3 9l2.7 11M14.7 9l-2.7 11" opacity=".5"/>',
};

function categorieSucces(s) {
  if (s.id === "collection_100") return { forme: "etoile", couleur: "#f2c14e" };
  if (s.id.startsWith("rarete_")) {
    const p = PALIER[s.id.slice("rarete_".length)];
    return { forme: "gemme", couleur: p ? p.couleur : "#d8b46a" };
  }
  if (s.id.startsWith("ouvrir_")) return { forme: "coffre", couleur: "#c9975a" };
  if (s.id.startsWith("or_")) return { forme: "piece", couleur: "#d8b46a" };
  if (s.id.startsWith("dlc_")) return { forme: "portail", couleur: "#52b993" };
  if (s.id.startsWith("fusion_")) return { forme: "fusion", couleur: "#57ccf2" };
  if (s.id.startsWith("missions_")) return { forme: "fanion", couleur: "#f2994a" };
  if (s.id.startsWith("collection_") || s.id === "boite_complete") return { forme: "checklist", couleur: "#b98bfc" };
  if (s.id.startsWith("upgrade_max")) return { forme: "couronne", couleur: "#d8b46a" };
  return { forme: "etoile", couleur: "#d8b46a" };
}

function badgeSucces(s) {
  const { forme, couleur } = categorieSucces(s);
  const glyphe = GLYPHES_SUCCES[forme] || GLYPHES_SUCCES.etoile;
  return `
    <div class="bc-succes-badge" style="background:${hexRgba(couleur, 0.2)}; border-color:${hexRgba(couleur, 0.75)};">
      <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="${couleur}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${glyphe}</svg>
    </div>`;
}

function renderSucces() {
  const total = SUCCES.length;
  const obtenus = state.succesDebloques.length;
  const pct = total ? Math.round((100 * obtenus) / total) : 0;
  const cartes = SUCCES.map((s) => {
    const debloque = state.succesDebloques.includes(s.id);
    return `
    <div class="bc-card ${debloque ? "bc-succes-ok" : "bc-succes-verrouille"}">
      <div class="bc-succes-head">
        ${badgeSucces(s)}
        <div>
          <p class="bc-card-nom" style="margin:0;">${escHtml(s.titre)}</p>
          <span class="bc-succes-etat">${debloque ? "Débloqué" : "Verrouillé"}</span>
        </div>
      </div>
      <p class="bc-card-sub" style="margin:10px 0;">${escHtml(s.description)}</p>
      <div class="bc-row">
        <span></span>
        <span class="bc-price">+${formaterNombre(s.recompense)} or · +1% revenu à vie</span>
      </div>
    </div>`;
  }).join("");
  return `
    <p style="font-size:13px;color:var(--bc-text-dim);margin:0 0 4px;">${obtenus} / ${total} succès débloqués — bonus de revenu permanent cumulé : +${obtenus}%</p>
    <div class="bc-progress-bar"><div class="bc-progress-fill" style="width:${pct}%"></div></div>
    <div class="bc-grid-succes" style="margin-top:16px;">${cartes}</div>`;
}

function renderFusion() {
  const liste = itemsFusionnables();
  const intro = `<p style="font-size:12.5px;color:var(--bc-text-dim);margin-bottom:14px;">Fusionne ${FUSION_COUT} exemplaires en trop d'un objet pour tenter d'obtenir un objet de rareté supérieure dans la même boîte (tu gardes toujours au moins un exemplaire).</p>`;
  if (!liste.length) {
    return intro + `<div class="bc-empty">Pas encore de doublons à fusionner. Reviens ici quand tu auras ${FUSION_COUT + 1}+ exemplaires d'un même objet.</div>`;
  }
  const cartes = liste
    .map(({ box, item, qte }) => {
      const palier = PALIER[item.rarete];
      const superieure = rareteSuperieure(item.rarete);
      return `
      <div class="bc-card" style="--bc-mat:${box.matiere}">
        <p class="bc-card-nom" style="border-left:3px solid ${palier.couleur}; padding-left:8px;">${escHtml(item.nom)}</p>
        <p class="bc-card-sub">${escHtml(box.nom)} · ${palier.label} · possédés : ${qte}</p>
        <button class="bc-btn bc-btn-plein" data-action="fusionner" data-box="${box.id}" data-item="${item.id}">
          Fusionner ${FUSION_COUT} → ${superieure ? PALIER[superieure].label : "or"}
        </button>
      </div>`;
    })
    .join("");
  return intro + `<div class="bc-grid">${cartes}</div>`;
}

function renderCollection() {
  const categories = categoriesBoites();
  let totalItems = 0, totalObtenus = 0, corps = "";
  categories.forEach((cat) => {
    corps += `<div class="bc-categorie"><h3 class="bc-categorie-titre">${escHtml(cat.titre)}</h3>`;
    cat.boites.forEach((box) => {
      corps += `<div class="bc-collec-groupe"><h3>${escHtml(box.nom)}</h3><div class="bc-item-grid">`;
      box.items.forEach((it) => {
        totalItems++;
        const qte = state.collection[it.id] || 0;
        if (qte > 0) totalObtenus++;
        const palier = PALIER[it.rarete];
        corps +=
          qte > 0
            ? `<div class="bc-item-chip" style="border-left:3px solid ${palier.couleur}">
                 <span class="bc-dot" style="background:${palier.couleur}"></span>
                 <p class="bc-item-chip-nom">${escHtml(it.nom)}</p>
                 <p class="bc-item-chip-qte">${palier.label} · x${qte}</p>
               </div>`
            : `<div class="bc-item-chip bc-manquant">
                 <span class="bc-dot" style="background:${palier.couleur}"></span>
                 <p class="bc-item-chip-nom">???</p>
                 <p class="bc-item-chip-qte">${palier.label}</p>
               </div>`;
      });
      corps += `</div></div>`;
    });
    corps += `</div>`;
  });
  const pct = totalItems ? Math.round((100 * totalObtenus) / totalItems) : 0;
  const header = `<p style="font-size:13px;color:var(--bc-text-dim);margin:0 0 4px;">${totalObtenus} / ${totalItems} objets obtenus</p>
    <div class="bc-progress-bar"><div class="bc-progress-fill" style="width:${pct}%"></div></div>`;
  return header + corps;
}

function renderAmeliorations() {
  return (
    `<div class="bc-grid">` +
    Object.entries(UPGRADES)
      .map(([id, u]) => {
        const niveau = state.upgrades[id];
        const auMax = niveau >= u.max;
        const cout = coutAmelioration(id, niveau);
        let extra = "";
        if (id === "chance_max") {
          const max = chanceMax();
          extra = `
            <div class="bc-slider-row">
              <input type="range" min="0" max="${max}" step="1" value="${state.chanceActuelle}" data-action="chance-slider" ${max === 0 ? "disabled" : ""}>
              <span class="bc-slider-val">${state.chanceActuelle} / ${max}</span>
            </div>
            <p class="bc-slider-note">Baisse ta Chance pour retrouver plus facilement les objets communs qui te manquent.</p>`;
        }
        return `
        <div class="bc-card bc-upgrade-card">
          <div class="bc-upgrade-top">
            <p class="bc-card-nom" style="margin:0">${u.nom}</p>
            <span class="bc-upgrade-niveau">niv. ${niveau}/${u.max}</span>
          </div>
          <p class="bc-upgrade-desc">${u.desc}</p>
          ${extra}
          <button class="bc-btn ${auMax ? "bc-btn-fantome" : "bc-btn-plein"}" data-action="ameliorer" data-id="${id}" ${auMax ? "disabled" : ""}>
            ${auMax ? "Niveau maximum" : "Améliorer (" + cout + " or)"}
          </button>
          <div class="bc-msg" id="msg-up-${id}"></div>
        </div>`;
      })
      .join("") +
    `</div>`
  );
}

function renderDlc() {
  const actifs = state.dlcDebloques.map((id) => DLC_PAR_ID[id]).filter(Boolean);
  const badges = actifs.length
    ? `<div class="bc-dlc-actifs">` + actifs.map((d) => `<span class="bc-dlc-badge">${escHtml(d.nom)}</span>`).join("") + `</div>`
    : `<p style="font-size:13px;color:var(--bc-text-mute);margin:0 0 18px;">Aucun DLC actif.</p>`;
  return `
    ${badges}
    <p style="font-size:13px;color:var(--bc-text-dim);margin:0 0 8px;">Entre un code pour débloquer un pack de boîtes.</p>
    <div class="bc-code-row">
      <input type="text" id="champ-code" placeholder="CODE2026" maxlength="20">
      <button class="bc-btn bc-btn-plein bc-btn-petit" data-action="activer-dlc">Activer</button>
    </div>
    <div class="bc-msg" id="msg-dlc"></div>`;
}

function renderStatistiques() {
  const niveau = niveauPourXp(state.stats.xp || 0);
  const rangObjet = rangObjetPourNiveau(niveau);
  const totalItems = Object.values(BOITES_PAR_ID).flatMap((b) => b.items).length;
  const obtenus = Object.values(state.collection).filter((q) => q > 0).length;
  const pctCollection = totalItems ? Math.round((100 * obtenus) / totalItems) : 0;

  const groupes = [
    {
      titre: "Progression",
      lignes: [
        ["Niveau", String(niveau)],
        ["Rang", rangObjet.titre],
        ["XP cumulée", formaterNombre(state.stats.xp || 0)],
        ["Temps de jeu total", formaterDuree(state.stats.tempsJeuSecondes || 0)],
        ["Prestiges effectués", formaterNombre(state.prestige || 0)],
        ["Meilleur niveau atteint", formaterNombre(Math.max(state.stats.meilleurNiveauAtteint || 0, niveau))],
      ],
    },
    {
      titre: "Économie",
      lignes: [
        ["Or actuel", formaterNombre(state.or)],
        ["Or total gagné", formaterNombre(state.stats.orGagneTotal)],
        ["Boîtes achetées", formaterNombre(state.stats.boitesAcheteesTotal || 0)],
        ["Boîtes vendues", formaterNombre(state.stats.boitesVenduesTotal || 0)],
      ],
    },
    {
      titre: "Collection",
      lignes: [
        ["Boîtes ouvertes", formaterNombre(state.stats.boitesOuvertesTotal)],
        ["Objets uniques obtenus", `${obtenus} / ${totalItems}`],
        ["Collection complétée", pctCollection + "%"],
        ["Fusions réalisées", formaterNombre(state.stats.fusionsTotal || 0)],
      ],
    },
    {
      titre: "Accomplissements",
      lignes: [
        ["Succès débloqués", `${state.succesDebloques.length} / ${SUCCES.length}`],
        ["Succès cachés découverts", formaterNombre(state.succesCachesDebloques.length)],
        ["Missions réclamées", formaterNombre(state.missions.rang)],
        ["DLC débloqués", `${state.dlcDebloques.length} / ${DLC_PACKS.length}`],
        ["Cheats utilisés", formaterNombre(state.stats.cheatsUtilises || 0)],
      ],
    },
  ];

  return groupes
    .map(
      (g) => `
    <div class="bc-stats-groupe">
      <h3 class="bc-categorie-titre">${escHtml(g.titre)}</h3>
      <table class="bc-stats-table">
        <tbody>
          ${g.lignes.map(([label, valeur]) => `<tr><td>${escHtml(label)}</td><td>${escHtml(valeur)}</td></tr>`).join("")}
        </tbody>
      </table>
    </div>`
    )
    .join("");
}

/* =====================================================================
   8. ANIMATION — ROULETTE DE CASINO
   ===================================================================== */

function jouerAnimationReel(box, itemGagnant, reelHost) {
  return new Promise((resolve) => {
    const poids = box.items.map((it) => poidsEffectif(box, it, state.chanceActuelle));
    const N_AVANT = 26, N_APRES = 4;
    const bobine = [];
    for (let i = 0; i < N_AVANT; i++) bobine.push(tirerPondere(box.items, poids));
    const indexGagnant = N_AVANT;
    bobine.push(itemGagnant);
    for (let i = 0; i < N_APRES; i++) bobine.push(tirerPondere(box.items, poids));

    const wrap = document.createElement("div");
    wrap.className = "bc-reel-wrap";
    const track = document.createElement("div");
    track.className = "bc-reel-track";
    bobine.forEach((it) => {
      const palier = PALIER[it.rarete];
      const div = document.createElement("div");
      div.className = "bc-reel-item";
      div.innerHTML = `<span class="bc-dot" style="background:${palier.couleur}"></span><span class="bc-reel-item-nom">${escHtml(it.nom)}</span>`;
      track.appendChild(div);
    });
    const pointeur = document.createElement("div");
    pointeur.className = "bc-reel-pointeur";
    wrap.appendChild(track);
    wrap.appendChild(pointeur);

    const resultatEl = document.createElement("div");
    resultatEl.className = "bc-resultat";

    const btnSkip = document.createElement("button");
    btnSkip.className = "bc-btn bc-btn-fantome bc-btn-petit";
    btnSkip.textContent = "Passer";
    btnSkip.style.display = "block";
    btnSkip.style.margin = "0 auto 4px";

    const conteneur = document.createElement("div");
    conteneur.appendChild(wrap);
    conteneur.appendChild(resultatEl);
    conteneur.appendChild(btnSkip);
    reelHost.innerHTML = "";
    reelHost.appendChild(conteneur);

    requestAnimationFrame(() => {
      const largeurConteneur = wrap.getBoundingClientRect().width;
      const itemEl = track.children[0];
      const itemWidth = itemEl.getBoundingClientRect().width;
      const gap = 8;
      const step = itemWidth + gap;
      const decalage = -(indexGagnant * step) + (largeurConteneur / 2 - itemWidth / 2);
      const duree = 3.1;
      track.style.transition = "none";
      track.style.transform = "translateX(0px)";
      void track.offsetHeight;
      track.style.transition = `transform ${duree}s cubic-bezier(0.12,0.85,0.15,1)`;
      requestAnimationFrame(() => { track.style.transform = `translateX(${decalage}px)`; });

      let termine = false;
      function finaliser() {
        if (termine) return;
        termine = true;
        track.style.transition = "none";
        track.style.transform = `translateX(${decalage}px)`;
        const cibleEl = track.children[indexGagnant];
        cibleEl.classList.add("bc-gagnant");
        const palierGagnant = PALIER[itemGagnant.rarete];
        const estPrestige = INDEX_RARETE[itemGagnant.rarete] >= SEUIL_PRESTIGE;
        resultatEl.innerHTML = estPrestige
          ? `<span class="bc-jackpot">✦ ${escHtml(itemGagnant.nom)} — ${palierGagnant.label} ✦</span>`
          : `<span>${escHtml(itemGagnant.nom)} — ${palierGagnant.label}</span>`;
        btnSkip.remove();
        setTimeout(resolve, estPrestige ? 700 : 250);
      }
      track.addEventListener("transitionend", finaliser, { once: true });
      btnSkip.addEventListener("click", finaliser);
      setTimeout(finaliser, duree * 1000 + 600);
    });
  });
}

async function lancerOuverture(box, qte) {
  if (ui.animEnCours || qte < 1) return;
  ui.animEnCours = true;
  ui.dernierLog = { boxId: box.id, items: [] };

  const reelHost = document.getElementById("reel-host");
  const controles = document.getElementById("anim-controles");
  let sauterReste = false;

  let btnSkipTout = null;
  if (qte > 1 && controles) {
    btnSkipTout = document.createElement("button");
    btnSkipTout.className = "bc-btn bc-btn-fantome bc-btn-petit";
    btnSkipTout.textContent = "Terminer instantanément";
    btnSkipTout.style.marginBottom = "8px";
    btnSkipTout.onclick = () => {
      sauterReste = true;
      btnSkipTout.disabled = true;
      btnSkipTout.textContent = "Ouverture en cours...";
    };
    controles.appendChild(btnSkipTout);
  }

  for (let i = 0; i < qte; i++) {
    const item = tirerItem(box, state.chanceActuelle);
    state.collection[item.id] = (state.collection[item.id] || 0) + 1;
    state.boites[box.id] -= 1;
    state.stats.boitesOuvertesTotal += 1;
    ajouterXp(2);
    ui.dernierLog.items.unshift({ nom: item.nom, rarete: item.rarete });
    if (!sauterReste && reelHost) {
      await jouerAnimationReel(box, item, reelHost);
    }
    renderHeader();
  }

  sauvegarder();
  ui.animEnCours = false;
  verifierSucces();
  verifierSuccesCaches();
  const restant = state.boites[box.id] || 0;
  ui.qte["open:" + box.id] = Math.max(1, Math.min(ui.qte["open:" + box.id] || 1, restant || 1));
  render();
  setTimeout(() => {
    const z = document.getElementById("zone-ouverture");
    if (z) z.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, 30);
}

/* =====================================================================
   9. INTERACTIONS
   ===================================================================== */

let toastTimer = null;
function afficherToast(msg) {
  const el = document.getElementById("bc-toast");
  el.textContent = msg;
  el.classList.add("bc-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("bc-visible"), 2600);
}

function redemarrerAffichageApresChangementEtat() {
  ui.tab = "boutique";
  ui.qte = {};
  ui.ouvrirDetail = null;
  ui.probasVisible = {};
  ui.dernierLog = null;
  bonusActif = null;
  assurerMissions();
  SUCCES = construireSucces();
  sauvegarder();
  render();
  renderBonusBadge();
  renderSuccesCaches();
  verifierSucces();
  verifierSuccesCaches();
}

function reinitialiserPartie() {
  if (!window.confirm("Réinitialiser toute la partie ? Cette action est irréversible.")) return;
  clearTimeout(sauvegardeEnCours);
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* stockage indisponible */ }
  try { localStorage.setItem(META_RESET_KEY, "1"); } catch (e) { /* stockage indisponible */ }
  state = nouvelEtat();
  state.derniereMaj = Date.now();
  redemarrerAffichageApresChangementEtat();
  afficherToast("Partie réinitialisée.");
}

/* =====================================================================
   SAUVEGARDE PAR FICHIER — exporter/importer sa progression
   ===================================================================== */

function exporterSauvegarde() {
  try {
    const donnees = JSON.stringify(state, null, 2);
    const blob = new Blob([donnees], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `open-it-sauvegarde-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    afficherToast("Sauvegarde exportée.");
  } catch (e) {
    afficherToast("Impossible d'exporter la sauvegarde.");
  }
}

function messageSauvegarde(texte, type) {
  const el = document.getElementById("msg-save");
  if (!el) return;
  el.textContent = texte;
  el.className = "bc-msg " + (type === "err" ? "bc-msg-err" : "bc-msg-ok");
}

function importerSauvegarde(fichier) {
  const lecteur = new FileReader();
  lecteur.onload = () => {
    let donnees;
    try {
      donnees = JSON.parse(lecteur.result);
    } catch (e) {
      messageSauvegarde("Fichier invalide (JSON illisible).", "err");
      return;
    }
    if (!donnees || typeof donnees !== "object" || typeof donnees.or !== "number" || typeof donnees.boites !== "object") {
      messageSauvegarde("Ce fichier ne ressemble pas à une sauvegarde valide.", "err");
      return;
    }
    if (!window.confirm("Importer ce fichier remplacera ta progression actuelle. Continuer ?")) return;

    const base = nouvelEtat();
    Object.keys(base).forEach((k) => { if (!(k in donnees)) donnees[k] = base[k]; });
    Object.keys(BOITES_PAR_ID).forEach((id) => { if (!(id in donnees.boites)) donnees.boites[id] = 0; });
    Object.keys(UPGRADES).forEach((id) => { if (!(id in donnees.upgrades)) donnees.upgrades[id] = 0; });
    Object.keys(base.stats).forEach((k) => { if (!(k in donnees.stats)) donnees.stats[k] = base.stats[k]; });
    if (!donnees.coutsBoites) donnees.coutsBoites = {};
    Object.keys(BOITES_PAR_ID).forEach((id) => {
      if (!(id in donnees.coutsBoites)) donnees.coutsBoites[id] = donnees.boites[id] * prixBoite(BOITES_PAR_ID[id]);
    });

    state = donnees;
    state.derniereMaj = Date.now();
    redemarrerAffichageApresChangementEtat();
    messageSauvegarde("Sauvegarde importée avec succès.", "ok");
    afficherToast("Sauvegarde importée.");
  };
  lecteur.onerror = () => messageSauvegarde("Impossible de lire ce fichier.", "err");
  lecteur.readAsText(fichier);
}

const racine = document.getElementById("bc-layout");

racine.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el || el.disabled) return;
  const action = el.dataset.action;

  if (action === "tab") {
    ui.tab = el.dataset.tab;
    render();
    return;
  }
  if (action === "qte-moins") {
    const ctx = el.dataset.ctx;
    ui.qte[ctx] = Math.max(1, (ui.qte[ctx] || 1) - 1);
    render();
    return;
  }
  if (action === "qte-plus") {
    const ctx = el.dataset.ctx;
    const max = el.dataset.max ? parseInt(el.dataset.max, 10) : 999;
    ui.qte[ctx] = Math.min(max, (ui.qte[ctx] || 1) + 1);
    render();
    return;
  }
  if (action === "qte-max-achat") {
    const box = BOITES_PAR_ID[el.dataset.box];
    const prix = prixBoite(box);
    ui.qte["shop:" + box.id] = Math.max(1, Math.floor(state.or / prix));
    render();
    return;
  }
  if (action === "qte-max-ouvrir") {
    const boxId = el.dataset.box;
    ui.qte["open:" + boxId] = state.boites[boxId] || 1;
    render();
    return;
  }
  if (action === "acheter") {
    const box = BOITES_PAR_ID[el.dataset.box];
    const qte = ui.qte["shop:" + box.id] || 1;
    const total = prixBoite(box) * qte;
    const msgEl = document.getElementById("msg-shop-" + box.id);
    if (total > state.or) {
      msgEl.textContent = "Pas assez d'or.";
      msgEl.className = "bc-msg bc-msg-err";
      return;
    }
    state.or -= total;
    state.boites[box.id] += qte;
    state.coutsBoites[box.id] = (state.coutsBoites[box.id] || 0) + total;
    state.stats.boitesAcheteesTotal = (state.stats.boitesAcheteesTotal || 0) + qte;
    sauvegarder();
    afficherToast(`+${qte} × ${box.nom}`);
    render();
    return;
  }
  if (action === "vendre") {
    const box = BOITES_PAR_ID[el.dataset.box];
    const possede = state.boites[box.id] || 0;
    const qte = Math.min(ui.qte["shop:" + box.id] || 1, possede);
    if (qte < 1) return;
    const coutTotal = state.coutsBoites[box.id] || possede * prixBoite(box);
    const remboursement = prixRevente(box, qte, possede);
    state.boites[box.id] -= qte;
    state.coutsBoites[box.id] = Math.max(0, coutTotal - (coutTotal / possede) * qte);
    state.or += remboursement;
    state.stats.boitesVenduesTotal = (state.stats.boitesVenduesTotal || 0) + qte;
    sauvegarder();
    afficherToast(`-${qte} × ${box.nom} : +${formaterNombre(remboursement)} or`);
    verifierSuccesCaches();
    render();
    return;
  }
  if (action === "choisir-ouvrir") {
    ui.ouvrirDetail = el.dataset.box;
    if (!ui.qte["open:" + ui.ouvrirDetail]) ui.qte["open:" + ui.ouvrirDetail] = 1;
    render();
    setTimeout(() => {
      const z = document.getElementById("zone-ouverture");
      if (z) z.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 30);
    return;
  }
  if (action === "voir-probas") {
    const boxId = el.dataset.box;
    ui.probasVisible[boxId] = !ui.probasVisible[boxId];
    render();
    return;
  }
  if (action === "ouvrir") {
    const box = BOITES_PAR_ID[el.dataset.box];
    const qte = Math.min(ui.qte["open:" + box.id] || 1, state.boites[box.id] || 0);
    lancerOuverture(box, qte);
    return;
  }
  if (action === "ameliorer") {
    const id = el.dataset.id;
    const u = UPGRADES[id];
    const niveau = state.upgrades[id];
    const msgEl = document.getElementById("msg-up-" + id);
    if (niveau >= u.max) return;
    const cout = coutAmelioration(id, niveau);
    if (cout > state.or) {
      msgEl.textContent = "Pas assez d'or.";
      msgEl.className = "bc-msg bc-msg-err";
      return;
    }
    state.or -= cout;
    state.upgrades[id] += 1;
    if (id === "chance_max") state.chanceActuelle = chanceMax();
    sauvegarder();
    afficherToast(u.nom + " amélioré !");
    verifierSucces();
    verifierSuccesCaches();
    render();
    return;
  }
  if (action === "reclamer-mission") {
    reclamerMission(el.dataset.id);
    return;
  }
  if (action === "fusionner") {
    fusionner(el.dataset.box, el.dataset.item);
    return;
  }
  if (action === "reclamer-bonus") {
    reclamerBonus();
    return;
  }
  if (action === "activer-dlc") {
    const champ = document.getElementById("champ-code");
    const code = (champ.value || "").trim().toUpperCase();
    const msgEl = document.getElementById("msg-dlc");
    if (!code) {
      msgEl.textContent = "Entre un code.";
      msgEl.className = "bc-msg bc-msg-err";
      return;
    }
    const dlc = DLC_PAR_CODE[code];
    if (!dlc) {
      msgEl.textContent = "Code invalide.";
      msgEl.className = "bc-msg bc-msg-err";
      return;
    }
    if (state.dlcDebloques.includes(dlc.id)) {
      msgEl.textContent = "Ce DLC est déjà activé.";
      msgEl.className = "bc-msg bc-msg-ok";
      return;
    }
    dlc.boites.forEach((b) => { if (!(b.id in state.boites)) state.boites[b.id] = 0; });
    state.dlcDebloques.push(dlc.id);
    ajouterXp(20);
    sauvegarder();
    afficherToast("DLC débloqué : " + dlc.nom);
    verifierSucces();
    verifierSuccesCaches();
    render();
    return;
  }
  if (action === "reset") {
    reinitialiserPartie();
    return;
  }
  if (action === "fermer-rankup") {
    clearTimeout(rankupTimer);
    document.getElementById("bc-rankup-overlay").classList.remove("bc-visible");
    return;
  }
  if (action === "voir-rang") {
    afficherRangActuel();
    return;
  }
  if (action === "prestige") {
    effectuerPrestige();
    return;
  }
  if (action === "ouvrir-tuto") {
    ouvrirTutoriel();
    return;
  }
  if (action === "tuto-fermer") {
    fermerTutoriel();
    return;
  }
  if (action === "tuto-suivant") {
    if (tutoIndex >= TUTORIEL_SLIDES.length - 1) { fermerTutoriel(); return; }
    tutoIndex++;
    renderTutoriel();
    return;
  }
  if (action === "tuto-precedent") {
    if (tutoIndex > 0) { tutoIndex--; renderTutoriel(); }
    return;
  }
  if (action === "exporter-save") {
    exporterSauvegarde();
    return;
  }
  if (action === "importer-save") {
    const champ = document.getElementById("fichier-import");
    if (champ) champ.click();
    return;
  }
  if (action === "activer-cheat") {
    const champ = document.getElementById("champ-cheat");
    const code = (champ.value || "").trim().toUpperCase();
    const msgEl = document.getElementById("msg-cheat");
    if (!code) {
      msgEl.textContent = "Entre un code.";
      msgEl.className = "bc-msg bc-msg-err";
      return;
    }
    const cheat = CHEATS[code];
    if (!cheat) {
      msgEl.textContent = "Code invalide.";
      msgEl.className = "bc-msg bc-msg-err";
      return;
    }
    cheat.appliquer();
    state.stats.cheatsUtilises = (state.stats.cheatsUtilises || 0) + 1;
    sauvegarder();
    afficherToast("Cheat activé : " + cheat.description);
    champ.value = "";
    msgEl.textContent = "";
    verifierSucces();
    verifierSuccesCaches();
    render();
    return;
  }
});

racine.addEventListener("change", (e) => {
  if (e.target && e.target.id === "fichier-import" && e.target.files && e.target.files[0]) {
    importerSauvegarde(e.target.files[0]);
    e.target.value = "";
  }
});

racine.addEventListener("input", (e) => {
  const el = e.target;
  if (el.dataset && el.dataset.action === "qte-saisie") {
    const valeur = parseInt(el.value, 10);
    if (Number.isFinite(valeur) && valeur >= 1) ui.qte[el.dataset.ctx] = valeur;
    return;
  }
  if (el.dataset && el.dataset.action === "chance-slider") {
    state.chanceActuelle = parseInt(el.value, 10);
    const valEl = el.parentElement.querySelector(".bc-slider-val");
    if (valEl) valEl.textContent = state.chanceActuelle + " / " + chanceMax();
    sauvegarder();
  }
});

/* Le champ de quantité ne redessine pas à chaque frappe (pour ne pas perdre
   le focus/curseur en pleine saisie) : on rafraîchit juste les totaux
   affichés (prix, revente...) une fois que l'utilisateur quitte le champ. */
racine.addEventListener("blur", (e) => {
  if (e.target && e.target.dataset && e.target.dataset.action === "qte-saisie") render();
}, true);

racine.addEventListener("keydown", (e) => {
  if (e.target && e.target.dataset && e.target.dataset.action === "qte-saisie" && e.key === "Enter") {
    e.target.blur();
  }
  if (e.target && e.target.id === "champ-code" && e.key === "Enter") {
    const btn = racine.querySelector('[data-action="activer-dlc"]');
    if (btn) btn.click();
  }
  if (e.target && e.target.id === "champ-cheat" && e.key === "Enter") {
    const btn = racine.querySelector('[data-action="activer-cheat"]');
    if (btn) btn.click();
  }
});

/* =====================================================================
   10. INITIALISATION
   ===================================================================== */

function init() {
  if (typeof NOMS_RARETES === "undefined" || typeof BOITES_DE_BASE === "undefined" || typeof DLC_PACKS === "undefined") {
    document.getElementById("bc-content").innerHTML = `
      <div style="color:var(--bc-danger); font-size:13.5px;">
        contenu.js est introuvable ou n'est pas chargé avant systeme.js dans index.html.
      </div>`;
    return;
  }
  const erreurs = preparerContenu();
  if (erreurs.length) {
    afficherErreursContenu(erreurs);
    return;
  }
  chargerEtat();
  assurerMissions();
  SUCCES = construireSucces();
  verifierSucces();
  verifierSuccesCaches();
  renderActualites();
  renderSuccesCaches();
  render();
  renderBonusBadge();
  planifierBonus();
  if (!state.tutorielVu) ouvrirTutoriel();
  setInterval(() => {
    const gain = revenuParSec();
    state.or += gain;
    state.stats.orGagneTotal += gain;
    state.stats.tempsJeuSecondes = (state.stats.tempsJeuSecondes || 0) + 1;
    if (bonusActif && Date.now() > bonusActif.expireA) {
      bonusActif = null;
      renderBonusBadge();
    }
    renderHeader();
  }, 1000);
  setInterval(sauvegarder, 8000);
  window.addEventListener("beforeunload", () => { try { sauvegarder(); } catch (e) {} });
}

init();

})();
