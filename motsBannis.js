/* =====================================================================
   MOTS BANNIS — OPEN IT
   =====================================================================
   Liste des mots interdits dans le chat du jeu.

   Si un message envoyé contient l'un de ces mots — n'importe où dans le
   texte, sans tenir compte des majuscules/minuscules — le message ENTIER
   est remplacé par des dièses (#) avant d'être envoyé aux autres
   joueurs. Exemple : si "vilain" est banni, "tu es un vilain garçon"
   devient "#######################".

   La vérification se fait par sous-chaîne (pas par mot isolé) : bannir
   "abc" bloquera aussi "abcdef". C'est volontairement large pour rester
   simple à gérer, au prix de quelques faux positifs possibles.

   Ajoute ou retire des mots ci-dessous, un par ligne, entre guillemets.
   ===================================================================== */

const MOTS_BANNIS = [
  // ─────────────────────────────────────────────
  // GROSSIÈRETÉS / INSULTES COURANTES
  // ─────────────────────────────────────────────
  "merde",
  "m3rde",
  "merdee",
  "merdes",
  "merd3",
  "merdasse",
  "merdique",
  "merdiques",
  "merdier",

  "putain",
  "put1",
  "putain",
  "putin",
  "putainnn",
  "putains",
  "putasse",
  "putassier",
  "putassière",

  "bordel",
  "bord3l",
  "bordelle",
  "bordels",

  "con",
  "connard",
  "connard",
  "connards",
  "connasse",
  "connasses",
  "conne",
  "connes",
  "connerie",
  "conneries",
  "connard",
  "connardd",

  "abruti",
  "abrutie",
  "abrutis",
  "abruties",
  "abrutissement",

  "idiot",
  "idiote",
  "idiots",
  "idiotes",

  "imbécile",
  "imbecile",
  "imbéciles",
  "imbeciles",

  "crétin",
  "cretin",
  "crétine",
  "cretine",
  "crétins",
  "cretins",

  "débile",
  "debile",
  "débiles",
  "debiles",

  "stupide",
  "stupides",
  "stupidité",
  "stupidite",

  "bouffon",
  "bouffonne",
  "bouffons",
  "bouffonnes",

  "clown",
  "clowns",

  "abruti",
  "gogol",
  "gogole",
  "gogols",
  "demeuré",
  "demeure",
  "demeures",
  "attardé",
  "attardee",
  "attardés",
  "attardées",

  // ─────────────────────────────────────────────
  // INSULTES / MÉPRIS
  // ─────────────────────────────────────────────
  "enfoiré",
  "enfoire",
  "enfoirée",
  "enfoiree",
  "enfoirés",
  "enfoires",

  "salaud",
  "salaude",
  "salauds",
  "salopes",
  "salope",
  "salop",
  "saloperie",
  "saloperies",

  "ordure",
  "ordures",

  "pourriture",
  "pourritures",

  "racaille",
  "racailles",

  "vaurien",
  "vaurienne",
  "vauriens",

  "crevard",
  "crevarde",
  "crevards",

  "parasite",
  "parasites",

  "minable",
  "minables",

  "loser",
  "losers",

  "raté",
  "rate",
  "ratée",
  "ratee",
  "ratés",
  "rates",

  "boulet",
  "boulets",

  "tocard",
  "tocarde",
  "tocards",

  "plouc",
  "ploucs",

  "péquenaud",
  "pequenaud",
  "péquenaude",
  "pequenaude",

  "abrutissement",
  "nullard",
  "nullarde",
  "nullards",

  "minable",
  "minables",

  // ─────────────────────────────────────────────
  // INSULTES SEXUELLES / GROSSIÈRES
  // ─────────────────────────────────────────────
  "pute",
  "putes",
  "pute",
  "put1",
  "p.u.t.e",

  "salope",
  "salopes",

  "pétasse",
  "petasse",
  "pétasses",
  "petasses",

  "traînée",
  "trainee",
  "traînées",
  "trainees",

  "garce",
  "garces",

  "catin",
  "catins",

  "prostituée",
  "prostituee",
  "prostituées",
  "prostituees",

  "enculé",
  "encule",
  "enculée",
  "enculee",
  "enculés",
  "encules",
  "enculer",
  "enculeur",
  "enculeurs",

  "nique",
  "niquer",
  "niqué",
  "niquee",
  "niqués",
  "niquer",
  "niquée",
  "niquées",

  "nik",
  "niq",
  "niqu",
  "nique",

  "n1que",
  "n1k",
  "n!que",

  "fuck",
  "fucker",
  "fucking",
  "fck",
  "fuk",
  "f*ck",

  "shit",
  "sh1t",
  "sh!t",
  "s.hit",

  "bitch",
  "b1tch",
  "b!tch",

  "bastard",
  "bastards",

  // ─────────────────────────────────────────────
  // INSULTES CORPORELLES / VULGAIRES
  // ─────────────────────────────────────────────
  "bite",
  "bites",
  "biite",
  "b1te",
  "b!te",

  "couille",
  "couilles",
  "couy",
  "couilles",

  "couillon",
  "couillonne",
  "couillons",
  "couillonnes",

  "testicule",
  "testicules",

  "cul",
  "culs",
  "c.ul",
  "cull",

  "trouduc",
  "trou du cul",
  "trouducs",
  "trou ducul",

  "branleur",
  "branleuse",
  "branleurs",
  "branleuses",

  "branler",
  "branlette",

  "masturbation",
  "masturber",

  "bite",
  "zob",
  "zobs",
  "zgeg",
  "zézette",
  "zezette",

  "chatte",
  "chattes",

  "nichon",
  "nichons",

  "seins",
  "sein",

  // ─────────────────────────────────────────────
  // EXPRESSIONS GROSSIÈRES
  // ─────────────────────────────────────────────
  "va te faire foutre",
  "va te faire",
  "ferme ta gueule",
  "ferme ta bouche",
  "ta gueule",
  "tg",
  "ftg",
  "nique ta mère",
  "nique ta mere",
  "ntm",
  "ntm",
  "va niquer",
  "va niquer ta mère",
  "va niquer ta mere",
  "je t'emmerde",
  "je t'emmerdes",
  "emmerde",
  "emmerder",
  "emmerdes",
  "emmerdeur",
  "emmerdeuse",

  "fait chier",
  "faire chier",
  "fais chier",
  "fais chier",
  "ça fait chier",
  "ca fait chier",

  "casse toi",
  "casse-toi",
  "barre toi",
  "barre-toi",
  "dégage",
  "degage",
  "dégages",
  "degages",

  "va crever",
  "crève",
  "creve",
  "crèves",
  "creves",

  "ta mère",
  "ta mere",
  "ta daronne",
  "daronne",
  "ta race",

  // ─────────────────────────────────────────────
  // VARIANTES INTERNET
  // ─────────────────────────────────────────────
  "wtf",
  "stfu",
  "gtfo",
  "lmfao",
  "lmao",

  "fk",
  "fck",
  "fuk",
  "fcking",

  "omfg",
  "ffs",

  "kys",
];