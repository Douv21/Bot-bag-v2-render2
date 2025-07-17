# Guide des Commandes

## 👤 Commandes Utilisateur

### 📝 Confessions
#### `/confess`
Envoie une confession anonyme.

**Paramètres :**
- `texte` (optionnel) - Votre confession
- `image` (optionnel) - Image à joindre
- `canal` (optionnel) - Canal spécifique

**Exemples :**
```
/confess texte:Je dois avouer quelque chose...
/confess image:[fichier.jpg]
/confess texte:Ma confession canal:#confessions-2
```

### 💰 Économie

#### `/economie`
Affiche votre profil économique complet.

**Informations affichées :**
- Solde actuel
- Karma bon/mauvais
- Rang dans les classements
- Statistiques des actions

#### `/travailler`
Travaillez pour gagner de l'argent (action bonne).

**Récompenses :**
- +25-50 pièces (configurable)
- +1😇 -1😈
- Cooldown : 1 heure

#### `/pecher`
Pêchez pour gagner de l'argent (action bonne).

**Mécaniques :**
- Différents poissons avec valeurs variables
- +1😇 -1😈
- Cooldown : 45 minutes

#### `/voler [cible]`
Tentez de voler de l'argent (action mauvaise).

**Paramètres :**
- `cible` (optionnel) - Membre à voler, sinon aléatoire

**Mécaniques :**
- 70% de chance de réussite
- Vol réussi : 10-30% de l'argent de la victime
- Vol échoué : perte de 20-50 pièces
- +1😈 -1😇
- Cooldown : 1h30

**Exemples :**
```
/voler                    # Cible aléatoire
/voler cible:@membre      # Cible spécifique
```

#### `/crime`
Commettez un crime pour de gros gains (action très mauvaise).

**Mécaniques :**
- Gains élevés mais risques importants
- +2😈 -2😇
- Cooldown : 3 heures

#### `/parier [montant]`
Pariez votre argent (action mauvaise).

**Paramètres :**
- `montant` - Somme à parier

**Mécaniques :**
- 50% de chance de doubler
- 50% de chance de tout perdre
- +1😈 -1😇
- Cooldown : 2 heures

#### `/donner [membre] [montant]`
Donnez de l'argent à un autre membre (action très bonne).

**Paramètres :**
- `membre` - Destinataire (obligatoire)
- `montant` - Somme (1-1000 pièces, obligatoire)

**Mécaniques :**
- Transfert direct entre utilisateurs
- +2😇 -1😈
- Cooldown : 30 minutes

**Exemples :**
```
/donner membre:@ami montant:50
/donner membre:@nouveau montant:10
```

#### `/daily`
Récupérez votre récompense quotidienne.

**Mécaniques :**
- Montant configurable par serveur
- Système de streak (bonus consécutifs)
- Disponible toutes les 24h

#### `/boutique`
Accédez à la boutique pour acheter des rôles.

**Fonctionnalités :**
- Achat de rôles avec l'argent virtuel
- Prix configurables par les admins
- Interface ephemeral (privée)

### 📊 Classements

#### `/topargent`
Affiche le classement des plus riches du serveur.

#### `/karma`
Affiche le classement du karma (bon et mauvais).

## 🛡️ Commandes Administrateur

### ⚙️ Configuration

#### `/config`
Interface principale de configuration.

**Sections :**
- Gestion des canaux de confession
- Configuration des logs administrateur
- Paramètres auto-thread pour confessions

**Fonctionnalités :**
- Ajout/suppression de canaux
- Configuration du canal de logs
- Paramètres d'auto-thread

#### `/autothread`
Configuration du système auto-thread global.

**Paramètres configurables :**
- Canaux d'auto-thread
- Nom des threads
- Temps d'archivage
- Mode lent

#### `/configeconomie`
Configuration complète du système économique.

**Sections :**
- Actions économiques (gains, cooldowns, activation)
- Boutique (ajout/suppression d'articles)
- Karma (récompenses et sanctions)
- Daily (montant et activation)

### 💰 Gestion Économique

#### `/ajoutargent [membre] [montant]`
Ajoute de l'argent à un membre.

**Paramètres :**
- `membre` - Utilisateur cible
- `montant` - Somme à ajouter

#### `/retraitargent [membre] [montant]`
Retire de l'argent à un membre.

**Paramètres :**
- `membre` - Utilisateur cible
- `montant` - Somme à retirer

#### `/ajoutkarma [membre] [type]`
Ajoute du karma à un membre.

**Paramètres :**
- `membre` - Utilisateur cible
- `type` - "bon" ou "mauvais"

#### `/retraitkarma [membre] [type]`
Retire du karma à un membre.

**Paramètres :**
- `membre` - Utilisateur cible
- `type` - "bon" ou "mauvais"

### 📊 Outils Admin

#### `/dashboard`
Fournit le lien vers le panel web de gestion.

#### `/stats`
Affiche les statistiques détaillées du serveur.

**Informations :**
- Nombre de confessions
- Activité économique
- Statistiques des utilisateurs
- Utilisation des commandes

## 🔐 Permissions

### Utilisateurs Standards
- Toutes les commandes utilisateur
- Confessions anonymes
- Participation à l'économie

### Modérateurs
- Accès aux commandes de configuration
- Gestion des confessions
- Consultation des logs

### Administrateurs
- Accès complet à toutes les commandes
- Gestion économique des utilisateurs
- Configuration avancée du bot

## ⏰ Cooldowns

| Commande | Cooldown | Notes |
|----------|----------|-------|
| `/travailler` | 1h | Configurable |
| `/pecher` | 45min | Configurable |
| `/voler` | 1h30 | Fixe |
| `/crime` | 3h | Configurable |
| `/parier` | 2h | Configurable |
| `/donner` | 30min | Fixe |
| `/daily` | 24h | Fixe |
| `/confess` | Rate limit | 5 tentatives/heure |

## 🎯 Conseils d'Utilisation

### Pour les Utilisateurs
- Utilisez `/economie` pour suivre vos progrès
- Les actions bonnes améliorent votre karma
- Le karma peut débloquer des récompenses spéciales
- Participez quotidiennement avec `/daily`

### Pour les Administrateurs
- Configurez les récompenses selon votre communauté
- Surveillez les logs pour la modération
- Ajustez les prix de la boutique régulièrement
- Utilisez le panel web pour une gestion avancée