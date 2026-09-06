/* =====================================================================
   CLASSEMENT MONDIAL — OPEN IT
   =====================================================================
   Dreamlo a été abandonné : son serveur répond explicitement
   "ERROR:SSL" dès qu'on l'appelle en HTTPS — il ne supporte tout
   simplement pas le HTTPS de bout en bout, et ne peut donc pas
   fonctionner depuis un site en HTTPS comme GitHub Pages. Ce n'était
   pas un problème de configuration, mais une limite du service lui-même.

   À la place : Firebase (Google) — gratuit, HTTPS natif, fiable.

   MISE EN PLACE (5 minutes, une seule fois) :

   1. Va sur https://console.firebase.google.com et connecte-toi avec
      un compte Google (gratuit).
   2. Clique "Ajouter un projet", donne-lui un nom, termine la création
      (tu peux désactiver Google Analytics, inutile ici).
   3. Dans le menu de gauche : Compilation > Realtime Database >
      "Créer une base de données". Choisis une région, puis démarre
      en "mode test" (accès libre en lecture/écriture pendant 30 jours
      — largement suffisant, et tu peux resserrer les règles plus tard,
      voir la note en bas de ce fichier).
   4. Toujours dans le menu de gauche, clique sur l'icône ⚙️ à côté de
      "Aperçu du projet" > "Paramètres du projet". Dans l'onglet
      "Général", descends jusqu'à "Vos applications", clique sur
      l'icône Web "</>", donne un nom, et Firebase t'affiche un objet
      "firebaseConfig" à copier.
   5. Colle cet objet ci-dessous, à la place de FIREBASE_CONFIG, et
      passe "actif" à true.

   Rien de sensible n'est exposé : la config Firebase d'un site web est
   toujours publique par nature (elle doit l'être pour fonctionner dans
   le navigateur) — la sécurité se règle via les "règles" de la base de
   données (voir le mode test ci-dessus), pas via ces identifiants.

   Pour resserrer l'accès plus tard (facultatif) : dans Realtime
   Database > Règles, remplace par
     { "rules": { "classement": { ".read": true, ".write": true } } }
   pour limiter l'accès libre au seul nœud "classement" plutôt qu'à
   toute la base.
   ===================================================================== */

const CLASSEMENT_CONFIG = {
  actif: GPUExternalTexture, // passe à true une fois firebaseConfig rempli ci-dessous
  firebaseConfig: {
    apiKey: "AIzaSyC1hK_4aRZEPN5rWUZqWDDJFPQz9MBubas",
    databaseURL: "https://scoreboard-a8745-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "scoreboard-a8745",
  },
};
