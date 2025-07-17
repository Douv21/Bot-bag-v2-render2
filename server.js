const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');
const logger = require('./utils/logger');
const rateLimit = require('./utils/rateLimit');

const app = express();
const PORT = process.env.PORT || 5000;

// Configuration pour les CORS et headers de sécurité
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'panel')));

// Variables globales pour stocker les données du bot
let discordClient = null;
let botStatus = 'offline';

// Fonction pour initialiser le serveur avec le client Discord
function initializeServer(client) {
    discordClient = client;
    botStatus = 'online';
    console.log('Serveur web initialisé avec le client Discord');
}

// Route principale - Panel de configuration
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'panel', 'index.html'));
});

// ===== ENDPOINTS UPTIMEROBOT =====
// Endpoints pour UptimeRobot monitoring (proxy vers port 3000)

// Endpoint ping simple pour UptimeRobot
app.get('/ping', (req, res) => {
    try {
        res.status(200).send('pong');
    } catch (error) {
        console.error('Erreur endpoint ping:', error);
        res.status(500).send('error');
    }
});

// Endpoint de santé pour UptimeRobot
app.get('/health', async (req, res) => {
    try {
        // Proxy vers le serveur keep-alive
        const healthReq = http.get('http://localhost:3000/health', (healthRes) => {
            let data = '';
            healthRes.on('data', chunk => data += chunk);
            healthRes.on('end', () => {
                try {
                    const healthData = JSON.parse(data);
                    res.status(200).json(healthData);
                } catch (e) {
                    res.status(503).json({ status: 'error', message: 'Invalid health response' });
                }
            });
        });
        
        healthReq.on('error', () => {
            res.status(503).json({ status: 'error', message: 'Keep-alive server unreachable' });
        });
        
        healthReq.setTimeout(5000, () => {
            healthReq.destroy();
            res.status(504).json({ status: 'error', message: 'Health check timeout' });
        });
        
    } catch (error) {
        console.error('Erreur endpoint health:', error);
        res.status(503).json({ status: 'error', message: 'Service temporarily unavailable' });
    }
});

// Endpoint de statut pour UptimeRobot
app.get('/status', (req, res) => {
    try {
        res.status(200).json({
            online: true,
            status: botStatus,
            bot_connected: discordClient ? true : false,
            timestamp: Date.now(),
            uptime: process.uptime(),
            service: 'discord-bot'
        });
    } catch (error) {
        console.error('Erreur endpoint status:', error);
        res.status(500).json({
            online: false,
            error: 'Service error'
        });
    }
});

// Endpoint métriques pour UptimeRobot
app.get('/metrics', (req, res) => {
    try {
        const metrics = {
            uptime_seconds: Math.floor(process.uptime()),
            memory_usage_mb: Math.round(process.memoryUsage().rss / 1024 / 1024),
            bot_status: botStatus,
            bot_connected: discordClient ? true : false,
            process_id: process.pid,
            node_version: process.version,
            timestamp: Date.now()
        };
        
        res.status(200).json(metrics);
    } catch (error) {
        console.error('Erreur endpoint metrics:', error);
        res.status(500).json({
            error: 'Metrics unavailable'
        });
    }
});

// Endpoint spécifique pour monitorer le bot Discord
app.get('/bot', (req, res) => {
    try {
        if (discordClient && discordClient.isReady()) {
            res.status(200).json({
                bot_status: 'online',
                discord_connected: true,
                user_tag: discordClient.user.tag,
                guild_count: discordClient.guilds.cache.size,
                ping: discordClient.ws.ping,
                uptime: Math.floor(discordClient.uptime / 1000),
                timestamp: Date.now()
            });
        } else {
            res.status(503).json({
                bot_status: 'offline',
                discord_connected: false,
                error: 'Bot not connected to Discord'
            });
        }
    } catch (error) {
        console.error('Erreur endpoint bot:', error);
        res.status(503).json({
            bot_status: 'error',
            discord_connected: false,
            error: 'Bot status check failed'
        });
    }
});

// Endpoint ping simple spécifique au bot
app.get('/bot/ping', (req, res) => {
    try {
        if (discordClient && discordClient.isReady()) {
            res.status(200).send('bot-online');
        } else {
            res.status(503).send('bot-offline');
        }
    } catch (error) {
        console.error('Erreur ping bot:', error);
        res.status(503).send('bot-error');
    }
});

// ===== FIN ENDPOINTS UPTIMEROBOT =====

// API Routes

// Statut du bot et données générales
app.get('/api/status', async (req, res) => {
    try {
        const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
        const stats = logger.getStatistics();
        
        const guilds = discordClient ? await getGuildsData() : [];
        
        res.json({
            status: botStatus,
            guilds: guilds,
            config: config,
            stats: stats || {
                totalConfessions: 0,
                uniqueUsers: 0,
                last24Hours: 0,
                textOnly: 0,
                imageOnly: 0,
                textAndImage: 0
            }
        });
    } catch (error) {
        console.error('Erreur API status:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Données d'un serveur spécifique
app.get('/api/guild/:guildId', async (req, res) => {
    try {
        if (!discordClient) {
            return res.status(503).json({ error: 'Bot non connecté' });
        }
        
        const guild = discordClient.guilds.cache.get(req.params.guildId);
        if (!guild) {
            return res.status(404).json({ error: 'Serveur non trouvé' });
        }
        
        const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
        
        // Récupérer les canaux textuels
        const channels = guild.channels.cache
            .filter(channel => channel.type === 0) // Type 0 = Text Channel
            .map(channel => ({
                id: channel.id,
                name: channel.name,
                type: 'text'
            }));
        
        // Récupérer les rôles
        const roles = guild.roles.cache
            .filter(role => role.name !== '@everyone')
            .map(role => ({
                id: role.id,
                name: role.name,
                color: role.hexColor
            }));
        
        res.json({
            id: guild.id,
            name: guild.name,
            channels: channels,
            roles: roles,
            logChannel: config.logChannelId || null
        });
        
    } catch (error) {
        console.error('Erreur API guild:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Ajouter un canal de confession
app.post('/api/config/confession-channels', async (req, res) => {
    try {
        const { guildId, channelId } = req.body;
        
        if (!guildId || !channelId) {
            return res.status(400).json({ error: 'GuildId et channelId requis' });
        }
        
        // Lire la configuration actuelle
        const configPath = './config.json';
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        // Vérifier si le canal existe déjà
        if (config.confessionChannels.includes(channelId)) {
            return res.status(400).json({ error: 'Canal déjà configuré' });
        }
        
        // Ajouter le canal
        config.confessionChannels.push(channelId);
        
        // Sauvegarder
        fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
        
        res.json({ success: true, message: 'Canal ajouté' });
        
    } catch (error) {
        console.error('Erreur ajout canal:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Supprimer un canal de confession
app.delete('/api/config/confession-channels/:channelId', async (req, res) => {
    try {
        const { channelId } = req.params;
        
        // Lire la configuration actuelle
        const configPath = './config.json';
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        // Supprimer le canal
        const index = config.confessionChannels.indexOf(channelId);
        if (index > -1) {
            config.confessionChannels.splice(index, 1);
            fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
            res.json({ success: true, message: 'Canal supprimé' });
        } else {
            res.status(404).json({ error: 'Canal non trouvé' });
        }
        
    } catch (error) {
        console.error('Erreur suppression canal:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Configurer le canal de logs
app.post('/api/config/log-channel', async (req, res) => {
    try {
        const { guildId, channelId } = req.body;
        
        // Lire la configuration actuelle
        const configPath = './config.json';
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        // Configurer le canal de log
        if (channelId) {
            config.logChannelId = channelId;
        } else {
            delete config.logChannelId;
        }
        
        // Sauvegarder
        fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
        
        res.json({ success: true, message: 'Canal de log configuré' });
        
    } catch (error) {
        console.error('Erreur config canal log:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Ajouter un rôle admin
app.post('/api/config/admin-roles', async (req, res) => {
    try {
        const { roleName } = req.body;
        
        if (!roleName) {
            return res.status(400).json({ error: 'RoleName requis' });
        }
        
        // Lire la configuration actuelle
        const configPath = './config.json';
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        // Vérifier si le rôle existe déjà
        if (config.adminRoles.includes(roleName)) {
            return res.status(400).json({ error: 'Rôle déjà configuré' });
        }
        
        // Ajouter le rôle
        config.adminRoles.push(roleName);
        
        // Sauvegarder
        fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
        
        res.json({ success: true, message: 'Rôle ajouté' });
        
    } catch (error) {
        console.error('Erreur ajout rôle:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Supprimer un rôle admin
app.delete('/api/config/admin-roles/:roleName', async (req, res) => {
    try {
        const roleName = decodeURIComponent(req.params.roleName);
        
        // Lire la configuration actuelle
        const configPath = './config.json';
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        // Supprimer le rôle
        const index = config.adminRoles.indexOf(roleName);
        if (index > -1) {
            config.adminRoles.splice(index, 1);
            fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
            res.json({ success: true, message: 'Rôle supprimé' });
        } else {
            res.status(404).json({ error: 'Rôle non trouvé' });
        }
        
    } catch (error) {
        console.error('Erreur suppression rôle:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Sauvegarder les paramètres
app.post('/api/config/settings', async (req, res) => {
    try {
        const settings = req.body;
        
        // Validation des paramètres
        if (!settings.rateLimitMax || !settings.rateLimitWindow || !settings.maxTextLength || !settings.maxImageSize) {
            return res.status(400).json({ error: 'Paramètres manquants' });
        }
        
        // Lire la configuration actuelle
        const configPath = './config.json';
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        // Mettre à jour les paramètres
        config.rateLimitMax = settings.rateLimitMax;
        config.rateLimitWindow = settings.rateLimitWindow;
        config.maxTextLength = settings.maxTextLength;
        config.maxImageSize = settings.maxImageSize;
        config.requireContent = settings.requireContent;
        config.allowTextOnly = settings.allowTextOnly;
        config.allowImageOnly = settings.allowImageOnly;
        config.allowBoth = settings.allowBoth;
        
        // Sauvegarder
        fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
        
        res.json({ success: true, message: 'Paramètres sauvegardés' });
        
    } catch (error) {
        console.error('Erreur sauvegarde paramètres:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Récupérer les logs
app.get('/api/logs', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const logs = logger.getConfessionLogs(limit);
        
        res.json(logs);
        
    } catch (error) {
        console.error('Erreur récupération logs:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Rechercher une confession par ID
app.get('/api/confession/:messageId', async (req, res) => {
    try {
        const confession = logger.getConfessionById(req.params.messageId);
        
        if (!confession) {
            return res.status(404).json({ error: 'Confession non trouvée' });
        }
        
        res.json(confession);
        
    } catch (error) {
        console.error('Erreur recherche confession:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Confessions d'un utilisateur
app.get('/api/user/:userId/confessions', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const confessions = logger.getConfessionsByUser(req.params.userId, limit);
        
        res.json(confessions);
        
    } catch (error) {
        console.error('Erreur confessions utilisateur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Statistiques des limites de taux
app.get('/api/rate-limit/stats', async (req, res) => {
    try {
        const stats = rateLimit.getStatistics();
        res.json(stats);
        
    } catch (error) {
        console.error('Erreur stats rate limit:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Réinitialiser la limite d'un utilisateur
app.post('/api/rate-limit/reset/:userId', async (req, res) => {
    try {
        rateLimit.resetUserLimit(req.params.userId);
        res.json({ success: true, message: 'Limite réinitialisée' });
        
    } catch (error) {
        console.error('Erreur reset rate limit:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Fonction utilitaire pour récupérer les données des serveurs
async function getGuildsData() {
    if (!discordClient) return [];
    
    const guilds = [];
    
    for (const [guildId, guild] of discordClient.guilds.cache) {
        try {
            guilds.push({
                id: guild.id,
                name: guild.name,
                memberCount: guild.memberCount,
                iconURL: guild.iconURL()
            });
        } catch (error) {
            console.error(`Erreur récupération serveur ${guildId}:`, error);
        }
    }
    
    return guilds;
}

// Gestion des erreurs 404
app.use((req, res) => {
    res.status(404).json({ error: 'Route non trouvée' });
});

// Gestion des erreurs globales
app.use((error, req, res, next) => {
    console.error('Erreur serveur:', error);
    res.status(500).json({ error: 'Erreur serveur interne' });
});

// Endpoints Auto-Thread
app.post('/api/config/autothread/add', (req, res) => {
    try {
        const { guildId, channelId } = req.body;
        const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
        
        if (!config.autoThreadSettings) {
            config.autoThreadSettings = {
                enabled: true,
                channels: [],
                threadName: "Discussion - Confession #{count}",
                archiveAfter: 60,
                slowMode: 0
            };
        }
        
        if (!config.autoThreadSettings.channels.includes(channelId)) {
            config.autoThreadSettings.channels.push(channelId);
            fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Erreur ajout canal autothread:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.post('/api/config/autothread/remove', (req, res) => {
    try {
        const { guildId, channelId } = req.body;
        const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
        
        if (config.autoThreadSettings && config.autoThreadSettings.channels) {
            const index = config.autoThreadSettings.channels.indexOf(channelId);
            if (index > -1) {
                config.autoThreadSettings.channels.splice(index, 1);
                fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
            }
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Erreur suppression canal autothread:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.post('/api/config/autothread/settings', (req, res) => {
    try {
        const { guildId, settings } = req.body;
        const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
        
        if (!config.autoThreadSettings) {
            config.autoThreadSettings = { channels: [] };
        }
        
        Object.assign(config.autoThreadSettings, settings);
        fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
        
        res.json({ success: true });
    } catch (error) {
        console.error('Erreur sauvegarde paramètres autothread:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Démarrer le serveur
// Endpoints pour auto-thread global
app.post('/api/autothread/global/add', async (req, res) => {
    try {
        const { guildId, channelId } = req.body;
        const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
        
        if (!config[guildId]) config[guildId] = {};
        if (!config[guildId].globalAutoThread) {
            config[guildId].globalAutoThread = {
                channels: [],
                threadName: "Discussion - Message #{count}",
                archiveAfter: 60,
                slowMode: 0,
                excludeConfessions: true
            };
        }
        
        if (!config[guildId].globalAutoThread.channels.includes(channelId)) {
            config[guildId].globalAutoThread.channels.push(channelId);
            fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Erreur ajout canal auto-thread global:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.post('/api/autothread/global/remove', async (req, res) => {
    try {
        const { guildId, channelId } = req.body;
        const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
        
        if (config[guildId] && config[guildId].globalAutoThread) {
            config[guildId].globalAutoThread.channels = 
                config[guildId].globalAutoThread.channels.filter(id => id !== channelId);
            fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Erreur suppression canal auto-thread global:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.post('/api/autothread/global/settings', async (req, res) => {
    try {
        const { guildId, settings } = req.body;
        const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
        
        if (!config[guildId]) config[guildId] = {};
        if (!config[guildId].globalAutoThread) {
            config[guildId].globalAutoThread = { channels: [] };
        }
        
        Object.assign(config[guildId].globalAutoThread, settings);
        fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
        
        res.json({ success: true });
    } catch (error) {
        console.error('Erreur sauvegarde paramètres auto-thread global:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

function startServer() {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🌐 Panel de configuration disponible sur http://localhost:${PORT}`);
        console.log(`📊 Serveur API démarré sur le port ${PORT}`);
    });
}

module.exports = {
    app,
    startServer,
    initializeServer
};