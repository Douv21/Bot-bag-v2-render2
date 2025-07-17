# 🤖 Discord Bot Bag v2 - Système de Confessions & Économie

Un bot Discord sophistiqué offrant un système avancé de confessions anonymes et de gestion économique avec des mécaniques de karma robustes et des capacités de configuration multi-serveurs.

## ✨ Fonctionnalités Principales

### 🔒 Système de Confessions Anonymes
- **Confessions sécurisées** : Soumission via `/confess` avec texte et/ou images
- **Threads automatiques** : Création auto de threads pour chaque confession
- **Logs administrateurs** : Traçabilité complète avec identification utilisateur
- **Rate limiting** : Protection anti-spam intégrée

### 💰 Système Économique Complet
- **12 commandes d'économie** : Travailler, pêcher, voler, crimes, paris, donations
- **Système de karma** : Actions bonnes (😇) vs mauvaises (😈)
- **Boutique intégrée** : Achat de rôles Discord
- **Daily rewards** : Récompenses quotidiennes avec streaks
- **Leaderboards** : Classements argent et karma séparés

### 🎛️ Panel Web de Configuration
- **Interface web** : Configuration en temps réel sur port 5000
- **Multi-serveurs** : Gestion indépendante par serveur
- **Statistiques** : Métriques détaillées et analytics
- **Auto-thread global** : Système façon Needle pour tous les messages

### 🛡️ Monitoring Avancé
- **5 systèmes de surveillance** : Protection 24/7
- **Health checks** : Endpoints robustes sur ports 3000/5000
- **Protection mobile** : Spécialement optimisé pour Android
- **Auto-restart** : Redémarrage intelligent en cas d'erreur

## 🚀 Installation Rapide

### Prérequis
- Node.js 18+ 
- PostgreSQL
- Token Discord Bot

### Étape 1 : Cloner le projet
```bash
git clone https://github.com/VOTRE_USERNAME/discord-bot-bag-v2.git
cd discord-bot-bag-v2
```

### Étape 2 : Installer les dépendances
```bash
npm install
```

### Étape 3 : Configuration
Créez un fichier `.env` :
```env
DISCORD_TOKEN=votre_token_discord
CLIENT_ID=votre_client_id
DATABASE_URL=postgresql://user:password@localhost/dbname
```

### Étape 4 : Démarrage
```bash
node index.js
```

## 📋 Commandes Disponibles (24 commandes)

### 👤 Utilisateur
- `/confess` - Soumettre une confession anonyme
- `/economie` - Voir profil et statistiques
- `/travailler` - Travailler pour gagner de l'argent (+😇)
- `/pecher` - Pêcher avec mécaniques spéciales
- `/voler` - Voler de l'argent à un membre (+😈)
- `/crime` - Commettre un crime (+😈)
- `/parier` - Parier son argent (50% chance)
- `/donner` - Donner de l'argent (+😇)
- `/daily` - Récompense quotidienne
- `/boutique` - Acheter des rôles
- `/topargent` - Classement richesse
- `/karma` - Classement karma
- `/solde` - Voir son solde

### 🛠️ Administrateur
- `/config` - Configuration serveur
- `/autothread` - Gestion auto-threads
- `/configeconomie` - Configuration économie
- `/ajoutargent` - Ajouter argent à un membre
- `/retraitargent` - Retirer argent d'un membre
- `/ajoutkarma` - Ajouter karma à un membre
- `/retraitkarma` - Retirer karma d'un membre
- `/dashboard` - Accès panel web
- `/stats` - Statistiques détaillées
- `/staff` - Gestion rôles staff
- `/compter` - Configuration comptage

## 🔧 Déploiement

### Replit (Recommandé)
1. Importez le projet sur Replit
2. Configurez les variables d'environnement dans Secrets
3. Modifiez `.replit` pour autoscale :
```toml
[deployment]
deploymentTarget = "autoscale"
run = "node index.js"
```

### VPS/Serveur Dédié
1. Clonez le référentiel
2. Installez PostgreSQL
3. Configurez `.env`
4. Utilisez PM2 pour la production :
```bash
npm install -g pm2
pm2 start index.js --name "discord-bot"
```

### Docker
```bash
docker build -t discord-bot .
docker run -d -p 3000:3000 -p 5000:5000 --env-file .env discord-bot
```

## 📊 Architecture Technique

### Stack Technologique
- **Backend** : Node.js 18+
- **Database** : PostgreSQL + JSON files
- **Framework** : Discord.js v14
- **Web Server** : Express.js
- **Monitoring** : Custom stability systems

### Structure des fichiers
```
├── index.js                 # Point d'entrée principal
├── commands/                # Commandes Discord (24 fichiers)
├── utils/                   # Utilitaires et managers
├── panel/                   # Interface web
├── monitoring/              # Systèmes de surveillance
├── config.json             # Configuration bot
└── docs/                   # Documentation
```

## 🎯 Systèmes de Monitoring

### Surveillance Active
- **Stability Monitor** : Vérification santé toutes les 10s
- **502 Error Detector** : Détection erreurs serveur
- **Mobile Disconnect Guard** : Protection déconnexions mobiles
- **Android 503 Killer** : Protection spéciale Android
- **Ultra Stability Guard** : Gardien ultra-robuste

### Health Endpoints
- `GET /ping` - Ping basique
- `GET /health` - Santé détaillée
- `GET /status` - Statut JSON
- `GET /metrics` - Métriques système

## 📈 Performance

### Métriques Typiques
- **Uptime** : 99.9%+ avec monitoring
- **Latence** : <50ms pour commandes
- **Mémoire** : ~100MB base + scaling
- **Redémarrages** : <1 par jour avec protection

### Optimisations
- Backup automatique toutes les 15min
- Nettoyage mémoire intelligent
- Rate limiting adaptatif
- Compression des logs

## 🔐 Sécurité

### Protection Intégrée
- Rate limiting par utilisateur
- Validation des entrées
- Logs audit complets
- Isolation des données par serveur

### Permissions Discord
- Gestion des rôles
- Lecture/écriture messages
- Gestion des threads
- Accès serveur uniquement

## 🌍 Support Multi-Langues

Actuellement en **français** avec support prévu pour :
- Anglais
- Espagnol
- Allemand

## 📞 Support & Contribution

### Signaler un Bug
1. Ouvrez une issue sur GitHub
2. Décrivez le problème rencontré
3. Joignez les logs si possible

### Demander une Fonctionnalité
1. Créez une feature request
2. Décrivez l'usage prévu
3. Expliquez la valeur ajoutée

### Contribuer
1. Fork le projet
2. Créez une branche feature
3. Commit vos changements
4. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🎉 Remerciements

Bot développé pour les communautés Discord françaises avec amour et passion pour la technologie !

---

**Made with ❤️ pour la communauté Discord française**