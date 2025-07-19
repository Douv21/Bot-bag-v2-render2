// index.js - version corrigée avec prise en charge des interactions et serveur HTTP pour Render

const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection, Partials, Events } = require('discord.js');
const express = require('express');
require('dotenv').config();

// Configuration du serveur HTTP pour Render
const app = express();
const PORT = process.env.PORT || 3000;

// Configuration du bot Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel]
});

client.commands = new Collection();

// Chargement des commandes
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        try {
            const command = require(filePath);
            if (command.data && command.execute) {
                client.commands.set(command.data.name, command);
                console.log(`✅ Commande chargée: ${command.data.name}`);
            }
            if (command.commandName) {
                client.commands.set(command.commandName, command);
                console.log(`✅ Commande chargée: ${command.commandName}`);
            }
        } catch (error) {
            console.error(`❌ Erreur lors du chargement de la commande ${file}:`, error);
        }
    }
} else {
    console.warn('⚠️ Dossier commands non trouvé');
}

// Routes HTTP pour Render
app.get('/', (req, res) => {
    res.json({
        status: 'Bot Discord en ligne',
        bot: client.user ? client.user.tag : 'Non connecté',
        uptime: process.uptime(),
        commands: client.commands.size,
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        bot: client.user ? 'connected' : 'disconnected',
        guilds: client.guilds.cache.size
    });
});

app.get('/status', (req, res) => {
    res.json({
        ready: client.readyAt ? true : false,
        uptime: client.uptime,
        ping: client.ws.ping,
        guilds: client.guilds.cache.size,
        users: client.users.cache.size
    });
});

// Démarrer le serveur HTTP
app.listen(PORT, () => {
    console.log(`✅ Serveur HTTP démarré sur le port ${PORT}`);
});

// Événements du bot Discord
client.once('ready', () => {
    console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
    console.log(`🔗 Serveurs: ${client.guilds.cache.size}`);
    console.log(`👥 Utilisateurs: ${client.users.cache.size}`);
});

client.on(Events.InteractionCreate, async interaction => {
    try {
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) {
                console.warn(`❌ Commande non trouvée: ${interaction.commandName}`);
                return;
            }
            
            console.log(`📝 Exécution de la commande: ${interaction.commandName} par ${interaction.user.tag}`);
            await command.execute(interaction);
            
        } else if (interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) {
            const customId = interaction.customId;
            const [commandName] = customId.split('_');
            const command = client.commands.get(commandName);

            if (command && typeof command.handleInteraction === 'function') {
                console.log(`🔘 Gestion de l'interaction: ${customId} par ${interaction.user.tag}`);
                await command.handleInteraction(interaction);
            } else {
                console.warn(`❌ Aucune commande ou handler trouvé pour: ${customId}`);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: '❌ Cette interaction n\'est pas reconnue. Veuillez réessayer.',
                        flags: 64
                    });
                }
            }
        }
    } catch (error) {
        console.error('❌ Erreur dans InteractionCreate:', error);
        if (!interaction.replied && !interaction.deferred) {
            try {
                await interaction.reply({
                    content: '❌ Une erreur est survenue lors de l\'exécution de cette commande.',
                    flags: 64
                });
            } catch (replyError) {
                console.error('❌ Impossible de répondre à l\'interaction:', replyError);
            }
        }
    }
});

// Gestion des erreurs globales
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
});

// Événements de déconnexion/reconnexion
client.on('disconnect', () => {
    console.warn('⚠️ Bot déconnecté');
});

client.on('reconnecting', () => {
    console.log('🔄 Reconnexion en cours...');
});

client.on('error', (error) => {
    console.error('❌ Erreur Discord:', error);
});

// Connexion du bot
client.login(process.env.TOKEN).catch(error => {
    console.error('❌ Erreur de connexion:', error);
    process.exit(1);
});
