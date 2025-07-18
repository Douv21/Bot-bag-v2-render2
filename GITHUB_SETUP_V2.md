# Configuration GitHub pour "bag bot v2(2)"

## 🚀 Création du Nouveau Repository

### 1. Créer le Repository GitHub

1. Allez sur https://github.com
2. Cliquez sur "New repository"
3. **Nom**: `bag-bot-v2-2`
4. **Description**: "Bot Discord avancé avec système de confessions anonymes, économie karma et déploiement autoscale optimisé"
5. **Visibilité**: Public ou Private selon vos préférences
6. ⚠️ **Ne cochez PAS** "Add a README file" (nous en avons déjà un)
7. Cliquez "Create repository"

### 2. Configuration Git Locale

```bash
# Initialiser le repository git
git init

# Ajouter l'origine GitHub (remplacez VOTRE_USERNAME)
git remote add origin https://github.com/VOTRE_USERNAME/bag-bot-v2-2.git

# Configurer les informations utilisateur
git config user.name "Votre Nom"
git config user.email "votre.email@example.com"

# Ajouter tous les fichiers (hors exclusions .gitignore)
git add .

# Créer le commit initial
git commit -m "feat: Discord bot v2.2 avec autoscale et monitoring avancé

✨ Nouvelles fonctionnalités:
- Configuration autoscale Replit optimisée
- Système de monitoring 4 couches (503 Killer, 502 Detector, etc.)
- 24 commandes Discord opérationnelles
- Panel web de configuration
- Backup automatique toutes les 15 minutes
- Protection mobile Android spécialisée
- Health checks robustes sur ports 3000/5000

🛠️ Déploiement:
- Support static et autoscale
- Docker ready avec Dockerfile optimisé
- Scripts de production inclus
- Documentation complète"

# Pousser vers GitHub
git push -u origin main
```

## 📁 Structure du Project (Inclus dans le ZIP)

### Fichiers Principaux
- ✅ `index.js` - Point d'entrée principal du bot
- ✅ `server.js` - Serveur web avec health checks
- ✅ `auto_restart.js` - Système de redémarrage automatique
- ✅ `config.json` - Configuration du bot
- ✅ `package.json` - Dépendances Node.js

### Commandes Discord (24 commandes)
- ✅ Dossier `commands/` complet avec toutes les commandes
- ✅ Système économique complet (travail, pêche, vol, crime, etc.)
- ✅ Configuration avancée (economie, autothread, staff, etc.)
- ✅ Commandes admin (ajout/retrait argent/karma)

### Systèmes de Monitoring
- ✅ `android_503_killer.js` - Protection ultra-agressive
- ✅ `error_502_detector.js` - Détection proactive erreurs
- ✅ `stability_monitor.js` - Monitoring complet
- ✅ `mobile_disconnect_guard.js` - Protection mobile
- ✅ `health_check.js` - Vérifications santé

### Utilitaires
- ✅ `utils/` - Économie, logs, rate limiting, data manager
- ✅ `panel/` - Interface web de configuration
- ✅ `docs/` - Documentation complète

### Configuration Déploiement
- ✅ `AUTOSCALE_DEPLOYMENT.md` - Guide autoscale
- ✅ `DEPLOYMENT.md` - Guide déploiement complet
- ✅ `Dockerfile` - Support Docker
- ✅ `production_start.js` - Script production optimisé

## 🔧 Variables d'Environnement Requises

```env
DISCORD_TOKEN=votre_token_discord
CLIENT_ID=votre_client_id
DATABASE_URL=postgresql://url_base_donnees
NODE_ENV=production
```

## 🚀 Déploiement Recommandé

### Option 1: Replit Autoscale (Recommandé)
1. Importer le projet sur Replit
2. Configurer les secrets (DISCORD_TOKEN, CLIENT_ID, DATABASE_URL)
3. Modifier `.replit` pour autoscale (voir AUTOSCALE_DEPLOYMENT.md)
4. Déployer via l'interface Replit

### Option 2: Docker
```bash
docker build -t bag-bot-v2 .
docker run -d -p 3000:3000 -p 5000:5000 bag-bot-v2
```

## 📊 Caractéristiques Actuelles

- ✅ **24 commandes Discord** opérationnelles
- ✅ **Monitoring 4 couches** pour stabilité maximale
- ✅ **Health checks robustes** (ports 3000/5000)
- ✅ **Backup automatique** données toutes les 15 min
- ✅ **Protection mobile** spécialisée Android
- ✅ **Panel web** configuration accessible
- ✅ **Support multi-déploiement** (static/autoscale/docker)

Le bot est prêt pour production avec tous les systèmes de monitoring et de protection activés !