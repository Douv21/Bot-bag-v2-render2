// Configuration spéciale pour Render.com
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');
const countingManager = require('./utils/countingManager');
const dataManager = require('./utils/dataManager');

// Configuration pour Render.com
const PORT = process.env.PORT || 3000;
const isRenderEnvironment = process.env.RENDER || false;

// Keep-alive simplifié pour Render
function startKeepAlive() {
    const express = require('express');
    const app = express();
    
    // Health check endpoint requis par Render
    app.get('/', (req, res) => {
        res.json({
            status: 'online',
            bot: client.user ? client.user.tag : 'Starting...',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            environment: 'render'
        });
    });
    
    app.get('/health', (req, res) => {
        res.json({
            status: 'healthy',
            discord: client.readyAt ? 'connected' : 'connecting',
            memory: process.memoryUsage(),
            uptime: process.uptime()
        });
    });
    
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Keep-alive server running on port ${PORT}`);
        console.log(`🌐 Health check available at: http://localhost:${PORT}/health`);
    });
}

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Initialize commands collection
client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

const commands = [];
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    try {
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            commands.push(command.data.toJSON());
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    } catch (error) {
        console.error(`[ERROR] Failed to load command ${file}:`, error.message);
    }
}

// Register slash commands
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

async function deployCommands() {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error('Error deploying commands:', error);
    }
}

// Créer les dossiers nécessaires
function createDirectories() {
    const dirs = ['data', 'logs', 'temp_cards', 'data/backups'];
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`📁 Created directory: ${dir}`);
        }
    });
}

// Message reward system
async function handleMessageReward(message) {
    if (message.author.bot) return;
    
    try {
        const economyManager = require('./utils/economyManager');
        
        // Configuration des récompenses par message
        let messageRewardsConfig;
        try {
            messageRewardsConfig = JSON.parse(fs.readFileSync('./data/message_rewards.json', 'utf8'));
        } catch {
            messageRewardsConfig = {
                enabled: true,
                amount: 1,
                cooldown: 60000 // 1 minute
            };
        }
        
        if (!messageRewardsConfig.enabled) return;
        
        const userId = message.author.id;
        const guildId = message.guild.id;
        
        // Vérifier le cooldown
        if (economyManager.isOnCooldown(userId, 'message_reward')) {
            return;
        }
        
        // Ajouter l'argent
        await economyManager.addMoney(userId, guildId, messageRewardsConfig.amount);
        
        // Définir le cooldown
        economyManager.setCooldown(userId, 'message_reward', messageRewardsConfig.cooldown);
        
        console.log(`💰 ${message.author.tag} earned ${messageRewardsConfig.amount} coins for sending a message`);
    } catch (error) {
        console.error('Error in message reward system:', error);
    }
}

// Auto-thread creation
async function createAutoThread(message, globalSettings, config) {
    if (message.author.bot) return;
    
    try {
        const guildAutoThreads = globalSettings[message.guild.id]?.autothread || {};
        const channelConfig = guildAutoThreads[message.channel.id];
        
        if (!channelConfig || !channelConfig.enabled) return;
        
        const threadName = channelConfig.threadName || `Discussion - ${new Date().toLocaleDateString('fr-FR')}`;
        
        const thread = await message.startThread({
            name: threadName,
            autoArchiveDuration: channelConfig.archiveTime || 60,
            reason: 'Auto-thread créé automatiquement'
        });
        
        if (channelConfig.slowMode > 0) {
            await thread.setRateLimitPerUser(channelConfig.slowMode);
        }
        
        console.log(`🧵 Auto-thread créé: ${threadName} dans ${message.channel.name}`);
    } catch (error) {
        console.error('Erreur lors de la création auto-thread:', error);
    }
}

// ======================
// GESTIONNAIRES D'INTERACTIONS
// ======================

// Gestionnaire pour les sélecteurs
async function handleSelectMenu(interaction) {
    const { customId, values } = interaction;
    
    console.log(`📋 Sélecteur activé: ${customId} avec valeurs: ${values}`);
    
    try {
        switch (customId) {
            case 'role-select':
                await handleRoleSelect(interaction, values);
                break;
            case 'channel-select':
                await handleChannelSelect(interaction, values);
                break;
            case 'economy-shop':
                await handleEconomyShop(interaction, values);
                break;
            case 'music-playlist':
                await handleMusicPlaylist(interaction, values);
                break;
            case 'confession-category':
                await handleConfessionCategory(interaction, values);
                break;
            case 'moderation-action':
                await handleModerationAction(interaction, values);
                break;
            case 'game-select':
                await handleGameSelect(interaction, values);
                break;
            case 'settings-select':
                await handleSettingsSelect(interaction, values);
                break;
            default:
                await interaction.reply({
                    content: `❌ Sélecteur non reconnu: ${customId}`,
                    ephemeral: true
                });
        }
    } catch (error) {
        console.error(`❌ Erreur dans handleSelectMenu pour ${customId}:`, error);
        await interaction.reply({
            content: 'Une erreur est survenue avec ce sélecteur.',
            ephemeral: true
        });
    }
}

// Gestionnaire pour les boutons
async function handleButton(interaction) {
    const { customId } = interaction;
    
    console.log(`🔘 Bouton activé: ${customId}`);
    
    try {
        // Boutons de confirmation génériques
        if (customId === 'confirm-button') {
            await interaction.reply('✅ Action confirmée !');
            return;
        }
        
        if (customId === 'cancel-button') {
            await interaction.reply('❌ Action annulée.');
            return;
        }
        
        // Boutons de pagination
        if (customId.startsWith('page-')) {
            const page = customId.split('-')[1];
            await handlePagination(interaction, page);
            return;
        }
        
        // Boutons d'économie
        if (customId.startsWith('economy-')) {
            await handleEconomyButton(interaction);
            return;
        }
        
        // Boutons de musique
        if (customId.startsWith('music-')) {
            await handleMusicButton(interaction);
            return;
        }
        
        // Boutons de confession
        if (customId.startsWith('confession-')) {
            await handleConfessionButton(interaction);
            return;
        }
        
        // Boutons de modération
        if (customId.startsWith('mod-')) {
            await handleModerationButton(interaction);
            return;
        }
        
        // Boutons de jeux
        if (customId.startsWith('game-')) {
            await handleGameButton(interaction);
            return;
        }
        
        // Boutons de paramètres
        if (customId.startsWith('settings-')) {
            await handleSettingsButton(interaction);
            return;
        }
        
        // Bouton non reconnu
        await interaction.reply({
            content: `❌ Bouton non reconnu: ${customId}`,
            ephemeral: true
        });
        
    } catch (error) {
        console.error(`❌ Erreur dans handleButton pour ${customId}:`, error);
        await interaction.reply({
            content: 'Une erreur est survenue avec ce bouton.',
            ephemeral: true
        });
    }
}

// Gestionnaire pour les modals
async function handleModalSubmit(interaction) {
    const { customId } = interaction;
    
    console.log(`📝 Modal soumis: ${customId}`);
    
    try {
        switch (customId) {
            case 'confession-modal':
                await handleConfessionModal(interaction);
                break;
            case 'feedback-modal':
                await handleFeedbackModal(interaction);
                break;
            case 'report-modal':
                await handleReportModal(interaction);
                break;
            case 'suggestion-modal':
                await handleSuggestionModal(interaction);
                break;
            case 'ticket-modal':
                await handleTicketModal(interaction);
                break;
            default:
                await interaction.reply({
                    content: `❌ Modal non reconnu: ${customId}`,
                    ephemeral: true
                });
        }
    } catch (error) {
        console.error(`❌ Erreur dans handleModalSubmit pour ${customId}:`, error);
        await interaction.reply({
            content: 'Une erreur est survenue avec ce formulaire.',
            ephemeral: true
        });
    }
}

// ======================
// FONCTIONS SPÉCIFIQUES POUR SÉLECTEURS
// ======================

async function handleRoleSelect(interaction, values) {
    const selectedRole = values[0];
    await interaction.reply({
        content: `🎭 Vous avez sélectionné le rôle: **${selectedRole}**`,
        ephemeral: true
    });
}

async function handleChannelSelect(interaction, values) {
    const selectedChannel = values[0];
    await interaction.reply({
        content: `📢 Canal sélectionné: <#${selectedChannel}>`,
        ephemeral: true
    });
}

async function handleEconomyShop(interaction, values) {
    const item = values[0];
    await interaction.reply({
        content: `🛒 Vous voulez acheter: **${item}**`,
        ephemeral: true
    });
}

async function handleMusicPlaylist(interaction, values) {
    const song = values[0];
    await interaction.reply({
        content: `🎵 Chanson ajoutée à la playlist: **${song}**`,
        ephemeral: true
    });
}

async function handleConfessionCategory(interaction, values) {
    const category = values[0];
    await interaction.reply({
        content: `🤫 Catégorie de confession sélectionnée: **${category}**`,
        ephemeral: true
    });
}

async function handleModerationAction(interaction, values) {
    const action = values[0];
    await interaction.reply({
        content: `🛡️ Action de modération: **${action}**`,
        ephemeral: true
    });
}

async function handleGameSelect(interaction, values) {
    const game = values[0];
    await interaction.reply({
        content: `🎮 Jeu sélectionné: **${game}**`,
        ephemeral: true
    });
}

async function handleSettingsSelect(interaction, values) {
    const setting = values[0];
    await interaction.reply({
        content: `⚙️ Paramètre sélectionné: **${setting}**`,
        ephemeral: true
    });
}

// ======================
// FONCTIONS SPÉCIFIQUES POUR BOUTONS
// ======================

async function handlePagination(interaction, page) {
    await interaction.reply({
        content: `📄 Passage à la page **${page}**`,
        ephemeral: true
    });
}

async function handleEconomyButton(interaction) {
    const action = interaction.customId.split('-')[1];
    await interaction.reply({
        content: `💰 Action économie: **${action}**`,
        ephemeral: true
    });
}

async function handleMusicButton(interaction) {
    const action = interaction.customId.split('-')[1];
    
    switch (action) {
        case 'play':
            await interaction.reply('▶️ Lecture en cours...');
            break;
        case 'pause':
            await interaction.reply('⏸️ Musique mise en pause');
            break;
        case 'stop':
            await interaction.reply('⏹️ Musique arrêtée');
            break;
        case 'next':
            await interaction.reply('⏭️ Chanson suivante');
            break;
        case 'previous':
            await interaction.reply('⏮️ Chanson précédente');
            break;
        default:
            await interaction.reply(`🎵 Action musique: **${action}**`);
    }
}

async function handleConfessionButton(interaction) {
    const action = interaction.customId.split('-')[1];
    await interaction.reply({
        content: `🤫 Action confession: **${action}**`,
        ephemeral: true
    });
}

async function handleModerationButton(interaction) {
    const action = interaction.customId.split('-')[1];
    await interaction.reply({
        content: `🛡️ Action modération: **${action}**`,
        ephemeral: true
    });
}

async function handleGameButton(interaction) {
    const action = interaction.customId.split('-')[1];
    await interaction.reply({
        content: `🎮 Action jeu: **${action}**`,
        ephemeral: true
    });
}

async function handleSettingsButton(interaction) {
    const action = interaction.customId.split('-')[1];
    await interaction.reply({
        content: `⚙️ Action paramètres: **${action}**`,
        ephemeral: true
    });
}

// ======================
// FONCTIONS SPÉCIFIQUES POUR MODALS
// ======================

async function handleConfessionModal(interaction) {
    const confession = interaction.fields.getTextInputValue('confession-input');
    await interaction.reply({
        content: '🤫 Confession reçue et enregistrée !',
        ephemeral: true
    });
    
    // Ici vous pouvez ajouter la logique pour traiter la confession
    console.log(`Nouvelle confession de ${interaction.user.tag}: ${confession}`);
}

async function handleFeedbackModal(interaction) {
    const feedback = interaction.fields.getTextInputValue('feedback-input');
    await interaction.reply({
        content: '📝 Feedback reçu, merci !',
        ephemeral: true
    });
    
    console.log(`Nouveau feedback de ${interaction.user.tag}: ${feedback}`);
}

async function handleReportModal(interaction) {
    const report = interaction.fields.getTextInputValue('report-input');
    await interaction.reply({
        content: '🚨 Rapport reçu, il sera traité rapidement !',
        ephemeral: true
    });
    
    console.log(`Nouveau rapport de ${interaction.user.tag}: ${report}`);
}

async function handleSuggestionModal(interaction) {
    const suggestion = interaction.fields.getTextInputValue('suggestion-input');
    await interaction.reply({
        content: '💡 Suggestion reçue, merci !',
        ephemeral: true
    });
    
    console.log(`Nouvelle suggestion de ${interaction.user.tag}: ${suggestion}`);
}

async function handleTicketModal(interaction) {
    const ticketReason = interaction.fields.getTextInputValue('ticket-reason');
    await interaction.reply({
        content: '🎫 Ticket créé, un staff vous contactera bientôt !',
        ephemeral: true
    });
    
    console.log(`Nouveau ticket de ${interaction.user.tag}: ${ticketReason}`);
}

// ======================
// ÉVÉNEMENTS PRINCIPAUX
// ======================

// Bot ready event
client.once('ready', async () => {
    console.log(`✅ Ready! Logged in as ${client.user.tag}`);
    console.log(`🌐 Environment: ${isRenderEnvironment ? 'Render.com' : 'Local'}`);
    
    // Create necessary directories
    createDirectories();
    
    // Deploy commands
    await deployCommands();
    
    // Start backup system
    dataManager.startAutoBackup(15);
    console.log('📦 Automatic backup system started');
    
    // Start keep-alive server
    startKeepAlive();
    
    console.log('🤖 Bot fully initialized and ready for production on Render.com');
});

// Message event
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    
    try {
        // Handle message rewards
        await handleMessageReward(message);
        
        // Handle counting
        await countingManager.handleMessage(message);
        
        // Handle auto-thread (only for non-confession channels)
        if (!message.channel.name.includes('confession')) {
            let globalSettings = {};
            try {
                globalSettings = JSON.parse(fs.readFileSync('./data/autothread_global.json', 'utf8'));
            } catch {
                globalSettings = {};
            }
            
            await createAutoThread(message, globalSettings, config);
        }
    } catch (error) {
        console.error('Error handling message:', error);
    }
});

// Interaction event - GESTIONNAIRE PRINCIPAL
client.on('interactionCreate', async interaction => {
    try {
        // COMMANDES SLASH
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            
            if (!command) {
                console.error(`❌ No command matching ${interaction.commandName} was found.`);
                return;
            }
            
            console.log(`⚡ Commande exécutée: ${interaction.commandName} par ${interaction.user.tag}`);
            await command.execute(interaction);
        } 
        // SÉLECTEURS
        else if (interaction.isStringSelectMenu()) {
            await handleSelectMenu(interaction);
        }
        // BOUTONS
        else if (interaction.isButton()) {
            await handleButton(interaction);
        }
        // MODALS
        else if (interaction.isModalSubmit()) {
            await handleModalSubmit(interaction);
        }
        // AUTOCOMPLETE
        else if (interaction.isAutocomplete()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (command && command.autocomplete) {
                await command.autocomplete(interaction);
            }
        }
    } catch (error) {
        console.error('❌ Error handling interaction:', error);
        
        try {
            const errorMessage = {
                content: 'Une erreur est survenue lors de l\'exécution de cette commande.',
                ephemeral: true
            };
            
            if (interaction.deferred || interaction.replied) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        } catch (followUpError) {
            
