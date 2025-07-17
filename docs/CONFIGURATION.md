# Guide de Configuration

## 📁 Fichiers de Configuration

### config.json
Fichier principal de configuration du bot.

```json
{
  "confessionChannels": ["123456789012345678"],
  "adminChannelId": "123456789012345679",
  "adminRoleIds": ["123456789012345680"],
  "moderatorRoleIds": ["123456789012345681"],
  "rateLimit": {
    "maxAttempts": 5,
    "windowMinutes": 60
  },
  "content": {
    "requireContent": false,
    "allowTextOnly": true,
    "allowImageOnly": true,
    "maxTextLength": 4000
  },
  "autothread": {
    "confessions": {
      "enabled": false,
      "threadName": "Discussion - {count}",
      "archiveAfter": 1440,
      "slowMode": 0
    }
  },
  "economy": {
    "dailyAmount": 100,
    "dailyEnabled": true
  }
}
```

### Variables d'Environnement (.env)
```env
# Obligatoire
DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_client_id

# Optionnel - Base de données
DATABASE_URL=postgresql://user:pass@host:port/db

# Optionnel - Serveur web
PORT=5000
NODE_ENV=production
```

## 🎛️ Configuration Détaillée

### Canaux de Confession
```json
"confessionChannels": [
  "123456789012345678",
  "123456789012345679"
]
```
- Liste des canaux où les confessions peuvent être envoyées
- Support illimité de canaux
- Les utilisateurs peuvent choisir le canal ou utiliser le défaut

### Logs Administrateur
```json
"adminChannelId": "123456789012345679"
```
- Canal où les logs de confessions sont envoyés
- Inclut les métadonnées pour la modération
- Affiche les images des confessions

### Rôles de Permission
```json
"adminRoleIds": ["123456789012345680"],
"moderatorRoleIds": ["123456789012345681"]
```
- **Administrateurs** : Accès complet à toutes les commandes
- **Modérateurs** : Accès aux commandes de configuration

### Rate Limiting
```json
"rateLimit": {
  "maxAttempts": 5,
  "windowMinutes": 60
}
```
- Protection contre le spam
- `maxAttempts` : Nombre max de confessions par fenêtre
- `windowMinutes` : Durée de la fenêtre en minutes

### Contenu des Confessions
```json
"content": {
  "requireContent": false,
  "allowTextOnly": true,
  "allowImageOnly": true,
  "maxTextLength": 4000
}
```
- `requireContent` : Exiger du texte ET/OU une image
- `allowTextOnly` : Autoriser seulement du texte
- `allowImageOnly` : Autoriser seulement une image
- `maxTextLength` : Limite de caractères

### Auto-Thread pour Confessions
```json
"autothread": {
  "confessions": {
    "enabled": false,
    "threadName": "Discussion - {count}",
    "archiveAfter": 1440,
    "slowMode": 0
  }
}
```
- `enabled` : Activer l'auto-thread
- `threadName` : Modèle de nom (`{count}` remplacé par le numéro)
- `archiveAfter` : Minutes avant archivage automatique
- `slowMode` : Délai entre messages en secondes

### Économie
```json
"economy": {
  "dailyAmount": 100,
  "dailyEnabled": true
}
```
- `dailyAmount` : Montant de la récompense quotidienne
- `dailyEnabled` : Activer/désactiver le système daily

## 🗃️ Fichiers de Données

### data/users.json
Stockage des données utilisateur :
```json
{
  "guildId_userId": {
    "userId": "123456789",
    "guildId": "987654321",
    "balance": 1250,
    "karma_good": 15,
    "karma_bad": 3,
    "lastDaily": "2025-01-14T10:30:00.000Z",
    "dailyStreak": 5
  }
}
```

### data/actions.json
Configuration des actions économiques :
```json
{
  "guildId_actionId": {
    "name": "Travailler",
    "baseReward": 35,
    "cooldown": 3600,
    "karmaGoodChange": 1,
    "karmaBadChange": -1,
    "enabled": true
  }
}
```

### data/cooldowns.json
Gestion des cooldowns :
```json
{
  "guildId_userId_actionId": {
    "userId": "123456789",
    "guildId": "987654321",
    "actionId": "work",
    "expiresAt": "2025-01-14T11:30:00.000Z"
  }
}
```

### data/shop.json
Articles de la boutique :
```json
{
  "guildId_itemId": {
    "guildId": "987654321",
    "itemId": "premium_role",
    "name": "Rôle Premium",
    "description": "Accès aux salons VIP",
    "price": 500,
    "type": "role",
    "roleId": "123456789012345682",
    "enabled": true
  }
}
```

## 🌐 Configuration Base de Données

### PostgreSQL (Optionnel)
Si vous utilisez PostgreSQL au lieu des fichiers JSON :

1. **Installation**
```bash
npm run db:push
```

2. **Configuration**
```env
DATABASE_URL=postgresql://user:password@host:port/database
```

3. **Schema**
Le schema est défini dans `shared/schema.ts` avec Drizzle ORM.

### Migrations
```bash
# Appliquer les changements de schema
npm run db:push

# Interface de gestion
npm run db:studio
```

## ⚙️ Configuration via Discord

### Commande /config
Interface interactive pour :
- Ajouter/supprimer des canaux de confession
- Configurer le canal de logs
- Paramétrer l'auto-thread des confessions

### Commande /autothread
Configuration du système auto-thread global :
- Canaux d'auto-thread
- Paramètres des threads
- Gestion par serveur

### Commande /configeconomie
Configuration économique complète :
- Actions (gains, cooldowns)
- Boutique (articles, prix)
- Karma (récompenses/sanctions)
- Daily (montant, activation)

## 🚀 Configuration Avancée

### Panel Web
Accessible sur le port configuré (défaut: 5000) :
- Interface graphique complète
- Gestion en temps réel
- Statistiques et logs
- Configuration avancée

### Logs de Debug
```env
NODE_ENV=development  # Active les logs détaillés
```

### Performance
- Les fichiers JSON sont automatiquement optimisés
- Nettoyage automatique des logs anciens
- Cache en mémoire pour les données fréquentes

## 🔧 Dépannage Configuration

### Canaux Non Trouvés
Vérifiez que :
- Les IDs sont corrects (mode développeur Discord activé)
- Le bot a accès aux canaux
- Les permissions sont suffisantes

### Permissions Manquantes
Le bot a besoin de :
- `Send Messages`
- `Use Slash Commands`
- `Manage Messages` (auto-thread)
- `Create Public Threads`
- `Manage Roles` (boutique)

### Données Non Sauvegardées
- Vérifiez les permissions du dossier `data/`
- Assurez-vous que l'espace disque est suffisant
- Vérifiez la syntaxe JSON si modification manuelle

### Base de Données
- Testez la connexion DATABASE_URL
- Vérifiez les permissions PostgreSQL
- Assurez-vous que le schema est à jour