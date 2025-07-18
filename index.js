const { keepAlive, updateStatus } = require('./keep_alive');
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');
const countingManager = require('./utils/countingManager');
const dataManager = require('./utils/dataManager');
const StabilityMonitor = require('./stability_monitor');
const Error502Detector = require('./error_502_detector');
const UltraStabilityGuard = require('./ultra_stability_guard');
const MobileDisconnectGuard = require('./mobile_disconnect_guard');
const AndroidMobileFix = require('./android_mobile_fix');
const Android503Killer = require('./android_503_killer');

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
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// Register slash commands
const rest = new REST().setToken(process.env.DISCORD_TOKEN || 'your-bot-token');

async function deployCommands() {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID || 'your-client-id'),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error('Error deploying commands:', error);
    }
}

// Bot ready event
client.once('ready', async () => {
    console.log(`Ready! Logged in as ${client.user.tag}`);
    
    // Mettre à jour le statut keep-alive
    updateStatus('online');
    
    // Deploy commands
    await deployCommands();
    
    // Démarrer le système de backup automatique
    dataManager.startAutoBackup(15); // Backup toutes les 15 minutes
    console.log('📦 Système de backup automatique démarré');
    
    // Démarrer le moniteur de stabilité
    const stabilityMonitor = new StabilityMonitor();
    stabilityMonitor.startMonitoring();
    console.log('🔍 Moniteur de stabilité activé');
    
    // Démarrer le détecteur erreurs 502
    const error502Detector = new Error502Detector();
    error502Detector.startMonitoring();
    console.log('🚨 Détecteur erreurs 502 activé');
    
    // Démarrer le gardien de stabilité ultra-robuste
    const ultraStabilityGuard = new UltraStabilityGuard();
    ultraStabilityGuard.startGuarding();
    console.log('🛡️ Gardien ultra-stabilité activé');
    
    // Démarrer la protection contre déconnexions mobiles
    const mobileGuard = new MobileDisconnectGuard();
    mobileGuard.startGuarding();
    console.log('📱 Protection mobile activée');
    
    // Démarrer le fix spécifique Android
    const androidFix = new AndroidMobileFix();
    androidFix.startAndroidFix();
    console.log('📱 Android Mobile Fix activé');
    
    // Démarrer le tueur d'erreurs 503 Android
    const android503Killer = new Android503Killer();
    android503Killer.start();
    console.log('💀 Android 503 Killer activé');
    
    // Rendre accessible globalement
    global.mobileGuard = mobileGuard;
    global.androidFix = androidFix;
    global.android503Killer = android503Killer;
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync('./logs')) {
        fs.mkdirSync('./logs');
    }
    
    // Initialize confession logs file if it doesn't exist
    const logsPath = './logs/confessions.json';
    if (!fs.existsSync(logsPath)) {
        fs.writeFileSync(logsPath, JSON.stringify([], null, 2));
    }
});

// Handle slash command interactions
client.on('interactionCreate', async interaction => {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error('Error executing command:', error);
            
            const errorMessage = 'Il y a eu une erreur lors de l\'exécution de cette commande !';
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: errorMessage, flags: 64 });
            } else {
                await interaction.reply({ content: errorMessage, flags: 64 });
            }
        }
    }
    
    // Handle menu/button interactions for panel
    else if (interaction.isStringSelectMenu() || interaction.isChannelSelectMenu() || 
             interaction.isRoleSelectMenu() || interaction.isButton()) {
        
        // Handle config interactions
        if (interaction.customId && interaction.customId.startsWith('config_')) {
            const configCommand = client.commands.get('configconfession');
            if (configCommand && configCommand.handleInteraction) {
                try {
                    await configCommand.handleInteraction(interaction);
                } catch (error) {
                    console.error('Error handling config interaction:', error);
                }
            }
        }
        // Handle staff interactions
        else if (interaction.customId && interaction.customId.startsWith('staff_')) {
            const staffCommand = client.commands.get('staff');
            if (staffCommand) {
                try {
                    if (interaction.isButton()) {
                        await staffCommand.handleButtonInteraction(interaction);
                    } else if (interaction.isStringSelectMenu()) {
                        const action = interaction.values[0];
                        if (action === 'add_role') {
                            await staffCommand.showAddRoleSelector(interaction);
                        } else if (action === 'remove_role') {
                            await staffCommand.showRemoveRoleSelector(interaction);
                        } else if (action === 'refresh') {
                            await staffCommand.showStaffConfig(interaction);
                        } else {
                            await staffCommand.handleSelectMenuInteraction(interaction);
                        }
                    }
                } catch (error) {
                    console.error('Error handling staff interaction:', error);
                }
            }
        }
        // Handle autothread interactions
        else if (interaction.customId && interaction.customId.startsWith('autothread_')) {
            const autothreadCommand = client.commands.get('autothread');
            if (autothreadCommand && autothreadCommand.handleButtonInteraction) {
                try {
                    await autothreadCommand.handleButtonInteraction(interaction);
                } catch (error) {
                    console.error('Error handling autothread interaction:', error);
                }
            }
        }
        // Handle role select menus for economy
        else if (interaction.isRoleSelectMenu() && interaction.customId && (interaction.customId.startsWith('economy_karma_role_') || interaction.customId.startsWith('economy_shop_role_'))) {
            const configEconomyCommand = client.commands.get('configeconomie');
            if (configEconomyCommand) {
                try {
                    console.log('Routing role selection to configeconomie handler');
                    if (interaction.customId.startsWith('economy_karma_role_')) {
                        await configEconomyCommand.handleRoleSelection(interaction);
                    } else if (interaction.customId.startsWith('economy_shop_role_')) {
                        console.log('Shop role selection detected');
                        const itemType = interaction.customId.replace('economy_shop_role_', '');
                        const roleId = interaction.values[0];
                        await configEconomyCommand.showShopRoleModal(interaction, itemType, roleId);
                    }
                } catch (error) {
                    console.error('Error handling role selection:', error);
                }
            }
        }
        // Handle karma selector interactions
        else if (interaction.customId && (interaction.customId.startsWith('karma_good_select_') || interaction.customId.startsWith('karma_bad_select_'))) {
            console.log('Karma selector interaction detected:', interaction.customId);
            const configEconomyCommand = client.commands.get('configeconomie');
            if (configEconomyCommand) {
                try {
                    console.log('Routing karma selector to configeconomie handler');
                    await configEconomyCommand.handleSelectMenuInteraction(interaction);
                } catch (error) {
                    console.error('Error handling karma selector interaction:', error);
                }
            }
        }
        // Handle counting interactions
        else if (interaction.customId && interaction.customId.startsWith('counting_')) {
            const countingCommand = client.commands.get('compter');
            if (countingCommand) {
                try {
                    if (interaction.isButton()) {
                        await countingCommand.handleButtonInteraction(interaction);
                    } else if (interaction.isStringSelectMenu()) {
                        await countingCommand.handleSelectMenuInteraction(interaction);
                    } else if (interaction.isModalSubmit()) {
                        await countingCommand.handleModalSubmit(interaction);
                    }
                } catch (error) {
                    console.error('Error handling counting interaction:', error);
                }
            }
        }
        // Handle economy interactions
        else if (interaction.customId && interaction.customId.startsWith('economy_')) {
            console.log('Economy interaction detected:', interaction.customId);
            
            // Determine which command to route to
            if (interaction.customId.includes('config') || interaction.customId.includes('karma') || interaction.customId.includes('shop_actions') || interaction.customId.includes('shop_type') || interaction.customId.includes('shop_remove') || interaction.customId.includes('daily') || interaction.customId.includes('action_settings') || interaction.customId.includes('action_config')) {
                const configEconomyCommand = client.commands.get('configeconomie');
                if (configEconomyCommand) {
                    try {
                        console.log('Routing to configeconomie handler');
                        if (interaction.isStringSelectMenu()) {
                            await configEconomyCommand.handleSelectMenuInteraction(interaction);
                        } else if (interaction.isButton()) {
                            await configEconomyCommand.handleButtonInteraction(interaction);
                        }
                    } catch (error) {
                        console.error('Error handling configeconomie interaction:', error);
                    }
                }
            } else {
                // Route to regular economy command (actions like work, fish, etc.)
                const economyCommand = client.commands.get('boutique');
                if (economyCommand) {
                    try {
                        console.log('Routing to economy handler');
                        if (interaction.isButton()) {
                            await economyCommand.handleButtonInteraction(interaction);
                        } else if (interaction.isStringSelectMenu()) {
                            await economyCommand.handleSelectMenuInteraction(interaction);
                        }
                    } catch (error) {
                        console.error('Error handling economy interaction:', error);
                    }
                }
            }
        }

    }
    
    // Handle modal submissions
    if (interaction.isModalSubmit()) {
        console.log('Modal submission detected:', interaction.customId);
        if (interaction.customId && interaction.customId.startsWith('economy_')) {
            const configEconomyCommand = client.commands.get('configeconomie');
            if (configEconomyCommand && configEconomyCommand.handleModalSubmit) {
                try {
                    console.log('Processing economy modal submission');
                    await configEconomyCommand.handleModalSubmit(interaction);
                } catch (error) {
                    console.error('Error handling economy modal:', error);
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            content: '❌ Erreur lors du traitement du formulaire.',
                            flags: 64
                        });
                    }
                }
            }
        }

    }
});

// Message reward system
async function handleMessageReward(message) {
    try {
        const fs = require('fs');
        const path = require('path');
        const economyManager = require('./utils/economyManager');
        
        const guildId = message.guild.id;
        const userId = message.author.id;
        
        // Load message reward configuration avec dataManager
        const messageRewardsData = dataManager.loadData('message_rewards.json', {});
        let messageConfig = messageRewardsData[guildId] || { enabled: false, amount: 1, cooldown: 60 };
        
        // Check if message rewards are enabled
        if (!messageConfig.enabled) return;
        
        // Check cooldown for this user
        const cooldownKey = `${guildId}_${userId}_message_reward`;
        const cooldownCheck = await economyManager.checkCooldown(userId, guildId, 'message_reward');
        
        if (cooldownCheck && !cooldownCheck.canExecute) return; // User is in cooldown
        
        // Give reward
        const userStats = await economyManager.getUserStats(userId, guildId);
        userStats.user.balance += messageConfig.amount;
        
        // Save user data avec dataManager
        const usersData = dataManager.loadData('users.json', {});
        const userKey = `${guildId}_${userId}`;
        usersData[userKey] = userStats.user;
        dataManager.saveData('users.json', usersData);
        
        // Set cooldown
        await economyManager.setCooldown(userId, guildId, 'message_reward', messageConfig.cooldown);
        
        console.log(`💶 ${message.author.username} a gagné ${messageConfig.amount}€ pour son message`);
        
        // Créer backup de sécurité après chaque récompense
        dataManager.createManualBackup('users.json', 'message_reward');
        
    } catch (error) {
        console.error('Erreur système de récompense message:', error);
    }
}

// Listen for message events for global auto-thread, message rewards, and counting
client.on('messageCreate', async message => {
    // Signaler activité au gardien mobile
    if (global.mobileGuard) {
        global.mobileGuard.handleDiscordEvent();
    }
    
    // Skip if bot message or system message
    if (message.author.bot || message.system) return;
    
    try {
        // Check if it's a counting channel first
        const guildId = message.guild.id;
        const channelId = message.channel.id;
        const countingConfig = countingManager.getCountingConfig(guildId);
        const isCountingChannel = countingConfig.channels.some(c => c.channelId === channelId);

        if (isCountingChannel) {
            // Process counting message
            const validation = await countingManager.validateCountingMessage(message);
            
            if (validation.valid) {
                await countingManager.processCountingMessage(message, validation);
            } else if (!validation.ignore) {
                // Only process invalid messages that shouldn't be ignored
                await countingManager.processInvalidMessage(message, validation);
            }
            // If validation.ignore is true, we completely ignore the message (no reactions, no errors)
            
            // Don't process message rewards or auto-threads in counting channels
            return;
        }
    } catch (error) {
        console.error('Erreur système de comptage:', error);
    }
    
    // Handle message reward system (only if not a counting channel)
    await handleMessageReward(message);
    
    // Track user message statistics and add XP
    try {
        const userInfoCommand = require('./commands/userinfo');
        if (userInfoCommand && userInfoCommand.incrementMessageCount) {
            userInfoCommand.incrementMessageCount(message.author.id, message.guild.id);
        }
        
        // Add XP for message (1 XP per message)
        const economyManager = require('./utils/economyManager');
        const userData = await economyManager.getOrCreateUser(message.author.id, message.guild.id);
        userData.xp = (userData.xp || 0) + 1;
        
        // Save updated user data
        const users = economyManager.loadUsers();
        const userKey = `${message.guild.id}_${message.author.id}`;
        users[userKey] = userData;
        economyManager.saveUsers(users);
    } catch (error) {
        console.error('Erreur suivi statistiques/XP:', error);
    }
    
    // Skip if it's in a thread already
    if (message.channel.isThread()) return;
    
    try {
        delete require.cache[require.resolve('./config.json')];
        const config = require('./config.json');
        const guildId = message.guild.id;
        
        console.log(`Message reçu de ${message.author.username} dans ${message.channel.name} (Guild: ${guildId})`);
        console.log(`Configuration disponible:`, Object.keys(config).filter(key => !Array.isArray(config[key]) && typeof config[key] === 'object'));
        
        // Check if global auto-thread is configured for this guild
        if (!config[guildId] || !config[guildId].globalAutoThread) {
            console.log(`Pas de configuration auto-thread global pour le serveur ${guildId}`);
            // Fallback : essayer la configuration globale legacy
            if (config.globalAutoThread) {
                console.log(`Utilisation de la configuration globale legacy`);
                const globalSettings = config.globalAutoThread;
                
                if (!globalSettings.channels || !globalSettings.channels.includes(message.channel.id)) {
                    console.log(`Canal ${message.channel.name} non configuré pour auto-thread global`);
                    return;
                }
                
                await createAutoThread(message, globalSettings, config);
            }
            return;
        }
        
        const globalSettings = config[guildId].globalAutoThread;
        
        // Check if this channel has global auto-thread enabled
        if (!globalSettings.channels || !globalSettings.channels.includes(message.channel.id)) {
            console.log(`Canal ${message.channel.name} non configuré pour auto-thread global`);
            return;
        }
        
        console.log(`Message détecté dans canal auto-thread global: ${message.channel.name}`);
        console.log(`Settings globales:`, globalSettings);
        
        // Skip confessions if excludeConfessions is true
        if (globalSettings.excludeConfessions) {
            // Check if this channel is a confession channel
            if (config.confessionChannels && config.confessionChannels.includes(message.channel.id)) {
                console.log(`Auto-thread global ignoré sur canal de confession: ${message.channel.name}`);
                return;
            }
        }
        
        // Count existing threads for numbering
        const threads = await message.channel.threads.fetchActive();
        const threadCount = threads.threads.size + 1;
        
        // Create thread name
        let threadName = globalSettings.threadName || "Discussion - Message #{count}";
        threadName = threadName.replace('#{count}', threadCount);
        
        // Limit thread name to 100 characters
        if (threadName.length > 100) {
            threadName = threadName.substring(0, 97) + '...';
        }
        
        await createAutoThread(message, globalSettings, config);
        
    } catch (error) {
        console.error('Erreur création auto-thread global:', error);
    }
});

async function createAutoThread(message, globalSettings, config) {
    try {
        // Skip confessions if excludeConfessions is true
        if (globalSettings.excludeConfessions) {
            if (config.confessionChannels && config.confessionChannels.includes(message.channel.id)) {
                console.log(`Auto-thread global ignoré sur canal de confession: ${message.channel.name}`);
                return;
            }
        }
        
        // Count existing threads for numbering
        const threads = await message.channel.threads.fetchActive();
        const threadCount = threads.threads.size + 1;
        
        // Create thread name
        let threadName = globalSettings.threadName || "Discussion - Message #{count}";
        threadName = threadName.replace('#{count}', threadCount);
        
        // Limit thread name to 100 characters
        if (threadName.length > 100) {
            threadName = threadName.substring(0, 97) + '...';
        }
        
        console.log(`Création du thread: ${threadName}`);
        
        // Create the thread
        const thread = await message.startThread({
            name: threadName,
            autoArchiveDuration: globalSettings.archiveAfter || 60,
            reason: 'Auto-thread global - Needle style'
        });
        
        // Apply slowmode if configured
        if (globalSettings.slowMode && globalSettings.slowMode > 0) {
            await thread.setRateLimitPerUser(globalSettings.slowMode);
        }
        
        console.log(`✅ Auto-thread global créé: ${threadName} dans ${message.channel.name}`);
        
    } catch (error) {
        console.error('Erreur lors de la création du thread:', error);
    }
}

// Error handling et reconnexion automatique
client.on('error', error => {
    console.error('Discord client error:', error);
    updateStatus('offline');
});

client.on('disconnect', () => {
    console.log('Bot disconnected - tentative de reconnexion...');
    updateStatus('offline');
    
    // Tentative de reconnexion après 5 secondes
    setTimeout(() => {
        console.log('Tentative de reconnexion Discord...');
        client.login(process.env.DISCORD_TOKEN).catch(console.error);
    }, 5000);
});

client.on('resume', () => {
    console.log('Bot reconnecté avec succès');
    updateStatus('online');
});

client.on('warn', warning => {
    console.warn('Discord warning:', warning);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);
    // Ne pas arrêter le processus pour les erreurs non critiques
});

// Monitoring de la connexion Discord
setInterval(() => {
    if (client.readyAt) {
        const now = Date.now();
        const lastReady = client.readyAt.getTime();
        const timeSinceReady = now - lastReady;
        
        // Si plus de 10 minutes sans activité, forcer une reconnexion
        if (timeSinceReady > 600000) {
            console.log('Connexion Discord inactive - reconnexion forcée');
            client.destroy();
            setTimeout(() => {
                client.login(process.env.DISCORD_TOKEN).catch(console.error);
            }, 2000);
        }
    }
}, 300000); // Vérifier toutes les 5 minutes

// Démarrer le serveur keep-alive
keepAlive();

// Import server
const server = require('./server');

// Login to Discord
client.login(process.env.DISCORD_TOKEN || 'your-bot-token').then(() => {
    // Initialize server with Discord client
    server.initializeServer(client);
    server.startServer();
}).catch(error => {
    console.error('Erreur de connexion Discord:', error);
});
