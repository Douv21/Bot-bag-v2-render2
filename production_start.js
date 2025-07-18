#!/usr/bin/env node
/**
 * Script de démarrage optimisé pour production autoscale
 * Utilisé spécifiquement pour les déploiements Replit autoscale
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Démarrage du bot Discord en mode production autoscale');

// Vérifier les variables d'environnement requises
const requiredEnvVars = ['DISCORD_TOKEN', 'CLIENT_ID'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('❌ Variables d\'environnement manquantes:', missingVars.join(', '));
    console.error('💡 Configurez ces secrets dans l\'interface Replit');
    process.exit(1);
}

// Vérifier que les dossiers nécessaires existent
const requiredDirs = ['data', 'logs', 'temp_cards'];
requiredDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Dossier créé: ${dir}`);
    }
});

// Configuration de l'environnement de production
process.env.NODE_ENV = 'production';
process.env.REPLIT_DEPLOYMENT = 'autoscale';

// Gestion gracieuse des signaux
process.on('SIGTERM', () => {
    console.log('🛑 Signal SIGTERM reçu, arrêt gracieux...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Signal SIGINT reçu, arrêt gracieux...');
    process.exit(0);
});

// Démarrer le bot principal avec gestion d'erreur robuste
function startBot() {
    console.log('🤖 Démarrage du bot Discord...');
    
    const botProcess = spawn('node', ['index.js'], {
        stdio: 'inherit',
        env: process.env
    });

    botProcess.on('close', (code, signal) => {
        if (code !== 0) {
            console.error(`❌ Bot fermé avec le code: ${code}, signal: ${signal}`);
            
            // En production autoscale, laisser Replit gérer les redémarrages
            if (process.env.REPLIT_DEPLOYMENT === 'autoscale') {
                console.log('🔄 Replit autoscale va gérer le redémarrage');
                process.exit(code);
            } else {
                // Redémarrage local si nécessaire
                console.log('🔄 Redémarrage du bot dans 5 secondes...');
                setTimeout(startBot, 5000);
            }
        }
    });

    botProcess.on('error', (error) => {
        console.error('❌ Erreur lors du démarrage du bot:', error);
        process.exit(1);
    });
}

// Vérification de santé avant démarrage
function healthCheck() {
    console.log('🔍 Vérification de santé système...');
    
    // Vérifier l'espace disque
    try {
        const stats = fs.statSync('.');
        console.log('✅ Système de fichiers accessible');
    } catch (error) {
        console.error('❌ Problème système de fichiers:', error.message);
        process.exit(1);
    }

    // Vérifier les fichiers critiques
    const criticalFiles = ['index.js', 'config.json'];
    for (const file of criticalFiles) {
        if (!fs.existsSync(file)) {
            console.error(`❌ Fichier critique manquant: ${file}`);
            process.exit(1);
        }
    }

    console.log('✅ Vérifications de santé terminées');
}

// Démarrage principal
console.log('🏁 Initialisation du déploiement autoscale...');
healthCheck();
startBot();

console.log('🎯 Bot Discord prêt pour autoscale sur Replit');