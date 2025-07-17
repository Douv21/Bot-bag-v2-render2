# Guide d'Installation

## 📋 Prérequis

### Système
- Node.js 18+ 
- npm 8+
- Git

### Discord
- Compte Discord Developer
- Application Discord créée
- Bot token généré

## 🚀 Installation Rapide

### 1. Cloner le Projet
```bash
git clone https://github.com/votre-nom/discord-confession-bot.git
cd discord-confession-bot
```

### 2. Installer les Dépendances
```bash
npm install
```

### 3. Configuration
```bash
cp .env.example .env
```

Éditez le fichier `.env` :
```env
DISCORD_TOKEN=votre_token_discord
CLIENT_ID=votre_client_id
```

### 4. Configuration Discord
Modifiez `config.json` avec vos IDs :
```json
{
  "confessionChannels": ["VOTRE_CHANNEL_ID"],
  "adminChannelId": "VOTRE_ADMIN_CHANNEL_ID",
  "adminRoleIds": ["VOTRE_ADMIN_ROLE_ID"],
  "moderatorRoleIds": ["VOTRE_MOD_ROLE_ID"]
}
```

### 5. Lancer le Bot
```bash
npm start
```

## 🔧 Configuration Avancée

### Base de Données (Optionnel)
Pour utiliser PostgreSQL au lieu des fichiers JSON :

1. Installez PostgreSQL
2. Configurez DATABASE_URL dans `.env`
3. Lancez les migrations :
```bash
npm run db:push
```

### Panel Web
Le panel web est automatiquement accessible sur le port 5000.

### Permissions Discord
Permissions requises pour le bot :
- `Send Messages`
- `Use Slash Commands`
- `Manage Messages` (pour auto-thread)
- `Create Public Threads`
- `Manage Roles` (pour la boutique)
- `Embed Links`
- `Attach Files`

## 🐛 Dépannage

### Bot ne se connecte pas
- Vérifiez votre DISCORD_TOKEN
- Assurez-vous que le bot est invité sur le serveur

### Commandes non disponibles
- Vérifiez CLIENT_ID
- Attendez jusqu'à 1 heure pour la synchronisation

### Erreurs de permissions
- Vérifiez les permissions du bot
- Vérifiez les IDs dans config.json

### Data non sauvegardée
- Vérifiez les permissions du dossier `data/`
- Vérifiez la configuration DATABASE_URL si utilisée

## 📞 Support

Si vous rencontrez des problèmes :
1. Consultez les logs dans `logs/`
2. Vérifiez la configuration
3. Ouvrez une issue GitHub avec les détails