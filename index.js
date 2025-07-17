const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const express = require('express');
const path = require('path');
const fs = require('fs');

// Configuration express pour Render.com
const app = express();
const PORT = process.env.PORT || 5000;

// Health check pour Render.com
app.use(express.json());
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        message: 'Discord Bot BAG v2 - Render Version',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        bot: client?.user?.tag || 'Disconnected',
        guilds: client?.guilds?.cache?.size || 0,
        uptime: process.uptime()
    });
});

// Démarrer le serveur web pour Render.com
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Serveur Render démarré sur port ${PORT}`);
});

// Configuration Discord Bot
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Initialize commands collection
client.commands = new Collection();

// Load commands avec gestion d'erreur améliorée
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

const commands = [];
for (const file of commandFiles) {
    try {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            commands.push(command.data.toJSON());
            console.log(`✅ Commande chargée: ${command.data.name}`);
        } else {
            console.log(`⚠️ Commande incomplète: ${filePath}`);
        }
    } catch (error) {
        console.error(`❌ Erreur chargement commande ${file}:`, error.message);
    }
}

// Register slash commands avec retry et timeout
const rest = new REST({ version: '10', timeout: 30000 }).setToken(process.env.DISCORD_TOKEN || 'your-bot-token');

async function deployCommands() {
    if (!process.env.CLIENT_ID || process.env.CLIENT_ID === 'your-client-id') {
        console.log('⚠️ CLIENT_ID non configuré - commandes slash non déployées');
        return;
    }
    
    let retries = 3;
    while (retries > 0) {
        try {
            console.log(`🔄 Déploiement commandes (tentative ${4 - retries})...`);

            const data = await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands },
            );

            console.log(`✅ ${data.length} commandes déployées avec succès`);
            return;
        } catch (error) {
            retries--;
            console.error(`❌ Erreur déploiement (${retries} tentatives restantes):`, error.message);
            if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 5000)); // Attendre 5s
            }
        }
    }
}

// Bot ready event avec stabilité améliorée
client.once('ready', async () => {
    console.log(`🤖 Bot connecté: ${client.user.tag}`);
    console.log(`📊 Serveurs: ${client.guilds.cache.size}`);
    
    // Deploy commands avec retry
    await deployCommands();
    
    // Démarrer les systèmes de monitoring uniquement si nécessaire
    if (process.env.NODE_ENV !== 'production') {
        console.log('🔧 Mode développement - monitoring désactivé');
    } else {
        console.log('🚀 Mode production - tous systèmes opérationnels');
    }
    
    // Définir le statut
    client.user.setStatus('online');
    client.user.setActivity('Confessions anonymes', { type: 'LISTENING' });
});

// Gestion des interactions avec timeout et retry pour Render.com
client.on('interactionCreate', async interaction => {
    try {
        // Timeout de sécurité pour éviter les blocages Render.com
        const timeout = setTimeout(() => {
            console.error('⚠️ Interaction timeout après 10s');
            if (!interaction.replied && !interaction.deferred) {
                interaction.reply({
                    content: '⚠️ Délai d\'attente dépassé. Veuillez réessayer.',
                    ephemeral: true
                }).catch(console.error);
            }
        }, 10000);

        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) {
                clearTimeout(timeout);
                return;
            }

            await command.execute(interaction);
            clearTimeout(timeout);
            
        } else if (interaction.isStringSelectMenu() || interaction.isRoleSelectMenu()) {
            // Gestion spéciale des sélecteurs pour Render.com
            const customId = interaction.customId;
            
            // Router les interactions vers les bonnes commandes
            if (customId.includes('economy_') || customId.includes('karma_')) {
                const economyCommand = client.commands.get('configeconomie');
                if (economyCommand && economyCommand.handleInteraction) {
                    await economyCommand.handleInteraction(interaction);
                }
            } else if (customId.includes('staff_')) {
                const staffCommand = client.commands.get('staff');
                if (staffCommand && staffCommand.handleSelectMenuInteraction) {
                    await staffCommand.handleSelectMenuInteraction(interaction);
                }
            } else if (customId.includes('config_')) {
                const configCommand = client.commands.get('config');
                if (configCommand && configCommand.handleSelectMenu) {
                    await configCommand.handleSelectMenu(interaction);
                }
            }
            
            clearTimeout(timeout);
            
        } else if (interaction.isButton()) {
            // Gestion des boutons
            const customId = interaction.customId;
            
            if (customId.includes('economy_') || customId.includes('karma_')) {
                const economyCommand = client.commands.get('configeconomie');
                if (economyCommand && economyCommand.handleInteraction) {
                    await economyCommand.handleInteraction(interaction);
                }
            } else if (customId.includes('staff_')) {
                const staffCommand = client.commands.get('staff');
                if (staffCommand && staffCommand.handleButtonInteraction) {
                    await staffCommand.handleButtonInteraction(interaction);
                }
            }
            
            clearTimeout(timeout);
            
        } else if (interaction.isModalSubmit()) {
            // Gestion des modals
            const customId = interaction.customId;
            
            if (customId.includes('economy_') || customId.includes('karma_')) {
                const economyCommand = client.commands.get('configeconomie');
                if (economyCommand && economyCommand.handleInteraction) {
                    await economyCommand.handleInteraction(interaction);
                }
            }
            
            clearTimeout(timeout);
        }
        
    } catch (error) {
        console.error('❌ Erreur interaction:', error);
        
        // Réponse d'erreur sécurisée
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Une erreur s\'est produite. Veuillez réessayer.',
                    ephemeral: true
                });
            } else if (interaction.deferred) {
                await interaction.editReply({
                    content: '❌ Une erreur s\'est produite. Veuillez réessayer.'
                });
            }
        } catch (replyError) {
            console.error('❌ Erreur réponse d\'erreur:', replyError.message);
        }
    }
});

// Gestion des messages pour rewards
client.on('messageCreate', async message => {
    if (message.author.bot) return;
    
    try {
        // Système de récompenses par message simplifié pour Render
        const economyManager = require('./utils/economyManager');
        if (economyManager && economyManager.handleMessageReward) {
            await economyManager.handleMessageReward(message);
        }
    } catch (error) {
        console.error('❌ Erreur message reward:', error.message);
    }
});

// Gestion des erreurs globales pour Render.com
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    // Ne pas arrêter le processus sur Render.com
});

// Graceful shutdown pour Render.com
process.on('SIGTERM', () => {
    console.log('🔄 SIGTERM reçu, arrêt propre...');
    client.destroy();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🔄 SIGINT reçu, arrêt propre...');
    client.destroy();
    process.exit(0);
});

// Login avec retry automatique
async function connectBot() {
    let retries = 5;
    while (retries > 0) {
        try {
            await client.login(process.env.DISCORD_TOKEN);
            break;
        } catch (error) {
            retries--;
            console.error(`❌ Erreur connexion (${retries} tentatives restantes):`, error.message);
            if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 10000)); // Attendre 10s
            }
        }
    }
}

// Démarrer le bot
connectBot();

module.exports = { client, app };
