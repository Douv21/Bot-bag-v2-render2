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
            console.log(`✅ Loaded command: ${command.data.name}`);
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
    
    // Liste des commandes chargées avec leurs handlers
    console.log('\n📋 Commandes chargées et leurs handlers:');
    client.commands.forEach((cmd, name) => {
        const handlers = [];
        if (cmd.handleButtonInteraction) handlers.push('Button');
        if (cmd.handleSelectMenuInteraction) handlers.push('SelectMenu');
        if (cmd.handleModalSubmit) handlers.push('Modal');
        console.log(`- ${name}: ${handlers.length > 0 ? handlers.join(', ') : 'Aucun handler'}`);
    });
    
    console.log('\n🤖 Bot fully initialized and ready for production on Render.com');
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

// Interaction event
client.on('interactionCreate', async interaction => {
    try {
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            
            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }
            
            console.log(`🔧 Executing slash command: ${interaction.commandName} by ${interaction.user.tag}`);
            await command.execute(interaction);
            
        } else if (interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) {
            const customId = interaction.customId;
            
            // Log de l'interaction reçue
            console.log(`🔍 Interaction reçue - Type: ${interaction.constructor.name}, CustomId: "${customId}", User: ${interaction.user.tag}`);
            
            // Méthode 1: Recherche par correspondance exacte du customId
            let command = null;
            let matchedCommandName = null;
            
            // D'abord, essayons de trouver une correspondance exacte
            for (const [cmdName, cmd] of client.commands) {
                if (customId.startsWith(cmdName)) {
                    command = cmd;
                    matchedCommandName = cmdName;
                    break;
                }
            }
            
            // Si pas trouvé, essayons avec une liste de commandes spécifiques
            if (!command) {
                const possibleCommands = ['configeconomie', 'economy', 'moderation', 'autothread', 'confession', 'config'];
                
                for (const cmdName of possibleCommands) {
                    if (customId.startsWith(cmdName)) {
                        command = interaction.client.commands.get(cmdName);
                        matchedCommandName = cmdName;
                        break;
                    }
                }
            }
            
            console.log(`🔍 Commande trouvée: ${matchedCommandName || 'AUCUNE'}`);
            
            if (command) {
                try {
                    let handlerExecuted = false;
                    
                    if (interaction.isButton() && command.handleButtonInteraction) {
                        console.log(`🔘 Gestion bouton pour: ${matchedCommandName}`);
                        await command.handleButtonInteraction(interaction);
                        handlerExecuted = true;
                    } else if (interaction.isStringSelectMenu() && command.handleSelectMenuInteraction) {
                        console.log(`📋 Gestion menu déroulant pour: ${matchedCommandName}`);
                        await command.handleSelectMenuInteraction(interaction);
                        handlerExecuted = true;
                    } else if (interaction.isModalSubmit() && command.handleModalSubmit) {
                        console.log(`📝 Gestion modale pour: ${matchedCommandName}`);
                        await command.handleModalSubmit(interaction);
                        handlerExecuted = true;
                    }
                    
                    if (!handlerExecuted) {
                        console.warn(`⚠️ Commande "${matchedCommandName}" trouvée mais pas de handler approprié pour le type d'interaction`);
                        console.warn(`- Type d'interaction: ${interaction.constructor.name}`);
                        console.warn(`- handleButtonInteraction: ${!!command.handleButtonInteraction}`);
                        console.warn(`- handleSelectMenuInteraction: ${!!command.handleSelectMenuInteraction}`);
                        console.warn(`- handleModalSubmit: ${!!command.handleModalSubmit}`);
                        
                        if (!interaction.replied && !interaction.deferred) {
                            await interaction.reply({ 
                                content: 'Cette interaction n\'est pas prise en charge par cette commande.', 
                                ephemeral: true 
                            });
                        }
                    }
                } catch (error) {
                    console.error(`❌ Erreur lors de la gestion de l'interaction ${customId}:`, error);
                    
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({ 
                            content: 'Une erreur est survenue lors du traitement de cette interaction.', 
                            ephemeral: true 
                        });
                    } else {
                        await interaction.followUp({ 
                            content: 'Une erreur est survenue lors du traitement de cette interaction.', 
                            ephemeral: true 
                        });
                    }
                }
            } else {
                console.warn(`⚠️ Aucune commande trouvée pour le customId: "${customId}"`);
                console.warn(`📋 Commandes disponibles: ${Array.from(client.commands.keys()).join(', ')}`);
                
                // Réponse optionnelle à l'utilisateur pour éviter les timeouts
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ 
                        content: 'Cette interaction n\'est pas reconnue. Veuillez réessayer ou contacter un administrateur si le problème persiste.', 
                        ephemeral: true 
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error handling interaction:', error);
        
        try {
            if (interaction.deferred || interaction.replied) {
                await interaction.followUp({ 
                    content: 'Une erreur est survenue lors de l\'exécution de cette commande.', 
                    ephemeral: true 
                });
            } else {
                await interaction.reply({ 
                    content: 'Une erreur est survenue lors de l\'exécution de cette commande.', 
                    ephemeral: true 
                });
            }
        } catch (followUpError) {
            console.error('Error sending error message:', followUpError);
        }
    }
});

// Error handling
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);
    process.exit(1);
});

// Graceful shutdown for Render.com
process.on('SIGTERM', () => {
    console.log('🔄 SIGTERM received, shutting down gracefully');
    client.destroy();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🔄 SIGINT received, shutting down gracefully');
    client.destroy();
    process.exit(0);
});

// Login to Discord
if (!process.env.DISCORD_TOKEN) {
    console.error('❌ DISCORD_TOKEN environment variable is required');
    process.exit(1);
}

if (!process.env.CLIENT_ID) {
    console.error('❌ CLIENT_ID environment variable is required');
    process.exit(1);
}

client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('❌ Failed to login to Discord:', error);
    process.exit(1);
});
