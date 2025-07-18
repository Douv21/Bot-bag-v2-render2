// deploy-commands.js - Script pour enregistrer les commandes slash sur Discord

const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');

// Vérifier si le dossier commands existe
if (!fs.existsSync(commandsPath)) {
    console.error('❌ Le dossier "commands" n\'existe pas');
    process.exit(1);
}

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Charger toutes les commandes
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    try {
        const command = require(filePath);
        if (command.data) {
            commands.push(command.data.toJSON());
            console.log(`✅ Commande chargée: ${command.data.name}`);
        } else {
            console.warn(`⚠️ Commande sans data: ${file}`);
        }
    } catch (error) {
        console.error(`❌ Erreur lors du chargement de ${file}:`, error);
    }
}

// Construire et préparer une instance du module REST
const rest = new REST().setToken(process.env.TOKEN);

// Déployer les commandes
(async () => {
    try {
        console.log(`🚀 Déploiement de ${commands.length} commandes slash...`);

        // Méthode pour déployer globalement (prend jusqu'à 1 heure)
        // const data = await rest.put(
        //     Routes.applicationCommands(process.env.CLIENT_ID),
        //     { body: commands }
        // );

        // Méthode pour déployer sur un serveur spécifique (instantané)
        if (!process.env.GUILD_ID) {
            console.error('❌ GUILD_ID manquant dans les variables d\'environnement');
            console.log('💡 Ajoutez GUILD_ID=votre_server_id pour un déploiement instantané');
            process.exit(1);
        }

        const data = await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands }
        );

        console.log(`✅ ${data.length} commandes slash déployées avec succès sur le serveur ${process.env.GUILD_ID}`);
        
        // Afficher les commandes déployées
        console.log('\n📋 Commandes déployées:');
        data.forEach(cmd => {
            console.log(`  - /${cmd.name}: ${cmd.description}`);
        });

    } catch (error) {
        console.error('❌ Erreur lors du déploiement:', error);
        
        if (error.code === 50001) {
            console.log('💡 Erreur: Permissions manquantes. Vérifiez que le bot a les permissions applications.commands');
        }
        if (error.code === 10003) {
            console.log('💡 Erreur: Canal introuvable. Vérifiez CLIENT_ID et GUILD_ID');
        }
    }
})();
