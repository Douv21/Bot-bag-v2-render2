# Guide de Déploiement Autoscale

## 🚀 Configuration Autoscale pour Discord Bot

### Étape 1: Modifier le fichier .replit

**Remplacez cette section dans votre fichier .replit :**

```toml
[deployment]
deploymentTarget = "static"
publicDir = "BAG v2"
```

**Par cette configuration autoscale :**

```toml
[deployment]
deploymentTarget = "autoscale"
run = "node index.js"
```

### Étape 2: Variables d'environnement requises

Assurez-vous que ces secrets sont configurés dans Replit :

1. **DISCORD_TOKEN** - Token de votre bot Discord
2. **CLIENT_ID** - ID client de votre application Discord  
3. **DATABASE_URL** - URL de votre base de données PostgreSQL

### Étape 3: Ports et health checks

Le bot est déjà configuré avec :
- **Port 3000** : Endpoints de santé (/health, /ping, /status, /metrics)
- **Port 5000** : Panel web de configuration
- **Health checks** : Système automatique intégré

### Étape 4: Avantages de l'autoscale

✅ **Scaling automatique** selon la charge
✅ **Health monitoring** intégré
✅ **Redémarrages automatiques** en cas de problème
✅ **Performance optimisée** pour les bots Discord
✅ **Logging avancé** et métriques

### Étape 5: Vérification post-déploiement

Après le déploiement autoscale, vérifiez :

1. **Status du bot** : `/status` endpoint
2. **Santé système** : `/health` endpoint  
3. **Métriques** : `/metrics` endpoint
4. **Panel web** : Interface sur port 5000
5. **Commandes Discord** : Test des 24 commandes

## 🛠️ Configuration actuelle optimisée

Votre bot Discord est déjà parfaitement préparé pour l'autoscale avec :

- ✅ Système de monitoring complet (4 couches de protection)
- ✅ Health checks robustes sur multiple endpoints
- ✅ Gestion automatique des erreurs et redémarrages
- ✅ Backup automatique des données toutes les 15 minutes
- ✅ Protection spéciale contre les déconnexions mobiles
- ✅ 24 commandes Discord opérationnelles
- ✅ Panel web de configuration accessible

## 📊 Monitoring et métriques

L'autoscale bénéficiera du système de monitoring avancé :

- **Android 503 Killer** : Protection ultra-agressive
- **Détecteur erreurs 502** : Prévention proactive  
- **Moniteur de stabilité** : Checks toutes les 10 secondes
- **Keep-alive UptimeRobot** : Monitoring externe 24/7

## 🔧 Commande de déploiement

Une fois la configuration .replit modifiée :

1. Sauvegardez le fichier .replit
2. Utilisez l'interface Replit pour déployer
3. Sélectionnez "Autoscale deployment"
4. Le bot sera automatiquement optimisé et déployé

Le passage en autoscale est fortement recommandé pour ce type d'application Discord bot !