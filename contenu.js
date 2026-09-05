/* =====================================================================
   CONTENU DU JEU — BOX COLLECTOR
   =====================================================================
   C'est le SEUL fichier que tu as besoin de modifier pour changer le
   contenu du jeu : les raretés, les boîtes de base, et les DLC.
   Ne touche pas à systeme.js — tout le moteur (probabilités, boutique,
   sauvegarde, animation...) s'adapte tout seul à ce que tu écris ici.

   Ce fichier doit être chargé AVANT systeme.js dans index.html.

   Si tu fais une erreur (rareté mal orthographiée, deux boîtes avec le
   même nom...), le jeu te l'affichera clairement à l'écran au lieu de
   planter silencieusement.
   ===================================================================== */


/* =====================================================================
   1. RARETÉS
   =====================================================================
   Une simple liste de noms, DANS L'ORDRE : la plus courante en haut,
   la plus rare en bas. Le poids/la probabilité de chaque rareté est
   calculé automatiquement par le jeu à partir de cet ordre.
   ===================================================================== */

const NOMS_RARETES = [
  "Ordinaire",
  "Commun",
  "Inhabituel",
  "Rare",
  "Épique",
  "Légendaire",
  "Mythique",
  "Antique",
  "Divin",
  "Exclusif",
  "Unique",
];


/* =====================================================================
   2. BOÎTES DE BASE
   =====================================================================
   Toujours disponibles, sans DLC. "rarete" doit correspondre exactement
   à un des noms de NOMS_RARETES ci-dessus.
   ===================================================================== */

const BOITES_DE_BASE = [
  {
    nom: "Boîte du Vagabond",
    prix: 15,
    matiere: "#8b6a3f",
    items: [
      { nom: "Pomme rouge", rarete: "Ordinaire" },
      { nom: "Corde enroulée", rarete: "Ordinaire" },
      { nom: "Gourde de voyage", rarete: "Commun" },
      { nom: "Boussole ancienne", rarete: "Commun" },
      { nom: "Dague de voyageur", rarete: "Inhabituel" },
      { nom: "Lanterne à huile", rarete: "Inhabituel" },
      { nom: "Cape du rôdeur", rarete: "Rare" },
      { nom: "Médaillon du Vagabond", rarete: "Épique" },
    ],
  },
  {
    nom: "Coffre du Guerrier",
    prix: 30,
    matiere: "#b7bfc9",
    items: [
      { nom: "Épée rouillée", rarete: "Ordinaire" },
      { nom: "Bouclier de bois", rarete: "Commun" },
      { nom: "Casque de soldat", rarete: "Commun" },
      { nom: "Hache de bataille", rarete: "Inhabituel" },
      { nom: "Dague noire", rarete: "Inhabituel" },
      { nom: "Épée du capitaine", rarete: "Rare" },
      { nom: "Bouclier royal", rarete: "Épique" },
      { nom: "Lame du Conquérant", rarete: "Légendaire" },
    ],
  },
  {
    nom: "Coffre du Trésor",
    prix: 50,
    matiere: "#d8b46a",
    items: [
      { nom: "Pièce d'or", rarete: "Ordinaire" },
      { nom: "Petite gemme", rarete: "Commun" },
      { nom: "Bague d'argent", rarete: "Commun" },
      { nom: "Perle blanche", rarete: "Inhabituel" },
      { nom: "Rubis royal", rarete: "Rare" },
      { nom: "Collier d'émeraudes", rarete: "Épique" },
      { nom: "Couronne perdue", rarete: "Légendaire" },
      { nom: "Cœur de diamant", rarete: "Mythique" },
    ],
  },
  {
    nom: "Coffre du Dragon",
    prix: 80,
    matiere: "#be5237",
    items: [
      { nom: "Écaille de dragon", rarete: "Commun" },
      { nom: "Dent de dragon", rarete: "Inhabituel" },
      { nom: "Griffe de dragon", rarete: "Rare" },
      { nom: "Œil de dragon", rarete: "Épique" },
      { nom: "Corne de dragon", rarete: "Épique" },
      { nom: "Œuf de dragon", rarete: "Légendaire" },
      { nom: "Cœur draconique", rarete: "Mythique" },
      { nom: "Écaille du Dragon Primordial", rarete: "Antique" },
    ],
  },
  {
    nom: "Coffre Royal",
    prix: 100,
    matiere: "#ffdc2e",
    items: [
      { nom: "Pièce royale", rarete: "Rare" },
      { nom: "Sceau royal", rarete: "Épique" },
      { nom: "Anneau du roi", rarete: "Épique" },
      { nom: "Médaillon royal", rarete: "Épique" },
      { nom: "Épée cérémonielle", rarete: "Légendaire" },
      { nom: "Couronne royale", rarete: "Légendaire" },
      { nom: "Sceptre royal", rarete: "Mythique" },
      { nom: "Trône miniature", rarete: "Antique" },
    ],
  },
  {
    nom: "Reliquaire des Anciens",
    prix: 120,
    matiere: "#593f1d",
    items: [
      { nom: "Rune ancienne", rarete: "Épique" },
      { nom: "Fragment de cristal", rarete: "Épique" },
      { nom: "Masque ancien", rarete: "Épique" },
      { nom: "Œil de l'Ancien", rarete: "Légendaire" },
      { nom: "Relique solaire", rarete: "Mythique" },
      { nom: "Sceau des Anciens", rarete: "Antique" },
      { nom: "Couronne éternelle", rarete: "Divin" },
      { nom: "Fragment du Créateur", rarete: "Unique" },
    ],
  },

  // Pour ajouter une nouvelle boîte de base, copie-colle un bloc
  // { nom: ..., prix: ..., matiere: ..., items: [...] } ci-dessus,
  // juste avant cette ligne, et modifie-le.
];


/* =====================================================================
   3. DLC
   =====================================================================
   "code" est ce que le joueur tape pour débloquer le DLC. "boites" suit
   exactement le même format que dans BOITES_DE_BASE.
   ===================================================================== */

const DLC_PACKS = [
  {
    nom: "DLC I — LES TERRES GELÉES",
    code: "LTGDLC12026",
    boites: [
      {
        nom: "Coffre du Givre",
        prix: 100,
        matiere: "#7fd8e0",
        items: [
          { nom: "Flocon de glace", rarete: "Ordinaire" },
          { nom: "Glaçon bleu", rarete: "Commun" },
          { nom: "Cristal de givre", rarete: "Commun" },
          { nom: "Dague de glace", rarete: "Inhabituel" },
          { nom: "Larme gelée", rarete: "Rare" },
          { nom: "Cœur de golem", rarete: "Épique" },
          { nom: "Couronne de glace", rarete: "Légendaire" },
          { nom: "Phénix des Glaces", rarete: "Mythique" },
        ],
      },
      {
        nom: "Reliquaire de la Reine Blanche",
        prix: 150,
        matiere: "#ffffff",
        items: [
          { nom: "Rose gelée", rarete: "Rare" },
          { nom: "Miroir de glace", rarete: "Épique" },
          { nom: "Diadème blanc", rarete: "Épique" },
          { nom: "Sceptre de givre", rarete: "Légendaire" },
          { nom: "Cœur de l'Hiver", rarete: "Mythique" },
          { nom: "Couronne de la Reine Blanche", rarete: "Antique" },
          { nom: "Larme de la Reine", rarete: "Divin" },
          { nom: "Premier Flocon", rarete: "Exclusif" },
        ],
      },
    ],
  },
  {
    nom: "DLC II — LE ROYAUME DES CENDRES",
    code: "LRDCDLC22026",
    boites: [
      {
        nom: "Coffre du Volcan",
        prix: 100,
        matiere: "#e0623f",
        items: [
          { nom: "Charbon ardent", rarete: "Ordinaire" },
          { nom: "Pierre volcanique", rarete: "Commun" },
          { nom: "Braise rouge", rarete: "Commun" },
          { nom: "Dague de lave", rarete: "Inhabituel" },
          { nom: "Hache de magma", rarete: "Rare" },
          { nom: "Cœur de salamandre", rarete: "Épique" },
          { nom: "Marteau incandescent", rarete: "Légendaire" },
          { nom: "Cœur du Volcan", rarete: "Mythique" },
        ],
      },
      {
        nom: "Coffre de l'Inferno",
        prix: 150,
        matiere: "#fe0101",
        items: [
          { nom: "Cendre éternelle", rarete: "Rare" },
          { nom: "Griffe de salamandre", rarete: "Épique" },
          { nom: "Corne de démon", rarete: "Épique" },
          { nom: "Couronne de braises", rarete: "Légendaire" },
          { nom: "Sang du Titan", rarete: "Mythique" },
          { nom: "Flamme originelle", rarete: "Antique" },
          { nom: "Cœur du Soleil Noir", rarete: "Divin" },
          { nom: "Première Flamme", rarete: "Exclusif" },
        ],
      },
    ],
  },
  {
    nom: "DLC III — LES ABYSSES",
    code: "LADLC32026",
    boites: [
      {
        nom: "Coffre des Abysses",
        prix: 100,
        matiere: "#2d3752",
        items: [
          { nom: "Coquillage noir", rarete: "Ordinaire" },
          { nom: "Perle trouble", rarete: "Commun" },
          { nom: "Étoile de mer", rarete: "Commun" },
          { nom: "Dent de requin", rarete: "Inhabituel" },
          { nom: "Perle abyssale", rarete: "Rare" },
          { nom: "Œil de Léviathan", rarete: "Épique" },
          { nom: "Trident des Profondeurs", rarete: "Légendaire" },
          { nom: "Cœur du Léviathan", rarete: "Mythique" },
        ],
      },
      {
        nom: "Coffre de la Cité Engloutie",
        prix: 150,
        matiere: "#555baf",
        items: [
          { nom: "Pièce noyée", rarete: "Rare" },
          { nom: "Clé rouillée", rarete: "Épique" },
          { nom: "Masque du Roi Noyé", rarete: "Épique" },
          { nom: "Couronne engloutie", rarete: "Légendaire" },
          { nom: "Trésor d'Atlantis", rarete: "Mythique" },
          { nom: "Sceau du Royaume Noyé", rarete: "Antique" },
          { nom: "Larme de l'Océan", rarete: "Divin" },
          { nom: "Perle du Premier Océan", rarete: "Exclusif" },
        ],
      },
    ],
  },
  {
    nom: "DLC IV — LES OMBRES",
    code: "LODLC42026",
    boites: [
      {
        nom: "Coffre des Ombres",
        prix: 100,
        matiere: "#363636",
        items: [
          { nom: "Bougie noire", rarete: "Ordinaire" },
          { nom: "Plume noire", rarete: "Commun" },
          { nom: "Masque brisé", rarete: "Commun" },
          { nom: "Dague spectrale", rarete: "Inhabituel" },
          { nom: "Clé des Ombres", rarete: "Rare" },
          { nom: "Œil fantôme", rarete: "Épique" },
          { nom: "Lame du Sans-Visage", rarete: "Légendaire" },
          { nom: "Âme capturée", rarete: "Mythique" },
        ],
      },
      {
        nom: "Coffre du Néant",
        prix: 150,
        matiere: "#000000",
        items: [
          { nom: "Fragment noir", rarete: "Rare" },
          { nom: "Rune du Néant", rarete: "Épique" },
          { nom: "Œil du Vide", rarete: "Épique" },
          { nom: "Main du Néant", rarete: "Légendaire" },
          { nom: "Cœur du Vide", rarete: "Mythique" },
          { nom: "Couronne du Néant", rarete: "Antique" },
          { nom: "Fragment d'Abîme", rarete: "Divin" },
          { nom: "L'Ombre Première", rarete: "Exclusif" },
        ],
      },
    ],
  },

  // Pour ajouter un nouveau DLC, copie-colle un bloc
  // { nom: ..., code: ..., boites: [...] } ci-dessus, juste avant
  // cette ligne, et modifie-le.
];
