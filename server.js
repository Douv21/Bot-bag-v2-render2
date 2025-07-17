const express = require('express');
const path = require('path');
const fs = require('fs');

// Configuration pour Render.com
const PORT = process.env.PORT || 5000;

function initializeServer(client) {
    const app = express();
    
    // Middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static(path.join(__dirname, 'panel')));
    
    // Configuration CORS pour Render.com
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
    
    // Route principale
    app.get('/', (req, res) => {
        res.json({
            status: 'online',
            service: 'Bag Bot v2 - Render.com',
            bot: client.user ? client.user.tag : 'Starting...',
            guilds: client.guilds ? client.guilds.cache.size : 0,
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            version: '2.0.0',
            platform: 'render'
        });
    });
    
    // Health check pour Render.com
    app.get('/health', (req, res) => {
        const health = {
            status: 'healthy',
            discord: client.readyAt ? 'connected' : 'connecting',
            bot_user: client.user ? client.user.tag : null,
            guilds_count: client.guilds ? client.guilds.cache.size : 0,
            memory: process.memoryUsage(),
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            environment: 'render'
        };
        
        res.json(health);
    });
    
    // API pour les données des guildes
    app.get('/api/guilds', async (req, res) => {
        try {
            const guildsData = await getGuildsData();
            res.json(guildsData);
        } catch (error) {
            console.error('Erreur API guilds:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    });
    
    // API configuration auto-thread global
    app.get('/api/autothread', (req, res) => {
        try {
            let settings = {};
            if (fs.existsSync('./data/autothread_global.json')) {
                settings = JSON.parse(fs.readFileSync('./data/autothread_global.json', 'utf8'));
            }
            res.json(settings);
        } catch (error) {
            console.error('Erreur lecture autothread:', error);
            res.status(500).json({ error: 'Erreur lecture configuration' });
        }
    });
    
    app.post('/api/autothread', (req, res) => {
        try {
            const settings = req.body;
            fs.writeFileSync('./data/autothread_global.json', JSON.stringify(settings, null, 2));
            res.json({ success: true, message: 'Configuration sauvegardée' });
        } catch (error) {
            console.error('Erreur sauvegarde autothread:', error);
            res.status(500).json({ error: 'Erreur sauvegarde configuration' });
        }
    });
    
    // API configuration économie
    app.get('/api/economy', (req, res) => {
        try {
            const actions = fs.existsSync('./data/actions.json') 
                ? JSON.parse(fs.readFileSync('./data/actions.json', 'utf8'))
                : {};
            const shop = fs.existsSync('./data/shop.json')
                ? JSON.parse(fs.readFileSync('./data/shop.json', 'utf8'))
                : {};
            
            res.json({ actions, shop });
        } catch (error) {
            console.error('Erreur lecture économie:', error);
            res.status(500).json({ error: 'Erreur lecture configuration économie' });
        }
    });
    
    // API statistiques
    app.get('/api/stats', (req, res) => {
        try {
            const stats = {
                bot: {
                    username: client.user ? client.user.username : 'N/A',
                    id: client.user ? client.user.id : 'N/A',
                    guilds: client.guilds ? client.guilds.cache.size : 0,
                    uptime: process.uptime()
                },
                system: {
                    memory: process.memoryUsage(),
                    platform: process.platform,
                    nodeVersion: process.version,
                    environment: 'render'
                },
                timestamp: new Date().toISOString()
            };
            
            res.json(stats);
        } catch (error) {
            console.error('Erreur stats:', error);
            res.status(500).json({ error: 'Erreur récupération statistiques' });
        }
    });
    
    // Middleware de gestion d'erreurs pour Render.com
    app.use((error, req, res, next) => {
        console.error('Erreur serveur:', error);
        res.status(500).json({ 
            error: 'Erreur interne du serveur',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    });
    
    // Route 404
    app.use('*', (req, res) => {
        res.status(404).json({ 
            error: 'Route non trouvée',
            path: req.originalUrl,
            timestamp: new Date().toISOString()
        });
    });
    
    return app;
}

async function getGuildsData() {
    try {
        // Données par défaut si pas de client
        if (!global.discordClient || !global.discordClient.guilds) {
            return {
                guilds: [],
                total: 0,
                error: 'Client Discord non disponible'
            };
        }
        
        const guilds = global.discordClient.guilds.cache.map(guild => ({
            id: guild.id,
            name: guild.name,
            memberCount: guild.memberCount,
            icon: guild.iconURL(),
            owner: guild.ownerId
        }));
        
        return {
            guilds,
            total: guilds.length,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Erreur getGuildsData:', error);
        throw error;
    }
}

function startServer() {
    // Utiliser le client global si disponible
    const client = global.discordClient || { user: null, guilds: null };
    const app = initializeServer(client);
    
    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`🌐 Panel web démarré sur le port ${PORT}`);
        console.log(`🔗 Accessible via: http://localhost:${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/health`);
        console.log(`🎛️ Configuration: Compatible Render.com`);
    });
    
    // Gestion gracieuse pour Render.com
    process.on('SIGTERM', () => {
        console.log('🔄 SIGTERM reçu, arrêt du serveur web...');
        server.close(() => {
            console.log('✅ Serveur web arrêté proprement');
        });
    });
    
    return server;
}

module.exports = {
    initializeServer,
    getGuildsData,
    startServer
};