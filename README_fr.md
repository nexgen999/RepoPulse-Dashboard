# 🌌 RepoPulse Dashboard

**RepoPulse** est un tableau de bord de niveau industriel haute performance conçu pour les développeurs et les équipes DevOps afin de surveiller les releases logicielles et gérer des fichiers sur plusieurs plateformes en temps réel. Conçu avec un souci du détail esthétique et une profondeur fonctionnelle, il combine un suivi unifié des dépôts avec un puissant explorateur de fichiers multi-protocoles.

![Licence](https://img.shields.io/badge/licence-Apache--2.0-blue.svg)
![Version](https://img.shields.io/badge/version-1.7.0-emerald.svg)
![Tech](https://img.shields.io/badge/tech-React--18%20|%20Node.js%20|%20TypeScript-blueviolet.svg)

---

## 🚀 Fonctionnalités Clés

### 📦 Suivi des Releases Logicielles
*   **Support Multi-Sources** : Suivez les versions de GitHub, GitLab (Cloud & Auto-hébergé), Codeberg et F-Droid.
*   **Catégorisation Profonde** : Organisez votre espace de travail avec jusqu'à **5 niveaux** de catégories imbriquées.
*   **Historique des Versions** : Conservez un historique complet des 10 dernières versions par dépôt.
*   **Filtrage Intelligent** : Filtrez par compatibilité OS (Windows, Linux, macOS), catégories ou recherche instantanée.
*   **Moteur de Mise en Page** : Basculez entre les vues **Liste**, **Grille**, **Bento** et **Colonnes**.

### 📂 Explorateur de Fichiers Unifié
Un gestionnaire de fichiers à double panneau de classe entreprise supportant divers protocoles :
*   **Stockage Local** : Accès complet aux lecteurs de votre serveur avec navigation par barre d'adresse.
*   **FTP / SFTP** : Gérez les fichiers de serveurs distants en toute sécurité avec chiffrement des identifiants.
*   **SMB (Samba)** : Accédez aux partages réseau directement depuis votre navigateur.
*   **WebDAV** : Connectez-vous à des stockages cloud comme Nextcloud ou des serveurs WebDAV spécialisés.
*   **Aperçu HTTP** : Parcourez et prévisualisez les fichiers hébergés sur des serveurs web standards de manière récursive.
*   **Opérations Avancées** : Copier, Déplacer, Renommer, Supprimer, CHMOD et Vérification de Hash (SHA256).

### 🎨 Design & Personnalisation
*   **Fluent Design System** : Une esthétique inspirée par le langage de design moderne de Microsoft.
*   **Glassmorphism** : Effets de flou élégants et opacités sophistiquées.
*   **Designer de Thèmes** : Choisissez parmi des thèmes professionnels (*Minuit, Forêt, Coucher de Soleil, Océan*) ou créez le vôtre avec des couleurs d'accentuation et des intensités de flou personnalisées.
*   **Branding Personnalisé** : Téléchargez vos propres Favicons et icônes de barre latérale directement via l'interface.

### ⚙️ Automatisation & Données
*   **Moteur d'Auto-Backup** : Téléchargez et archivez automatiquement les nouvelles releases sur votre serveur.
*   **Webhooks** : Intégration avec **Discord** ou **Slack** pour des notifications de mise à jour en temps réel.
*   **Logs de Transfert** : Suivez chaque mouvement de fichier avec un journal persistant et des rapports de statut.
*   **Internationalisation** : Support complet pour plus de 15 régions (FR-FR, EN-US, ES-ES, RU-RU, ZH-CN, etc.).

---

## 🛠 Stack Technique

*   **Frontend** : React 18, Vite, TypeScript, Framer Motion (Animations), Recharts (Stats).
*   **Backend** : Node.js (Express), `tsx` pour l'exécution.
*   **Styling** : Tailwind CSS 4.x.
*   **Stockage** : Persistance locale (aucune base de données externe requise).
*   **Icônes** : Lucide React.

---

## 📥 Installation

### Prérequis
*   **Node.js** : Version 18.x ou supérieure.
*   **npm** : Version 9.x ou supérieure.
*   **OS** : Windows, Linux ou macOS.

### Instructions de Configuration
1.  **Cloner le dépôt** :
    ```bash
    git clone https://github.com/votre-username/RepoPulse.git
    cd RepoPulse
    ```
2.  **Installer les dépendances** :
    ```bash
    npm install
    ```
3.  **Lancer en mode Développement** :
    ```bash
    npm run dev
    ```
4.  **Compiler pour la Production** :
    ```bash
    npm run build
    ```
5.  **Démarrer le Serveur de Production** :
    ```bash
    node server.js # (Assurez-vous que les fichiers compilés sont dans le dossier dist)
    ```

---

## 📂 Structure du Projet

*   `/src` : Code source frontend (composants React, hooks, assets).
*   `/server.ts` : Serveur Express gérant les APIs et les opérations de fichiers.
*   `/server/plugins` : Logique centrale pour les protocoles de l'Explorateur (FTP, SMB, etc.).
*   `/user` : Données utilisateur persistantes (paramètres, dépôts, connexions chiffrées).
*   `/Backup_RepoPulse` : Répertoire par défaut pour les sauvegardes automatiques de releases.

---

## 🛡 Sécurité & Confidentialité

*   **Local-First** : Vos données ne quittent jamais votre infrastructure.
*   **Chiffrement** : Les identifiants de connexion distante sont chiffrés au repos sur le serveur.
*   **Tokens** : Les GitHub Personal Access Tokens sont utilisés de manière sécurisée pour augmenter les limites de requêtes et accéder aux dépôts privés.

---

## 🤝 Crédits

Conçu par **nexgen** avec l'assistance d'agents IA avancés. 🚀
Un grand merci à la communauté open-source pour les incroyables bibliothèques qui propulsent ce projet.

---

## 📄 Licence

Ce projet est sous licence **Apache License 2.0**.
