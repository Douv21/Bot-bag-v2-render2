# Configuration Discord Bot - Guide Complet

## 🚨 Problème Actuel

Erreur: "Used disallowed intents" - Votre bot n'a pas les bonnes permissions activées dans le Discord Developer Portal.

## 🔧 Solution - Configuration Discord Developer Portal

### Étape 1: Accéder au Developer Portal
1. Allez sur https://discord.com/developers/applications
2. Connectez-vous avec votre compte Discord
3. Cliquez sur votre application bot

### Étape 2: Configurer les Intents (IMPORTANT)
1. Dans le menu de gauche, cliquez sur **"Bot"**
2. Scrollez jusqu'à la section **"Privileged Gateway Intents"**
3. **Activez ces intents** :
   - ✅ **PRESENCE INTENT** (optionnel)
   - ✅ **SERVER MEMBERS INTENT** (requis pour /voler et /donner)
   - ✅ **MESSAGE CONTENT INTENT** (requis pour confessions)

### Étape 3: Sauvegarder les Permissions
1. Cliquez **"Save Changes"** en bas de la page
2. **Redémarrez votre bot** après avoir sauvegardé

### Étape 4: Vérifier le Token
1. Dans l'onglet **"Bot"**, section **"Token"**
2. Si nécessaire, cliquez **"Reset Token"** pour en générer un nouveau
3. **Copiez le token** et mettez-le dans vos secrets Replit

## ⚙️ Configuration Replit Secrets

1. Dans Replit, cliquez sur l'icône **"Secrets"** (🔒) dans la barre latérale
2. Ajoutez ces secrets :

```
DISCORD_TOKEN = votre_token_bot_ici
CLIENT_ID = votre_client_id_ici
```

### Pour trouver CLIENT_ID :
1. Dans Discord Developer Portal, onglet **"General Information"**
2. Copiez **"Application ID"**

## 🔗 Inviter le Bot sur votre Serveur

### URL d'Invitation
Utilisez cette URL (remplacez CLIENT_ID par votre ID) :
```
https://discord.com/api/oauth2/authorize?client_id=VOTRE_CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

### Permissions Requises
Le bot a besoin de ces permissions :
- ✅ **Administrator** (permission 8) - Recommandé pour simplicité
- Ou individuellement :
  - Send Messages
  - Use Slash Commands
  - Manage Messages
  - Create Public Threads
  - Manage Roles
  - Embed Links
  - Attach Files
  - Read Message History

## 🛠️ Configuration config.json

Mettez à jour votre `config.json` avec les IDs de votre serveur :

```json
{
  "confessionChannels": ["VOTRE_CHANNEL_CONFESSION_ID"],
  "adminChannelId": "VOTRE_CHANNEL_ADMIN_ID", 
  "adminRoleIds": ["VOTRE_ROLE_ADMIN_ID"],
  "moderatorRoleIds": ["VOTRE_ROLE_MOD_ID"],
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

### Comment trouver les IDs Discord :
1. **Activez le mode développeur** dans Discord : Paramètres → Avancé → Mode développeur
2. **Clic droit** sur canaux/rôles → "Copier l'ID"

## 🚀 Redémarrage du Bot

Après avoir configuré :
1. **Sauvegardez** tous les changements
2. **Redémarrez** le workflow Replit
3. **Vérifiez** les logs pour confirmer la connexion

## ✅ Vérification du Fonctionnement

Le bot devrait afficher :
```
Ready! Logged in as VotreBot#1234
Started refreshing X application (/) commands.
Successfully reloaded X application (/) commands.
```

## 🐛 Dépannage

### Bot ne se connecte toujours pas :
- Vérifiez que le DISCORD_TOKEN est correct
- Assurez-vous que tous les intents sont activés
- Vérifiez que le bot est invité sur le serveur

### Commandes ne s'affichent pas :
- Attendez jusqu'à 1 heure pour la synchronisation
- Vérifiez que CLIENT_ID est correct
- Redémarrez Discord (application)

### Erreurs de permissions :
- Donnez la permission Administrator au bot
- Vérifiez que les IDs dans config.json sont corrects

## 📞 Support

Si le problème persiste après avoir suivi ces étapes :
1. Vérifiez les logs dans Replit
2. Assurez-vous que toutes les étapes ont été suivies
3. Double-vérifiez les tokens et IDs