# Guide de Contribution

Merci de votre intérêt pour contribuer au Bot Discord de Confessions Anonymes !

## 🚀 Comment Contribuer

### 1. Fork et Clone
```bash
git fork https://github.com/votre-nom/discord-confession-bot
git clone https://github.com/votre-nom/discord-confession-bot.git
cd discord-confession-bot
```

### 2. Installation
```bash
npm install
cp .env.example .env
# Configurez vos variables d'environnement
```

### 3. Créer une Branche
```bash
git checkout -b feature/ma-nouvelle-fonctionnalite
```

### 4. Développer
- Suivez les conventions de code existantes
- Testez vos modifications
- Ajoutez de la documentation si nécessaire

### 5. Commit et Push
```bash
git add .
git commit -m "feat: ajouter nouvelle fonctionnalité"
git push origin feature/ma-nouvelle-fonctionnalite
```

### 6. Pull Request
Ouvrez une Pull Request avec :
- Description claire de vos changements
- Tests effectués
- Screenshots si applicable

## 📋 Standards de Code

### Structure des Commits
Utilisez la convention [Conventional Commits](https://www.conventionalcommits.org/) :
- `feat:` nouvelles fonctionnalités
- `fix:` corrections de bugs
- `docs:` documentation
- `style:` formatage
- `refactor:` refactorisation
- `test:` tests
- `chore:` maintenance

### JavaScript
- Utilisez ES6+ 
- Indentation : 4 espaces
- Point-virgules obligatoires
- Noms de variables descriptifs

### Discord.js
- Utilisez les SlashCommands
- Gérez les erreurs proprement
- Utilisez l'interaction.deferReply() pour les commandes longues

## 🧪 Tests

### Tester Localement
1. Configurez un serveur Discord de test
2. Invitez votre bot avec les permissions nécessaires
3. Testez toutes les commandes modifiées
4. Vérifiez les logs pour les erreurs

### Tests Requis
- [ ] Commandes fonctionnent sans erreur
- [ ] Messages d'erreur appropriés
- [ ] Permissions respectées
- [ ] Données sauvegardées correctement

## 📝 Documentation

### README
Mettez à jour le README.md si vous :
- Ajoutez de nouvelles commandes
- Modifiez la configuration
- Changez l'installation

### Code
- Commentez le code complexe
- Documentez les nouvelles fonctions
- Expliquez les choix d'architecture

## 🐛 Rapporter des Bugs

### Template d'Issue
```markdown
**Description du Bug**
Description claire du problème

**Reproduction**
Étapes pour reproduire :
1. Exécuter '...'
2. Cliquer sur '...'
3. Voir l'erreur

**Comportement Attendu**
Ce qui devrait se passer

**Screenshots**
Si applicable

**Environnement**
- OS: [e.g. Windows 10]
- Node.js: [e.g. 18.17.0]
- Discord.js: [e.g. 14.21.0]
```

## ✨ Nouvelles Fonctionnalités

### Proposer une Fonctionnalité
1. Ouvrez une issue avec le tag `enhancement`
2. Décrivez clairement la fonctionnalité
3. Expliquez pourquoi c'est utile
4. Proposez une implémentation

### Développer
1. Discutez d'abord dans l'issue
2. Créez votre branche
3. Implémentez avec tests
4. Documentez la fonctionnalité

## 🏗️ Architecture

### Structure du Projet
```
commands/       # Commandes Discord (1 fichier par commande)
data/          # Stockage JSON (users.json, actions.json, etc.)
logs/          # Logs d'audit
panel/         # Interface web
server/        # Configuration base de données
shared/        # Schémas Drizzle
utils/         # Modules utilitaires
```

### Conventions
- 1 commande = 1 fichier dans `commands/`
- Utilisez `economyManager` pour les opérations économiques
- Logs importants dans `utils/logger.js`
- Configuration centralisée dans `config.json`

## 🔐 Sécurité

### Guidelines
- Ne jamais commiter de tokens/clés
- Validez tous les inputs utilisateur
- Utilisez les permissions Discord appropriées
- Gérez les erreurs sans exposer d'informations sensibles

### Rapporter une Vulnérabilité
Contactez les mainteneurs directement pour les problèmes de sécurité.

## 📞 Support

- **Issues GitHub** : Pour bugs et fonctionnalités
- **Discussions** : Pour questions générales
- **Discord** : Pour support en temps réel

## 🙏 Reconnaissance

Tous les contributeurs seront ajoutés au README principal. Merci pour votre aide !

---

**Code de Conduite** : Respectez les autres contributeurs et maintenez un environnement accueillant pour tous.