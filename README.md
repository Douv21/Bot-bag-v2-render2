# 🤖 Bag Bot v2(2) - Discord Confession Bot

[![Status](https://img.shields.io/badge/status-stable-green.svg)](https://github.com)
[![Version](https://img.shields.io/badge/version-2.2-blue.svg)](https://github.com)
[![Node.js](https://img.shields.io/badge/node.js-20+-brightgreen.svg)](https://nodejs.org)
[![Discord.js](https://img.shields.io/badge/discord.js-14.21.0-blue.svg)](https://discord.js.org)

Un bot Discord sophistiqué offrant un système avancé de confessions anonymes et de gestion économique avec des mécaniques de karma robustes et des capacités de configuration sur plusieurs serveurs.

## ✨ Fonctionnalités

### 🔐 Système de Confessions Anonymes
- Confessions anonymes avec texte et/ou images
- Auto-thread automatique configurable
- Logs d'audit sécurisés pour modération
- Rate limiting anti-spam intégré

### 💰 Système Économique Complet
- **12 commandes économiques** : travail, pêche, vol, crime, pari, don, etc.
- **Système karma** : Actions bonnes (😇) vs mauvaises (😈)
- **Boutique intégrée** : Achat de rôles avec l'argent virtuel
- **Récompenses quotidiennes** avec système de streak
- **Leaderboards** séparés pour argent et karma

### ⚙️ Configuration Avancée
- **Panel web** de configuration accessible
- **24 commandes** Discord au total
- **Configuration multi-serveurs** indépendante
- **Système de staff** avec permissions granulaires

### 🛡️ Monitoring Ultra-Robuste
- **4 couches de protection** : Android 503 Killer, Error 502 Detector, Stability Monitor, Mobile Disconnect Guard
- **Health checks** automatiques sur ports 3000/5000
- **Backup automatique** des données toutes les 15 minutes
- **Protection mobile** spécialisée Android

## 🚀 Installation Rapide

### Option 1: Déploiement Replit (Recommandé)

1. **Importez le projet** sur Replit
2. **Configurez les secrets** dans l'interface Replit :
   - `DISCORD_TOKEN` : Token de votre bot Discord
   - `CLIENT_ID` : ID client de votre application Discord
   - `DATABASE_URL` : URL de votre base de données PostgreSQL
3. **Modifiez .replit** pour autoscale (voir [AUTOSCALE_DEPLOYMENT.md](AUTOSCALE_DEPLOYMENT.md))
4. **Déployez** via l'interface Replit

### Option 2: Installation Locale

```bash
# Cloner le repository
git clone https://github.com/votre-username/bag-bot-v2-2.git
cd bag-bot-v2-2

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Éditez .env avec vos tokens

# Démarrer le bot
npm start
```

### Option 3: Docker

```bash
docker build -t bag-bot-v2 .
docker run -d -p 3000:3000 -p 5000:5000 \
  -e DISCORD_TOKEN="votre_token" \
  -e CLIENT_ID="votre_client_id" \
  -e DATABASE_URL="votre_db_url" \
  bag-bot-v2
```

## 📊 Commandes Disponibles

### 👤 Commandes Utilisateur (12)
- `/confess` - Confession anonyme
- `/economie` - Profil économique
- `/travailler` - Gagner de l'argent (bonne action)
- `/pecher` - Pêcher pour de l'argent (bonne action)
- `/voler` - Voler de l'argent (mauvaise action)
- `/crime` - Commettre un crime (mauvaise action)
- `/parier` - Parier de l'argent (mauvaise action)
- `/donner` - Donner de l'argent (bonne action)
- `/daily` - Récompense quotidienne
- `/boutique` - Magasin de rôles
- `/topargent` - Classement richesse
- `/karma` - Classement karma

### ⚙️ Commandes Configuration (8)
- `/config` - Configuration principale
- `/autothread` - Configuration auto-thread
- `/configeconomie` - Configuration économie
- `/staff` - Gestion équipe modération
- `/compter` - Système de comptage
- `/dashboard` - Panel web
- `/stats` - Statistiques bot
- `/userinfo` - Informations utilisateur

### 👨‍💼 Commandes Admin (4)
- `/ajoutargent` - Ajouter argent à un utilisateur
- `/retraitargent` - Retirer argent d'un utilisateur
- `/ajoutkarma` - Ajouter karma à un utilisateur
- `/retraitkarma` - Retirer karma d'un utilisateur

## 🏗️ Architecture

```
bag-bot-v2-2/
├── commands/              # 24 commandes Discord
├── utils/                 # Utilitaires (économie, logs, rate limit)
├── panel/                 # Interface web de configuration
├── server/                # Configuration base de données
├── shared/                # Schémas partagés
├── docs/                  # Documentation
├── monitoring/            # Systèmes de monitoring (4 couches)
├── config.json           # Configuration principale
├── index.js              # Point d'entrée
└── server.js             # Serveur web
```

## 🔧 Configuration

### Variables d'Environnement
Consultez `.env.example` pour la liste complète des variables requises.

### Base de Données
Le bot supporte PostgreSQL avec Drizzle ORM. Configuration automatique via `DATABASE_URL`.

### Health Checks
- **Port 3000** : `/health`, `/ping`, `/status`, `/metrics`
- **Port 5000** : Panel web de configuration

## 📈 Monitoring

Le bot inclut un système de monitoring ultra-robuste :

- **Android 503 Killer** : Protection ultra-agressive contre les erreurs 503
- **Error 502 Detector** : Détection proactive des erreurs 502
- **Stability Monitor** : Vérifications toutes les 10 secondes
- **Mobile Disconnect Guard** : Protection spécialisée mobile

## 🚀 Déploiement

### Replit Autoscale (Recommandé)
Consultez [AUTOSCALE_DEPLOYMENT.md](AUTOSCALE_DEPLOYMENT.md) pour le guide complet.

### Docker
Consultez [DEPLOYMENT.md](DEPLOYMENT.md) pour toutes les options de déploiement.

## 📚 Documentation

- [Guide Installation](docs/INSTALLATION.md)
- [Documentation Commandes](docs/COMMANDES.md)
- [Configuration Avancée](docs/CONFIGURATION.md)
- [Déploiement Autoscale](AUTOSCALE_DEPLOYMENT.md)
- [Configuration GitHub](GITHUB_SETUP_V2.md)

## 🤝 Contribution

Consultez [CONTRIBUTING.md](CONTRIBUTING.md) pour les guidelines de contribution.

## 📄 Licence

Ce projet est sous licence MIT. Voir [LICENSE](LICENSE) pour plus de détails.

## 🆘 Support

- **Documentation** : Consultez les fichiers docs/
- **Issues** : Ouvrez une issue sur GitHub
- **Health Check** : `/status` endpoint pour diagnostics

---

**Bot Status**: ✅ Stable et opérationnel avec 24/7 monitoring
**Version**: 2.2 avec autoscale et monitoring avancé