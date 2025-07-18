// Script de vérification de santé pour UptimeRobot
const fs = require('fs');
const path = require('path');

function checkBotHealth() {
    const healthData = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        checks: {
            dataFiles: checkDataFiles(),
            memory: checkMemoryUsage(),
            uptime: process.uptime()
        }
    };

    // Vérifier les fichiers JSON critiques
    function checkDataFiles() {
        const criticalFiles = [
            'data/users.json',
            'data/actions.json',
            'data/message_rewards.json'
        ];

        const results = {};
        for (const file of criticalFiles) {
            try {
                if (fs.existsSync(file)) {
                    const content = fs.readFileSync(file, 'utf8').trim();
                    if (content) {
                        JSON.parse(content); // Test parsing
                        results[file] = 'ok';
                    } else {
                        results[file] = 'empty';
                    }
                } else {
                    results[file] = 'missing';
                }
            } catch (error) {
                results[file] = 'corrupted';
                // Réparer automatiquement
                fs.writeFileSync(file, '{}', 'utf8');
                console.log(`🔧 Fichier ${file} réparé automatiquement`);
            }
        }
        return results;
    }

    function checkMemoryUsage() {
        const usage = process.memoryUsage();
        return {
            rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
            heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`
        };
    }

    return healthData;
}

// Exporter pour utilisation dans le serveur
module.exports = { checkBotHealth };

// Si exécuté directement, afficher la santé
if (require.main === module) {
    console.log(JSON.stringify(checkBotHealth(), null, 2));
}