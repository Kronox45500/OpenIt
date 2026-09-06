/* =====================================================================
   SUCCÈS CACHÉS DU DEV — OPEN IT
   =====================================================================
   Des succès secrets, un peu bizarres, qu'on ne voit JAMAIS avant de les
   avoir obtenus (contrairement à l'onglet "Succès" normal). Une fois
   débloqués, ils s'affichent avec ton petit commentaire de dev.

   Chaque entrée :
     titre       : révélé seulement une fois débloqué
     commentaire : ton petit mot de dev, affiché juste en dessous
     condition   : une fonction (etat) => true/false qui dit si le succès
                   est débloqué. Elle reçoit un objet "etat" avec tout ce
                   qu'il faut pour écrire tes propres conditions :

     etat.or                    — or actuel du joueur
     etat.orGagneTotal          — or gagné cumulé depuis le début
     etat.boitesOuvertesTotal   — nombre de boîtes ouvertes au total
     etat.boitesVenduesTotal    — nombre de boîtes revendues au total
     etat.fusionsTotal          — nombre de fusions réalisées
     etat.cheatsUtilises        — nombre de codes de triche activés
     etat.exemplairesMaxUnItem  — le plus grand nombre de copies détenu
                                   d'un seul et même objet
     etat.chanceActuelle        — curseur de Chance actuellement réglé
     etat.chanceMax             — plafond de Chance débloqué
     etat.pourcentageCollection — % de la collection totale complétée (0-100)
     etat.missionsRang          — nombre de missions déjà réclamées
     etat.succesDebloquesCount  — nombre de succès (normaux) débloqués
     etat.succesTotalCount      — nombre total de succès (normaux) existants
     etat.dlcDebloquesCount     — nombre de DLC débloqués
     etat.dlcTotalCount         — nombre total de DLC disponibles
     etat.aDejaReinitialise     — true si la partie a déjà été réinitialisée

   Pas de récompense en or sur ces succès-là : ce sont juste des clins
   d'œil. Ajoute les tiens librement, dans le même format.
   ===================================================================== */

const SUCCES_CACHES = [
  {
    titre: "Petit vendeur",
    commentaire: "Pourquoi en acheter autant pour les revendre moins cher...",
    condition: (etat) => etat.boitesVenduesTotal >= 100,
  },
  {
    titre: "Écureuil compulsif",
    commentaire: "Pense au bouton fusionner.",
    condition: (etat) => etat.exemplairesMaxUnItem >= 100,
  },
  {
    titre: "Minimaliste",
    commentaire: "Un plafond de chance bien haut... et tu ne t'en sers pas ?",
    condition: (etat) => etat.chanceMax >= 10 && etat.chanceActuelle === 0,
  },
  {
    titre: "Table rase",
    commentaire: "Tout ça pour recommencer ?",
    condition: (etat) => etat.aDejaReinitialise,
  },
  {
    titre: "Radin",
    commentaire: "Tu comptes ouvrir une boîte un jour ?",
    condition: (etat) => etat.or >= 15000 && etat.boitesOuvertesTotal === 0,
  },
  {
    titre: "Tricheur assumé",
    commentaire: "Le jeu ne t'en voudra pas... officiellement.",
    condition: (etat) => etat.cheatsUtilises >= 1,
  },
  {
    titre: "Rien d'autre à faire",
    commentaire: "Sérieusement, va prendre l'air.",
    condition: (etat) => etat.pourcentageCollection >= 100 && etat.succesDebloquesCount >= etat.succesTotalCount,
  },
  {
    titre: "Collectionneur honnête",
    commentaire: "Tout débloqué sans un seul code triche. Respect.",
    condition: (etat) => etat.dlcTotalCount > 0 && etat.dlcDebloquesCount >= etat.dlcTotalCount && etat.cheatsUtilises === 0,
  },

  // Ajoute les tiens ici, sur le même modèle.
];
