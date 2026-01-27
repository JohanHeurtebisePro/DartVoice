# DartVoice - Documentation Complète

![Version](https://img.shields.io/badge/version-8.3-blue.svg?style=flat-square)
![Tech](https://img.shields.io/badge/tech-VanillaJS%20|%20HTML5%20|%20CSS3-yellow.svg?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-lightgrey.svg?style=flat-square)
![Status](https://img.shields.io/badge/status-Production--Ready-green.svg?style=flat-square)

**DartVoice Ultimate Pro** est une application web progressive (PWA) de scoring pour fléchettes, conçue pour être pilotée entièrement par la voix. Elle combine une interface moderne "Dark Mode", un moteur de reconnaissance vocale tolérant aux erreurs, et des outils d'analyse statistique avancés (Heatmap, PDF).

L'application fonctionne entièrement côté client (**Client-Side**), sans backend serveur, garantissant une latence minimale et une confidentialité totale des données.

---

## 📑 Table des Matières

1. [Vue d'ensemble](#-vue-densemble)
2. [Architecture & Technique](#-architecture--technique)
3. [Fonctionnalités Détaillées](#-fonctionnalités-détaillées)
4. [Modes de Jeu](#-modes-de-jeu)
5. [Installation et Démarrage](#-installation-et-démarrage)
6. [Guide des Commandes Vocales](#-guide-des-commandes-vocales)
7. [Structure du Projet](#-structure-du-projet)
8. [Paramètres & Personnalisation](#-paramètres--personnalisation)

---

## 🔭 Vue d'ensemble

L'objectif de DartVoice est de fluidifier les matchs en supprimant la saisie manuelle.

- **Zéro Latence Serveur** : Tout le traitement (voix, logique, graphique) se fait en local via JavaScript.
- **Interface Réactive** : Design adaptatif (Mobile/Tablette/Desktop) basé sur CSS Grid.
- **Persistance** : Gestion d'état complexe via un objet centralisé.

---

## 🏗 Architecture & Technique

Le projet repose sur une architecture monolithique optimisée pour le déploiement statique.

### 1. Moteur de Reconnaissance Vocale (V8 Engine)

L'application utilise l'API **Web Speech** (`webkitSpeechRecognition`) avec une couche de logique propriétaire pour améliorer la précision :

- **Tolérance Phonétique** : Un dictionnaire (`ENHANCED_VOICE_MAP`) traduit les approximations (ex: "vint", "vain" → 20).
- **Regex Hybrides (`ULTRA_PATTERNS`)** : Utilisation d'expressions régulières pour détecter les annonces complexes (ex: "Triple 20" ou "T20").
- **Extraction Intelligente** : Si le pattern strict échoue, l'algorithme `smartExtractScores` analyse la phrase mot par mot pour reconstruire le score.
- **Wake Lock API** : Empêche la mise en veille de l'écran pendant le jeu.

### 2. Visualisation Heatmap (HTML5 Canvas)

Le heatmap n'est pas une image statique mais un rendu dynamique sur un élément `<canvas>` :

- **Coordonnées Polaires** : Chaque zone de la cible est définie par un angle et un rayon.
- **Conversion** : Lors d'un tir, le score est converti en coordonnées (x, y).
- **Rendu** : Utilisation de `createRadialGradient` avec des niveaux d'opacité variables pour simuler la "chaleur" (densité de tirs).
- **Zones supportées** : Simples, Doubles, Triples, Bull et Bullseye.

### 3. Logique de Jeu (State Management)

L'état est encapsulé dans l'objet global `gameState`.

- **Validation Anti-Triche** : Avant d'accepter un score, le système vérifie :
  - Les bornes (Max 180/tour).
  - Les scores impossibles (ex: 163, 179).
  - La cohérence mathématique (ex: impossible de finir 120 avec 1 fléchette restante).
- **Undo Stack** : Un historique LIFO permet d'annuler n'importe quelle action, même un changement de joueur ou une victoire.

---

## 🚀 Fonctionnalités Détaillées

### 🎤 Contrôle Vocal

- **Feedback Temps Réel** : Affichage visuel de ce que l'IA "entend" avant validation.
- **Synthèse Vocale (TTS)** : L'application annonce les scores, les joueurs, et suggère les finitions (Checkouts).

### 📊 Statistiques & Export

- **Dashboard** : Moyenne (Avg), Meilleur tour, % aux doubles, compteurs de 180/140/100.
- **Génération PDF** : Utilisation de la librairie `jsPDF`. Le script capture le Canvas du heatmap, le convertit en image PNG base64 et l'injecte dans un rapport PDF vectoriel.

### ⌨️ Clavier Virtuel

Un mode de secours tactile est disponible si l'environnement est trop bruyant pour la voix.

---

## 🎮 Modes de Jeu

### 1. X01 (501, 301, 701)

- Options : Double-In, Double-Out.
- Gestion des Sets et Legs.
- Calculateur de Checkout automatique (ex: pour 170 → "T20, T20, Bull").

### 2. Cricket

- Gestion complète de la matrice de scores.
- Logique de "fermeture" (3 touches nécessaires).
- Calcul des points excédentaires ("Overpoints").

### 3. Checkout Training

- Génère une cible aléatoire (ex: 124).
- Vous avez 3 fléchettes pour finir.
- Suivi du taux de réussite.

### 4. Doubles Practice

- Cible un double spécifique (ex: D16).
- Idéal pour travailler la précision "Tour du monde".

---

## 💿 Installation et Démarrage

Cette application ne nécessite **aucun serveur backend** (Node.js/PHP non requis).

### Prérequis

- **Navigateur** : Google Chrome, Edge ou Samsung Internet (requis pour l'API Web Speech).
- **Microphone** fonctionnel.

### Étape 1 : Téléchargement

Téléchargez les fichiers sources (`index.html`, `style.css`, `script.js`) dans un dossier.

### Étape 2 : Lancement (Important)

Pour des raisons de sécurité liées au microphone, **vous ne pouvez pas simplement double-cliquer sur index.html**. Vous devez utiliser un serveur local HTTP/HTTPS.

#### Option A : Avec Visual Studio Code (Recommandé)

1. Installez l'extension "Live Server".
2. Faites un clic droit sur `index.html`.
3. Choisissez "Open with Live Server".

#### Option B : Avec Python

Ouvrez un terminal dans le dossier et lancez :

```bash
python -m http.server 8000
```

Puis accédez à `http://localhost:8000` dans votre navigateur.

---

## 🗣 Guide des Commandes Vocales

L'application est tolérante, mais voici les structures idéales pour une reconnaissance optimale :

| Action | Commande Vocale | Exemple |
|:-------|:----------------|:--------|
| **Score Simple** | `[Nombre]` | "Soixante", "Vingt-six" |
| **Score Multiple** | `[Nombre]` `[Nombre]` `[Nombre]` | "Vingt Vingt Dix" |
| **Double** | "Double" `[Nombre]` | "Double Seize" (Note 32) |
| **Triple** | "Triple" `[Nombre]` | "Triple Vingt" (Note 60) |
| **Bull** | "Bull", "Bulle", "Centre" | "Bulle" (Note 50) |
| **Demi-Bull** | "25", "Vingt-cinq" | "Vingt-cinq" |
| **Correction** | "Correction", "Annule", "Non" | Annule le dernier tir |

> **Astuce :** Si le système ne comprend pas, dites "Correction" et répétez plus distinctement.

---

## 📂 Structure du Projet

```plaintext
/
├── index.html      # Le squelette de l'application
│   ├── <div id="modal-setup">     # Configuration du match
│   ├── <main id="game-interface"> # Interface de jeu principale
│   │   ├── .player-card           # Score géant
│   │   ├── .dart-visuals          # Les 3 fléchettes
│   │   └── .data-zone             # Stats et Logs
│   └── <canvas id="heatmap">      # Le dessin du heatmap (caché)
│
├── style.css       # Le design (Dark Theme)
│   ├── :root                      # Variables de couleurs
│   ├── .active-zone               # Layout Grid gauche
│   └── .data-zone                 # Layout Grid droite
│
└── script.js       # Le cerveau
    ├── const gameState            # L'état complet du jeu
    ├── function recognition()     # Gestion du micro
    ├── function validateScore()   # Anti-triche
    └── function drawHeatmap()     # Dessin Canvas
```

---

## ⚙️ Paramètres & Personnalisation

### Configuration du Match

Lors du démarrage, vous pouvez personnaliser :

- **Mode de jeu** : X01, Cricket, Checkout Training, Doubles Practice
- **Nombre de joueurs** : 1 à 4 joueurs
- **Options X01** : Double-In, Double-Out, nombre de Sets/Legs
- **Préférences vocales** : Activation/désactivation de la synthèse vocale

### Personnalisation Visuelle

Le fichier `style.css` contient des variables CSS personnalisables dans la section `:root` :

- Couleurs du thème
- Tailles de police
- Espacements et marges
- Animations et transitions

---

## 🔒 Confidentialité & Sécurité

- **Aucune donnée n'est envoyée à un serveur** : Tout le traitement est local.
- **Pas de cookies tiers** : L'application n'utilise que le LocalStorage du navigateur.
- **Accès microphone** : Requis uniquement pour la reconnaissance vocale, contrôlé par les permissions du navigateur.

---

## 📝 Licence

Ce projet est distribué sous licence MIT. Vous êtes libre de l'utiliser, le modifier et le distribuer.

---

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :

- Signaler des bugs
- Proposer de nouvelles fonctionnalités
- Améliorer la documentation
- Optimiser le code

---

