// index.js - Bot Discord pour Render
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const express = require('express');
const config = require('./config.json');
const countingManager = require('./utils/countingManager');
const dataManager = require('./utils/dataManager');

// === CONFIGURATION ENVIRONNEMENT ===
const PORT = process.env.PORT || 3000;
const isRenderEnvironment = process.env.RENDER || false;

// === INITIALISATION CLIENT DISCORD ===
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();

// === CRÉATION DES DOSSIERS ===
function createDirectories() {
    const dirs = ['data', 'logs', 'temp_cards', 'data/backups'];
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`📁 Created directory: ${dir}`);
        }
    });
}
createDirectories(); // Appelé dès le début

// === CHARGEMENT DES COMMANDES ===
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
        console.warn(`[⚠️] Le fichier ${file} est incomplet (data/execute manquant).`);
    }
}

// === ENREGISTREMENT DES SLASH COMMANDS ===
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

async function deployCommands() {
    try {
        console.log(`🔁 Déploiement de ${commands.length} commandes...`);
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );
        console.log(`✅ ${data.length} commandes rechargées.`);
    } catch (error) {
        console.error('❌ Erreur lors du déploiement des commandes:', error);
    }
}

// === KEEP-ALIVE POUR RENDER ===
function startKeepAlive() {
    const app = express();

    app.get('/', (_, res) => {
        res.json({
            status: 'online',
            message: 'Bot is initializing...',
            timestamp: new Date().toISOString(),
            environment: 'render'
        });
    });

    app.get('/health', (_, res) => {
        res.json({
            status: 'healthy',
            memory: process.memoryUsage(),
            uptime: process.uptime()
        });
    });

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Serveur keep-alive en écoute sur le port ${PORT}`);
    });
}

// === ÉVÉNEMENT READY ===
client.once('ready', async () => {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);
    console.log(`🌐 Environnement : ${isRenderEnvironment ? 'Render.com' : 'Local'}`);

    await deployCommands();

    // Sauvegardes automatiques
    dataManager.startAutoBackup(15);

    // Serveur keep-alive lancé après que client.user est dispo
    startKeepAlive();

    console.log('🤖 Bot prêt pour la production');
});

// === ÉVÉNEMENTS MESSAGES ===
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    try {
        const economyManager = require('./utils/economyManager');

        let rewardsConfig = { enabled: true, amount: 1, cooldown: 60000 };
        try {
            rewardsConfig = JSON.parse(fs.readFileSync('./data/message_rewards.json', 'utf8'));
        } catch {}

        if (rewardsConfig.enabled && !economyManager.isOnCooldown(message.author.id, 'message_reward')) {
            await economyManager.addMoney(message.author.id, message.guild.id, rewardsConfig.amount);
            economyManager.setCooldown(message.author.id, 'message_reward', rewardsConfig.cooldown);
            console.log(`💰 ${message.author.tag} a gagné ${rewardsConfig.amount} coins.`);
        }

        await countingManager.handleMessage(message);

        if (!message.channel.name.includes('confession')) {
            let globalSettings = {};
            try {
                globalSettings = JSON.parse(fs.readFileSync('./data/autothread_global.json', 'utf8'));
            } catch {}

            const threadConfig = globalSettings[message.guild.id]?.autothread?.[message.channel.id];
            if (threadConfig?.enabled) {
                const thread = await message.startThread({
                    name: threadConfig.threadName || 'Discussion',
                    autoArchiveDuration: threadConfig.archiveTime || 60,
                    reason: 'Auto-thread'
                });
                if (threadConfig.slowMode > 0) {
                    await thread.setRateLimitPerUser(threadConfig.slowMode);
                }
                console.log(`🧵 Thread créé : ${thread.name}`);
            }
        }

    } catch (error) {
        console.error('❌ Erreur lors du traitement du message:', error);
    }
});

// === ÉVÉNEMENT INTERACTIONS ===
client.on('interactionCreate', async interaction => {
    try {
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return console.error(`Commande inconnue: ${interaction.commandName}`);
            await command.execute(interaction);
        }
    } catch (error) {
        console.error('❌ Erreur lors d’une interaction:', error);
        try {
            if (interaction.deferred || interaction.replied) {
                await interaction.followUp({ content: 'Erreur interne.', ephemeral: true });
            } else {
                await interaction.reply({ content: 'Erreur interne.', ephemeral: true });
            }
        } catch {}
    }
});

// === CONNEXION ===
client.login(process.env.DISCORD_TOKEN);
