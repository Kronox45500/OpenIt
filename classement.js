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

   =====================================================================
   COMPTES JOUEUR (email + mot de passe) — pour retrouver sa sauvegarde
   sur n'importe quel appareil.
   =====================================================================

   1. Dans la console Firebase, menu de gauche : Compilation >
      Authentication > "Get started" (ou "Commencer").
   2. Onglet "Sign-in method" > active "Email/Password" (juste le
      premier interrupteur, pas besoin du lien par email).
   3. C'est tout — le reste (création de compte, connexion, sauvegarde
      liée au compte) est déjà géré par le jeu.

   Règles Realtime Database COMPLÈTES et à jour (chaque joueur ne peut
   lire/écrire QUE sa propre sauvegarde, jamais celle d'un autre) — à
   copier intégralement dans Realtime Database > Règles, en remplacement
   de tes règles actuelles :
     {
       "rules": {
         "classement": { ".read": true, ".write": true },
         "comptes": {
           "$uid": {
             ".read": "auth != null && auth.uid === $uid",
             ".write": "auth != null && auth.uid === $uid"
           }
         },
         "profils": {
           ".read": true,
           "$uid": {
             ".write": "auth != null && auth.uid === $uid"
           }
         },
         "amis": {
           "$uid": {
             ".read": "auth != null && auth.uid === $uid",
             ".write": "auth != null"
           }
         },
         "demandes": {
           "$uid": {
             ".read": "auth != null && auth.uid === $uid",
             ".write": "auth != null"
           }
         },
         "cadeaux": {
           "$uid": {
             ".read": "auth != null && auth.uid === $uid",
             ".write": "auth != null"
           }
         },
         "mp": {
           "$conv": {
             ".read": "auth != null && $conv.contains(auth.uid)",
             ".write": "auth != null && $conv.contains(auth.uid)"
           }
         }
       }
     }

   ATTENTION au nœud "profils" : le ".read": true doit être posé sur
   "profils" LUI-MÊME, pas seulement sur "profils/$uid". La recherche
   d'amis lit TOUTE la liste des profils en une fois pour la filtrer —
   si le ".read" n'est autorisé qu'au niveau de chaque profil individuel,
   Firebase refuse cette lecture groupée et la recherche ne trouve
   jamais rien, silencieusement (c'est l'erreur la plus fréquente ici).

   Pourquoi ".write": "auth != null" (et pas "auth.uid === $uid") sur
   "amis" et "demandes" : accepter une demande d'ami doit écrire des
   deux côtés à la fois (ta liste ET celle de l'autre), et envoyer une
   demande écrit directement dans la boîte de réception du destinataire
   — dans les deux cas, ce n'est pas "ton" nœud à toi. Comme évoqué,
   la sécurité fine n'est pas la priorité ici (il n'y a rien de
   confidentiel à part la sauvegarde, déjà bien protégée par "comptes").
   ===================================================================== */

const CLASSEMENT_CONFIG = {
  actif: true, // passe à true une fois firebaseConfig rempli ci-dessous
  firebaseConfig: {
    apiKey: "AIzaSyC1hK_4aRZEPN5rWUZqWDDJFPQz9MBubas",
    databaseURL: "https://scoreboard-a8745-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "scoreboard-a8745",
  },
};
