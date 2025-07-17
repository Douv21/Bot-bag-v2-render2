#!/usr/bin/env node

/**
 * Script de démarrage optimisé pour Render.com
 * Compatible avec les contraintes et spécificités de Render
 */

const fs = require('fs');
const path = require('path');

// Configuration pour Render.com
const config = {
    port: process.env.PORT || 10000,
    environment: 'render',
    healthCheckInterval: 30000, // 30 secondes
    logLevel: process.env.LOG_LEVEL || 'info'
};

console.log('🚀 Démarrage du bot Discord sur Render.com...');
console.log(`📋 Configuration:`, {
    port: config.port,
    nodeVersion: process.version,
    platform: process.platform,
    environment: config.environment
});

// Créer les dossiers nécessaires
function createDirectories() {
    const directories = [
        './data',
        './logs', 
        './temp_cards',
        './data/backups'
    ];
    
    directories.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`📁 Dossier créé: ${dir}`);
        }
    });
}

// Vérification des variables d'environnement
function checkEnvironmentVariables() {
    const required = ['DISCORD_TOKEN', 'CLIENT_ID'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        console.error('❌ Variables d\'environnement manquantes:', missing);
        console.error('🔧 Configurez ces variables dans Render.com Dashboard:');
        missing.forEach(key => {
            console.error(`   - ${key}`);
        });
        process.exit(1);
    }
    
    console.log('✅ Variables d\'environnement vérifiées');
}

// Health check simplifié pour Render
function startHealthCheck() {
    const express = require('express');
    const app = express();
    
    let botStatus = 'starting';
    let startTime = Date.now();
    
    // Endpoint principal requis par Render
    app.get('/', (req, res) => {
        res.json({
            status: 'online',
            service: 'Bag Bot v2 Discord',
            bot_status: botStatus,
            uptime: Math.floor((Date.now() - startTime) / 1000),
            timestamp: new Date().toISOString(),
            platform: 'render',
            port: config.port
        });
    });
    
    // Health check détaillé
    app.get('/health', (req, res) => {
        const health = {
            status: botStatus === 'ready' ? 'healthy' : 'starting',
            bot: botStatus,
            memory: process.memoryUsage(),
            uptime: Math.floor((Date.now() - startTime) / 1000),
            timestamp: new Date().toISOString()
        };
        
        const httpCode = botStatus === 'ready' ? 200 : 503;
        res.status(httpCode).json(health);
    });
    
    // Démarrage du serveur
    const server = app.listen(config.port, '0.0.0.0', () => {
        console.log(`🌐 Health check server démarré sur le port ${config.port}`);
        console.log(`📍 Endpoint principal: http://localhost:${config.port}/`);
        console.log(`🔍 Health check: http://localhost:${config.port}/health`);
    });
    
    // Gestion des signaux pour Render
    process.on('SIGTERM', () => {
        console.log('🔄 SIGTERM reçu, arrêt gracieux...');
        server.close(() => {
            console.log('✅ Serveur HTTP fermé');
            process.exit(0);
        });
    });
    
    // Fonction pour mettre à jour le statut
    global.updateBotStatus = (status) => {
        botStatus = status;
        console.log(`📊 Statut bot mis à jour: ${status}`);
    };
    
    return server;
}

// Démarrage du bot Discord
function startBot() {
    console.log('🤖 Démarrage du client Discord...');
    
    // Définir le client global pour les autres modules
    global.discordClient = null;
    
    // Charger et démarrer le bot principal
    try {
        // Import du bot principal adapté pour Render
        const botMain = require('./index.render.js');
        console.log('✅ Bot Discord initialisé');
    } catch (error) {
        console.error('❌ Erreur démarrage bot:', error);
        process.exit(1);
    }
}

// Gestion des erreurs globales pour Render
process.on('unhandledRejection', (error) => {
    console.error('❌ Rejection non gérée:', error);
    // Ne pas exit immédiatement sur Render
});

process.on('uncaughtException', (error) => {
    console.error('❌ Exception non catchée:', error);
    // Log et exit proprement
    setTimeout(() => process.exit(1), 1000);
});

// Séquence de démarrage principale
async function main() {
    try {
        console.log('🎯 Phase 1: Vérifications préliminaires');
        checkEnvironmentVariables();
        
        console.log('🎯 Phase 2: Création des dossiers');
        createDirectories();
        
        console.log('🎯 Phase 3: Démarrage health check');
        startHealthCheck();
        
        console.log('🎯 Phase 4: Démarrage bot Discord');
        startBot();
        
        console.log('🎉 Démarrage terminé avec succès sur Render.com!');
        
    } catch (error) {
        console.error('❌ Erreur critique durant le démarrage:', error);
        process.exit(1);
    }
}

// Point d'entrée
if (require.main === module) {
    main();
}

module.exports = { main, config };