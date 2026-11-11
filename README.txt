RELIEF — STUDIO WEB (site statique, GitHub Pages)
==================================================

Nouveau site 3D, refait de zéro. Aucun PHP, aucune base de données.

FICHIERS
--------
index.html              Page d'accueil : la montagne se construit, puis le défilement fait monter la caméra jusqu'au sommet
mentions-legales.html   Mentions légales
confidentialite.html    Confidentialité
404.html                Page introuvable
site-config.js          E-mail, réseaux, formulaire Formspree (le seul fichier à toucher pour les coordonnées)
assets/relief.css       Tout le style (couleurs dans :root en haut du fichier)
assets/relief-ui.js     Menu, ordinateurs 3D qui s'ouvrent, cartes inclinables, formulaire
assets/relief-3d.min.js Paysage alpin 3D du hero (three.js), version compilée
src/relief-3d.js        Source lisible de la scène 3D
assets/work/            Captures des sites réalisés (1280×800, .webp)
assets/fonts/           Polices Bricolage Grotesque + Inter, hébergées sur le site

AJOUTER UNE RÉALISATION
-----------------------
1. Mettre la capture dans assets/work/nom.webp (1280×800).
2. Dans index.html, section RÉALISATIONS, copier un bloc <article class="climb"> et changer
   le numéro du sommet, le nom, la catégorie, le texte, les liens et l'image.
   (tytoo.ch attend encore sa capture : remplacer le bloc .shot-placeholder par une <img>.)

RECOMPILER LA SCÈNE 3D (seulement si src/relief-3d.js change)
------------------------------------------------------------
  npm i three@0.169.0 esbuild
  npx esbuild src/relief-3d.js --bundle --minify --format=esm --target=es2020 \
      --legal-comments=eof --outfile=assets/relief-3d.min.js

PHOTO DE BORIS
----------------------
Mettre assets/boris-portrait.webp (600×750) et remplacer le bloc .member-mono
dans la section STUDIO par une <img>, comme pour Darko.

MISE EN LIGNE
-------------
GitHub Pages : Settings > Pages > branche main, dossier racine.
