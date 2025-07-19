// index.js - Version corrigée pour Render avec gestion optimisée des interactions

const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection, Partials, Events } = require('discord.js');
const express = require('express');
require('dotenv').config();

// Configuration du serveur HTTP pour Render
const app = express();
const PORT = process.env.PORT || 10000; // Render utilise généralement des ports plus élevés

// Middleware pour parser JSON
app.use(express.json());

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
            // Supprimer le cache pour éviter les problèmes de rechargement
            delete require.cache[require.resolve(filePath)];
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

// Routes HTTP pour Render - Optimisées
app.get('/', (req, res) => {
    res.json({
        status: 'Bot Discord en ligne',
        bot: client.user ? client.user.tag : 'Non connecté',
        uptime: Math.floor(process.uptime()),
        commands: client.commands.size,
        guilds: client.guilds?.cache?.size || 0,
        timestamp: new Date().toISOString(),
        memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
    });
});

app.get('/health', (req, res) => {
    const isHealthy = client.isReady() && client.ws.status === 0;
    res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'healthy' : 'unhealthy',
        bot: client.user ? 'connected' : 'disconnected',
        guilds: client.guilds?.cache?.size || 0,
        ping: client.ws.ping || -1,
        ready: client.isReady()
    });
});

app.get('/status', (req, res) => {
    res.json({
        ready: client.readyAt ? true : false,
        uptime: client.uptime,
        ping: client.ws.ping,
        guilds: client.guilds?.cache?.size || 0,
        users: client.users?.cache?.size || 0,
        wsStatus: client.ws.status
    });
});

// Démarrer le serveur HTTP sur toutes les interfaces pour Render
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Serveur HTTP démarré sur le port ${PORT}`);
});

// Événements du bot Discord
client.once('ready', () => {
    console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
    console.log(`🔗 Serveurs: ${client.guilds.cache.size}`);
    console.log(`👥 Utilisateurs: ${client.users.cache.size}`);
    console.log(`📋 Commandes chargées: ${Array.from(client.commands.keys()).join(', ')}`);
    console.log(`🌐 Health check server running on port ${PORT}`);
    console.log(`🤖 Bot fully initialized for Render.com`);
});

// Gestion des interactions - VERSION CORRIGÉE
client.on(Events.InteractionCreate, async interaction => {
    try {
        // Gestion des commandes slash
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) {
                console.warn(`❌ Commande non trouvée: ${interaction.commandName}`);
                return;
            }
            
            console.log(`📝 Exécution de la commande: ${interaction.commandName} par ${interaction.user.tag}`);
            await command.execute(interaction);
        } 
        // Gestion des interactions (boutons, menus, modals) - CORRECTIF PRINCIPAL
        else if (interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) {
            // IMPORTANT: Répondre immédiatement pour éviter le timeout de 3 secondes
            if (!interaction.replied && !interaction.deferred) {
                await interaction.deferReply({ ephemeral: true });
            }

            const customId = interaction.customId;
            console.log(`🔘 Interaction reçue: ${customId} par ${interaction.user.tag}`);

            // Logique améliorée pour trouver la commande appropriée
            let command = null;
            let commandName = null;

            // Essayer de trouver la commande en cherchant dans toutes les commandes
            for (const [name, cmd] of client.commands) {
                if (customId.startsWith(name + '_') || customId === name) {
                    command = cmd;
                    commandName = name;
                    break;
                }
            }

            // Si pas trouvé avec la méthode ci-dessus, essayer l'ancienne méthode
            if (!command) {
                const [firstPart] = customId.split('_');
                command = client.commands.get(firstPart);
                commandName = firstPart;
            }

            console.log(`🔍 Recherche commande pour "${customId}" -> Trouvé: ${commandName || 'AUCUNE'}`);

            if (command && typeof command.handleInteraction === 'function') {
                console.log(`🔧 Traitement de l'interaction: ${customId} avec la commande ${commandName}`);
                await command.handleInteraction(interaction);
            } else {
                console.warn(`❌ Aucune commande ou handler trouvé pour: ${customId}`);
                console.warn(`❌ Commandes disponibles:`, Array.from(client.commands.keys()));
                
                // Réponse d'erreur appropriée selon l'état de l'interaction
                const errorMessage = {
                    content: `❌ Cette interaction "${customId}" n'est pas reconnue ou n'est plus disponible.\nCommandes disponibles: ${Array.from(client.commands.keys()).join(', ')}`,
                    ephemeral: true
                };

                if (interaction.deferred) {
                    await interaction.editReply(errorMessage);
                } else if (!interaction.replied) {
                    await interaction.reply(errorMessage);
                }
            }
        }
    } catch (error) {
        console.error('❌ Erreur dans InteractionCreate:', error);
        
        // Gestion d'erreur robuste
        try {
            const errorMessage = {
                content: '❌ Une erreur est survenue lors du traitement de cette interaction. Veuillez réessayer.',
                ephemeral: true
            };

            if (interaction.deferred) {
                await interaction.editReply(errorMessage);
            } else if (!interaction.replied) {
                await interaction.reply(errorMessage);
            } else {
                await interaction.followUp(errorMessage);
            }
        } catch (replyError) {
            console.error('❌ Impossible de répondre à l\'interaction:', replyError);
        }
    }
});

// Gestion des erreurs globales - Améliorée pour Render
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    // Ne pas exit immédiatement sur Render, log l'erreur
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

client.on('warn', (warning) => {
    console.warn('⚠️ Avertissement Discord:', warning);
});

// Gestion de l'arrêt gracieux pour Render
process.on('SIGTERM', () => {
    console.log('🔄 Signal SIGTERM reçu, arrêt gracieux...');
    client.destroy();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🔄 Signal SIGINT reçu, arrêt forcé...');
    client.destroy();
    process.exit(0);
});

// Connexion du bot avec retry logic
async function connectBot() {
    try {
        await client.login(process.env.TOKEN || process.env.DISCORD_TOKEN);
    } catch (error) {
        console.error('❌ Erreur de connexion:', error);
        
        // Retry après 5 secondes sur Render
        setTimeout(() => {
            console.log('🔄 Tentative de reconnexion...');
            connectBot();
        }, 5000);
    }
}

// Vérifier la présence du token
if (!process.env.TOKEN && !process.env.DISCORD_TOKEN) {
    console.error('❌ ERREUR: Token Discord manquant! Vérifiez vos variables d\'environnement.');
    process.exit(1);
}

// Démarrer la connexion
connectBot();
