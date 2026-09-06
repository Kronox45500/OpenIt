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

   Deux champs optionnels contrôlent QUAND une boîte apparaît en boutique :
     niveauRequis   -> le joueur doit avoir atteint ce niveau (une fois
                       débloquée par le niveau, la boîte le reste après un
                       Prestige grâce au record de meilleur niveau atteint)
     prestigeRequis -> le joueur doit avoir fait au moins N Prestiges
                       (idéal pour des boîtes exclusives "post-Prestige")
   Sans l'un de ces champs, la boîte est disponible dès le niveau 1.
   ===================================================================== */

const BOITES_DE_BASE = [
  {
    nom: "Boîte du Vagabond",
    niveauRequis: 1,
    prix: 25,
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
    niveauRequis: 1,
    prix: 50,
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
    niveauRequis: 2,
    prix: 90,
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
    niveauRequis: 3,
    prix: 150,
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
    niveauRequis: 4,
    prix: 250,
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
    niveauRequis: 5,
    prix: 400,
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

  {
    nom: "Coffre de la Forêt Sacrée",
    niveauRequis: 6,
    prix: 650,
    matiere: "#3a7d44",
    items: [
      { nom: "Feuille dorée", rarete: "Ordinaire" },
      { nom: "Champignon lumineux", rarete: "Commun" },
      { nom: "Écorce ancienne", rarete: "Commun" },
      { nom: "Dague de ronces", rarete: "Inhabituel" },
      { nom: "Arc en bois sacré", rarete: "Inhabituel" },
      { nom: "Amulette de la forêt", rarete: "Rare" },
      { nom: "Couronne de lierre", rarete: "Épique" },
      { nom: "Cœur de l'Arbre-Monde", rarete: "Légendaire" },
    ],
  },
  {
    nom: "Coffre de la Tempête",
    niveauRequis: 7,
    prix: 1050,
    matiere: "#6b7fd6",
    items: [
      { nom: "Plume d'orage", rarete: "Commun" },
      { nom: "Éclat de foudre", rarete: "Commun" },
      { nom: "Nuage capturé", rarete: "Inhabituel" },
      { nom: "Lance de vent", rarete: "Inhabituel" },
      { nom: "Œil du cyclone", rarete: "Rare" },
      { nom: "Marteau du tonnerre", rarete: "Épique" },
      { nom: "Couronne des vents", rarete: "Légendaire" },
      { nom: "Cœur de la Tempête Éternelle", rarete: "Mythique" },
    ],
  },
  {
    nom: "Coffre du Désert Oublié",
    niveauRequis: 8,
    prix: 1700,
    matiere: "#c9a15a",
    items: [
      { nom: "Sable doré", rarete: "Commun" },
      { nom: "Cactus pétrifié", rarete: "Commun" },
      { nom: "Amulette du mirage", rarete: "Inhabituel" },
      { nom: "Cimeterre du nomade", rarete: "Rare" },
      { nom: "Scarabée de bronze", rarete: "Épique" },
      { nom: "Masque du Pharaon oublié", rarete: "Légendaire" },
      { nom: "Sceptre des sables", rarete: "Mythique" },
      { nom: "Couronne de l'Oasis Éternelle", rarete: "Antique" },
    ],
  },
  {
    nom: "Coffre de la Forge Éternelle",
    niveauRequis: 9,
    prix: 2700,
    matiere: "#a85c2e",
    items: [
      { nom: "Marteau de l'apprenti", rarete: "Inhabituel" },
      { nom: "Enclume ancestrale", rarete: "Inhabituel" },
      { nom: "Lame trempée dans la foudre", rarete: "Rare" },
      { nom: "Bouclier incandescent", rarete: "Rare" },
      { nom: "Gantelet du Maître-Forgeron", rarete: "Épique" },
      { nom: "Épée des Origines", rarete: "Légendaire" },
      { nom: "Cœur de la Forge Primordiale", rarete: "Mythique" },
      { nom: "Marteau du Premier Forgeron", rarete: "Antique" },
    ],
  },
  {
    nom: "Grimoire Arcanique",
    niveauRequis: 10,
    prix: 4300,
    matiere: "#7a4fc9",
    items: [
      { nom: "Parchemin runique", rarete: "Rare" },
      { nom: "Baguette d'ébène", rarete: "Rare" },
      { nom: "Orbe de mana pur", rarete: "Épique" },
      { nom: "Grimoire interdit", rarete: "Épique" },
      { nom: "Sceau de l'archimage", rarete: "Légendaire" },
      { nom: "Larme de magie primordiale", rarete: "Mythique" },
      { nom: "Codex des Anciens Mages", rarete: "Antique" },
      { nom: "Œil de l'Omniscience", rarete: "Divin" },
    ],
  },
  {
    nom: "Coffre du Bestiaire Légendaire",
    niveauRequis: 12,
    prix: 6900,
    matiere: "#6d7a3f",
    items: [
      { nom: "Griffe de loup-garou", rarete: "Rare" },
      { nom: "Crocs du Basilic", rarete: "Épique" },
      { nom: "Plume de Phénix juvénile", rarete: "Épique" },
      { nom: "Corne de Licorne", rarete: "Légendaire" },
      { nom: "Écaille du Serpent-Monde", rarete: "Mythique" },
      { nom: "Œil du Griffon Ancestral", rarete: "Antique" },
      { nom: "Aile de Chimère", rarete: "Antique" },
      { nom: "Cœur de la Bête Primordiale", rarete: "Divin" },
    ],
  },
  {
    nom: "Reliquaire Céleste",
    niveauRequis: 14,
    prix: 11000,
    matiere: "#a7c8e8",
    items: [
      { nom: "Plume d'ange déchu", rarete: "Épique" },
      { nom: "Fragment d'étoile filante", rarete: "Épique" },
      { nom: "Couronne des Cieux", rarete: "Légendaire" },
      { nom: "Éclat d'Aurore Éternelle", rarete: "Mythique" },
      { nom: "Clé des Sphères Célestes", rarete: "Antique" },
      { nom: "Larme d'un Dieu Oublié", rarete: "Divin" },
      { nom: "Souffle du Créateur", rarete: "Divin" },
      { nom: "Trône Céleste Miniature", rarete: "Exclusif" },
    ],
  },
  {
    nom: "Sablier de Chronos",
    niveauRequis: 16,
    prix: 17500,
    matiere: "#9b8bb4",
    items: [
      { nom: "Grain de Sable Temporel", rarete: "Légendaire" },
      { nom: "Éclat d'Instant Figé", rarete: "Légendaire" },
      { nom: "Cœur de l'Horloge Cosmique", rarete: "Mythique" },
      { nom: "Fragment de Paradoxe", rarete: "Mythique" },
      { nom: "Sable des Origines", rarete: "Antique" },
      { nom: "Souffle de l'Éternité", rarete: "Divin" },
      { nom: "Dernière Seconde du Monde", rarete: "Exclusif" },
      { nom: "Larme de Chronos", rarete: "Unique" },
    ],
  },
  {
    nom: "Calice de Sang Ancien",
    niveauRequis: 18,
    prix: 28000,
    matiere: "#8b1a2b",
    items: [
      { nom: "Dague sacrificielle", rarete: "Légendaire" },
      { nom: "Sang du Premier Vampire", rarete: "Mythique" },
      { nom: "Larme Écarlate Immortelle", rarete: "Mythique" },
      { nom: "Calice des Anciens Rois", rarete: "Antique" },
      { nom: "Couronne Écarlate", rarete: "Antique" },
      { nom: "Cœur qui ne Meurt Jamais", rarete: "Divin" },
      { nom: "Dernière Goutte du Sang Originel", rarete: "Exclusif" },
      { nom: "Essence de l'Immortalité", rarete: "Unique" },
    ],
  },
  {
    nom: "Couronne de l'Éternité",
    niveauRequis: 20,
    prix: 45000,
    matiere: "#e8d878",
    items: [
      { nom: "Fragment du Big Bang", rarete: "Mythique" },
      { nom: "Poussière d'Étoile Primordiale", rarete: "Antique" },
      { nom: "Écho du Premier Souffle", rarete: "Antique" },
      { nom: "Larme de la Création", rarete: "Divin" },
      { nom: "Sceau de l'Infini", rarete: "Divin" },
      { nom: "Dernier Vestige du Multivers", rarete: "Exclusif" },
      { nom: "Clé de la Réalité", rarete: "Exclusif" },
      { nom: "Couronne de l'Éternité Absolue", rarete: "Unique" },
    ],
  },

  {
    nom: "Coffre du Prestige",
    prestigeRequis: 1,
    prix: 2000,
    matiere: "#e8b84f",
    items: [
      { nom: "Jeton du premier Prestige", rarete: "Rare" },
      { nom: "Poussière d'ambition", rarete: "Épique" },
      { nom: "Sablier renversé", rarete: "Épique" },
      { nom: "Médaille du recommencement", rarete: "Légendaire" },
      { nom: "Flamme de la persévérance", rarete: "Mythique" },
      { nom: "Cœur du Nouveau Départ", rarete: "Antique" },
    ],
  },
  {
    nom: "Sceau du Vétéran",
    prestigeRequis: 3,
    prix: 5000,
    matiere: "#7a8b99",
    items: [
      { nom: "Insigne du vétéran", rarete: "Épique" },
      { nom: "Chaîne des cycles accomplis", rarete: "Légendaire" },
      { nom: "Poussière de trois vies", rarete: "Mythique" },
      { nom: "Sceau gravé du temps perdu", rarete: "Antique" },
      { nom: "Larme du Vétéran Éternel", rarete: "Divin" },
    ],
  },
  {
    nom: "Couronne du Prestige Absolu",
    prestigeRequis: 10,
    prix: 15000,
    matiere: "#f5e6a8",
    items: [
      { nom: "Fragment des dix vies", rarete: "Mythique" },
      { nom: "Diadème des recommencements", rarete: "Antique" },
      { nom: "Sceau de la Décennie", rarete: "Divin" },
      { nom: "Larme du Cycle Parfait", rarete: "Exclusif" },
      { nom: "Couronne de l'Ascension Absolue", rarete: "Unique" },
    ],
  },

  // Pour ajouter une nouvelle boîte de base, copie-colle un bloc
  // { nom: ..., prix: ..., matiere: ..., items: [...] } ci-dessus,
  // juste avant cette ligne, et modifie-le.
];


/* =====================================================================
   3. DLC
   =====================================================================
   "code" est ce que le joueur tape pour débloquer le DLC. Un DLC peut
   combiner librement quatre types de contenu (tous optionnels) :

   - boites   : des boîtes à ouvrir, exactement comme dans BOITES_DE_BASE.

   - themes   : des thèmes de couleurs que le joueur peut activer/désactiver
                depuis l'onglet DLC. Clés de "couleurs" disponibles :
                or, orClair, emeraude, fond, panneau, panneau2, texte, bordure
                (donne un simple code hexadécimal "#......" à chacune).

   - effets   : des bonus permanents, actifs tant que le DLC est débloqué.
                Types disponibles :
                  "bonus_revenu"     -> +X % au revenu passif (0.1 = +10%)
                  "bonus_chance_max" -> +X au plafond de Chance (nombre entier)
                  "bonus_remise"     -> +X % de remise en boutique (0.05 = +5%)

   - mecanique : active une mécanique spéciale du jeu. Seule valeur gérée
                 pour l'instant : "auto_ouverture" (ouvre automatiquement
                 une boîte possédée toutes les 15 secondes).

   Un DLC n'a besoin d'AUCUN de ces champs pour être valide à part "boites"
   (mets [] si tu ne veux pas de boîte) — regarde les exemples ci-dessous.
   ===================================================================== */

const DLC_PACKS = [
  {
    nom: "DLC I — LES TERRES GELÉES",
    code: "LTGDLC12026",
    boites: [
      {
        nom: "Coffre du Givre",
        prix: 300,
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
        prix: 550,
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
        prix: 350,
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
        prix: 600,
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
        prix: 400,
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
        prix: 700,
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
        prix: 450,
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
        prix: 800,
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
  {
    nom: "DLC V — PACK IMPÉRIAL",
    code: "IMPERIALDLC2026",
    boites: [
      {
        nom: "Trésor de l'Empereur Déchu",
        prix: 3500,
        matiere: "#c9a5f2",
        items: [
          { nom: "Pièce impériale ternie", rarete: "Commun" },
          { nom: "Sceau du gouverneur", rarete: "Inhabituel" },
          { nom: "Dague de la garde pourpre", rarete: "Rare" },
          { nom: "Médaillon du sénat", rarete: "Épique" },
          { nom: "Couronne du dernier empereur", rarete: "Légendaire" },
          { nom: "Sceptre de l'Empire Oublié", rarete: "Mythique" },
          { nom: "Manteau pourpre impérial", rarete: "Antique" },
          { nom: "Trône miniature de l'Empire", rarete: "Divin" },
        ],
      },
    ],
    themes: [
      {
        nom: "Pourpre Impérial",
        couleurs: {
          or: "#c9a5f2", orClair: "#e6d4ff", emeraude: "#8b6fd6",
          fond: "#0d0716", panneau: "#1e1230", panneau2: "#2b1a44",
          texte: "#f0e8ff", bordure: "rgba(201,165,242,0.4)",
        },
      },
    ],
    effets: [
      { type: "bonus_remise", valeur: 0.05 },
    ],
  },

  {
    nom: "DLC VI — PERSONNALISATION",
    code: "PERSODLC2026",
    boites: [],
    themes: [
      {
        nom: "Néon Cyber",
        couleurs: {
          or: "#00f0ff", orClair: "#7afcff", emeraude: "#ff2fd1",
          fond: "#05070f", panneau: "#0d1b2a", panneau2: "#132b3d",
          texte: "#e8faff", bordure: "rgba(0,240,255,0.4)",
        },
      },
      {
        nom: "Sang Écarlate",
        couleurs: {
          or: "#e0485a", orClair: "#ff8a95", emeraude: "#c93a4a",
          fond: "#120608", panneau: "#2a0f14", panneau2: "#3a141b",
          texte: "#fbe4e6", bordure: "rgba(224,72,90,0.4)",
        },
      },
      {
        nom: "Forêt Mystique",
        couleurs: {
          or: "#8fd694", orClair: "#c3f0c6", emeraude: "#4a9d6f",
          fond: "#0a140d", panneau: "#132a1c", panneau2: "#1c3a26",
          texte: "#e5f5e8", bordure: "rgba(143,214,148,0.4)",
        },
      },
    ],
    mecanique: "palette_personnalisee",
  },

  // Pour ajouter un nouveau DLC, copie-colle un bloc
  // { nom: ..., code: ..., boites: [...] } ci-dessus, juste avant
  // cette ligne, et modifie-le.
];
