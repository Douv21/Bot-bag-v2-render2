# 🤖 Bot Discord Bag v2 - Version Render.com

Version spécialement optimisée pour le déploiement sur Render.com.

## ✨ Fonctionnalités

- **24 commandes Discord** complètes
- **Système économique** avec karma (😇/😈)
- **Confessions anonymes** sécurisées
- **Auto-threads** configurables
- **Panel web** de configuration
- **Monitoring** et health checks

## 🚀 Déploiement Rapide sur Render.com

### 1. Prérequis
- Compte Render.com (gratuit)
- Bot Discord créé
- Repository GitHub (recommandé)

### 2. Variables d'environnement
Configurez dans Render Dashboard > Environment:
```env
DISCORD_TOKEN = votre_token_bot
CLIENT_ID = votre_client_id  
DATABASE_URL = postgresql://... (optionnel)
```

### 3. Configuration automatique
- **Build Command**: `npm install`
- **Start Command**: `node index.js`
- **Port**: Automatique (Render assigne)
- **Health Check**: `/health`

## 📋 Fichiers spécialisés Render

- `index.js` - Point d'entrée optimisé
- `server.js` - Serveur web adapté  
- `package.json` - Dépendances configurées
- `render.yaml` - Configuration service
- `Dockerfile` - Support conteneur
- `.env.example` - Variables d'exemple

## 🔧 Adaptations Render.com

### Port dynamique
```javascript
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0');
```

### Health checks
- `/` - Statut principal (requis par Render)
- `/health` - Diagnostics détaillés
- Timeout: 30s, Interval: 30s

### Gestion signaux
```javascript
process.on('SIGTERM', () => {
    console.log('Shutdown gracieux...');
    client.destroy();
    process.exit(0);
});
```

## 📊 Monitoring

### Endpoints disponibles
- `https://votre-app.onrender.com/` - Statut bot
- `https://votre-app.onrender.com/health` - Health check
- `https://votre-app.onrender.com/api/stats` - Statistiques

### Logs structurés
```
✅ Ready! Logged in as BotName#1234
🌐 Health check server running on port 10000
📦 Automatic backup system started
🤖 Bot fully initialized for Render.com
```

## 🗄️ Base de données

### Options supportées
1. **PostgreSQL Render** (gratuit 1GB)
2. **Neon Database** (externe, gratuit)
3. **Supabase** (PostgreSQL hébergé)

### Configuration
```env
DATABASE_URL=postgresql://user:pass@host:port/db
```

## ⚠️ Limitations Render gratuit

- **RAM**: 512MB
- **CPU**: 0.1 vCPU  
- **Inactivité**: Veille après 15min
- **Heures**: 750h/mois max

**Solution**: Plan Pro pour production 24/7

## 🎯 Commandes disponibles

### Utilisateur
- `/confess` - Confession anonyme
- `/economie` - Profil économique
- `/boutique` - Achat rôles
- `/daily` - Récompenses quotidiennes

### Administrateur  
- `/config` - Configuration serveur
- `/autothread` - Gestion auto-threads
- `/configeconomie` - Configuration économie
- `/dashboard` - Panel web

## 🐛 Résolution problèmes

### Bot offline
1. Vérifiez `DISCORD_TOKEN` dans Environment
2. Consultez logs Render Dashboard
3. Vérifiez health check `/health`

### Service failed
1. Vérifiez build logs
2. Port configuré sur `process.env.PORT`
3. Health check retourne 200

### Base de données
1. `DATABASE_URL` configurée
2. PostgreSQL accessible
3. Tables créées automatiquement

## 📞 Support

- **Render Docs**: https://render.com/docs
- **Discord API**: https://discord.com/developers/docs
- **Guide complet**: `RENDER_DEPLOYMENT.md`

---

**Déployez votre bot Discord en quelques clics sur Render.com !** 🚀

## 🔗 Liens utiles

- [Documentation Render](https://render.com/docs)
- [Dashboard Render](https://dashboard.render.com)
- [Discord Developers](https://discord.com/developers/applications)
- [Guide déploiement](./RENDER_DEPLOYMENT.md)