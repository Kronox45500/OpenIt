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
    poids: Math.max(1, Math.round(1000 / Math.pow(3, i))),
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
    coutBase: 20, croissance: 1.35, max: 25, effet: (n) => 1 + n * 5,
  },
  chance_max: {
    nom: "Plafond de chance", desc: "Augmente le plafond réglable de ta Chance (voir le curseur ci-dessous).",
    coutBase: 60, croissance: 1.5, max: 15, effet: (n) => n,
  },
  remise: {
    nom: "Négociation", desc: "Réduit le prix des boîtes en boutique (-4%/niveau, max 40%).",
    coutBase: 40, croissance: 1.4, max: 10, effet: (n) => Math.min(n * 0.04, 0.4),
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
    stats: { boitesOuvertesTotal: 0, orGagneTotal: 0 },
    missions: { rang: 0, compteurId: 0, actives: [] },
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
      if (!data.coutsBoites) data.coutsBoites = {};
      Object.keys(BOITES_PAR_ID).forEach((id) => {
        if (!(id in data.coutsBoites)) data.coutsBoites[id] = data.boites[id] * prixBoite(BOITES_PAR_ID[id]);
      });
      Object.keys(UPGRADES).forEach((id) => { if (!(id in data.upgrades)) data.upgrades[id] = 0; });
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

function revenuParSec() { return UPGRADES.revenu.effet(state.upgrades.revenu); }
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
function formaterNombre(n) { return Math.round(n).toLocaleString("fr-FR"); }
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
  const choix = Math.floor(Math.random() * 4);

  if (choix === 0) {
    const cible = 5 + rang * 2;
    return {
      id: idUnique, type: "ouvrir", baseline: state.stats.boitesOuvertesTotal, cible,
      texte: `Ouvre ${cible} boîtes`, recompense: Math.round(cible * 6),
    };
  }
  if (choix === 1) {
    const cible = 150 * (rang + 1);
    return {
      id: idUnique, type: "or", baseline: state.stats.orGagneTotal, cible,
      texte: `Gagne ${cible} or au total`, recompense: Math.round(cible * 0.35),
    };
  }
  if (choix === 2) {
    const paliers = ["peu_rare", "peu_rare", "rare", "rare", "tres_rare", "tres_rare", "legendaire"];
    const rareteCle = paliers[Math.min(rang, paliers.length - 1)];
    const cible = 1 + Math.floor(rang / 3);
    return {
      id: idUnique, type: "rarete", params: { rareteCle }, baseline: sommeRareteCumulee(rareteCle), cible,
      texte: `Obtiens ${cible} objet${cible > 1 ? "s" : ""} ${PALIER[rareteCle].label} ou mieux`,
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
  assurerMissions();
  sauvegarder();
  afficherToast(`Mission accomplie : +${formaterNombre(m.recompense)} or`);
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
  render();
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
  { id: "fusion", label: "Fusion", render: renderFusion },
  { id: "collection", label: "Collection", render: renderCollection },
  { id: "ameliorations", label: "Améliorations", render: renderAmeliorations },
  { id: "dlc", label: "DLC", render: renderDlc },
];

function renderHeader() {
  document.getElementById("stat-or").textContent = formaterNombre(state.or);
  document.getElementById("stat-income").textContent = "+" + formaterNombre(revenuParSec());
  const totalBoites = Object.values(state.boites).reduce((a, b) => a + b, 0);
  document.getElementById("stat-boxes").textContent = totalBoites;
}

function reinitialiserPartie() {
  if (!window.confirm("Réinitialiser toute la partie ? Cette action est irréversible.")) return;
  clearTimeout(sauvegardeEnCours);
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* stockage indisponible */ }
  state = nouvelEtat();
  state.derniereMaj = Date.now();
  ui.tab = "boutique";
  ui.qte = {};
  ui.ouvrirDetail = null;
  ui.probasVisible = {};
  ui.dernierLog = null;
  bonusActif = null;
  assurerMissions();
  sauvegarder();
  render();
  renderBonusBadge();
  afficherToast("Partie réinitialisée.");
}

function champQuantite(ctx, qte) {
  return `<input class="bc-step-val bc-step-input" type="number" min="1" value="${qte}" data-action="qte-saisie" data-ctx="${ctx}" aria-label="Quantité">`;
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
  renderTabs();
  renderContent();
}

function renderBoutique() {
  const dispo = boitesDisponibles();
  if (!dispo.length) return `<div class="bc-empty">Aucune boîte disponible.</div>`;
  return (
    `<div class="bc-grid">` +
    dispo
      .map((box) => {
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
      })
      .join("") +
    `</div>`
  );
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
  const possede = boitesDisponibles().filter((b) => (state.boites[b.id] || 0) > 0);
  if (!possede.length) return `<div class="bc-empty">Tu n'as aucune boîte à ouvrir. Direction la Boutique !</div>`;
  let html =
    `<div class="bc-grid">` +
    possede
      .map(
        (box) => `
      <div class="bc-card" style="--bc-mat:${box.matiere}">
        <p class="bc-card-nom">${escHtml(box.nom)}</p>
        <p class="bc-card-sub">Possédées : ${state.boites[box.id]}</p>
        <button class="bc-btn bc-btn-plein" data-action="choisir-ouvrir" data-box="${box.id}">Ouvrir</button>
      </div>`
      )
      .join("") +
    `</div>`;
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
  const groupes = [BOITES_DE_BASE];
  DLC_PACKS.forEach((dlc) => { if (state.dlcDebloques.includes(dlc.id)) groupes.push(dlc.boites); });
  let totalItems = 0, totalObtenus = 0, corps = "";
  groupes.forEach((liste) => {
    liste.forEach((box) => {
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
    ui.dernierLog.items.unshift({ nom: item.nom, rarete: item.rarete });
    if (!sauterReste && reelHost) {
      await jouerAnimationReel(box, item, reelHost);
    }
    renderHeader();
  }

  sauvegarder();
  ui.animEnCours = false;
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

const racine = document.getElementById("bc-root");

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
    sauvegarder();
    afficherToast(`-${qte} × ${box.nom} : +${formaterNombre(remboursement)} or`);
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
    sauvegarder();
    afficherToast(`+${qte} × ${box.nom}`);
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
    render();
    return;
  }
  if (action === "reset") {
    reinitialiserPartie();
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
    sauvegarder();
    afficherToast("DLC débloqué : " + dlc.nom);
    render();
    return;
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

racine.addEventListener("keydown", (e) => {
  if (e.target && e.target.dataset && e.target.dataset.action === "qte-saisie" && e.key === "Enter") {
    e.target.blur();
  }
  if (e.target && e.target.id === "champ-code" && e.key === "Enter") {
    const btn = racine.querySelector('[data-action="activer-dlc"]');
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
  render();
  renderBonusBadge();
  planifierBonus();
  setInterval(() => {
    const gain = revenuParSec();
    state.or += gain;
    state.stats.orGagneTotal += gain;
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
