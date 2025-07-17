// Système de redémarrage automatique pour maintenir le bot en vie
const { spawn } = require('child_process');
const fs = require('fs');

class AutoRestart {
    constructor() {
        this.process = null;
        this.restartCount = 0;
        this.lastRestart = Date.now();
        this.maxRestarts = 10;
        this.restartCooldown = 60000; // 1 minute
    }

    start() {
        console.log('🚀 Démarrage du système auto-restart');
        this.startBot();
        
        // Vérifier la santé du bot toutes les 15 secondes
        setInterval(() => {
            this.checkBotHealth();
        }, 15000);
    }

    startBot() {
        console.log(`🤖 Démarrage du bot (tentative ${this.restartCount + 1})`);
        
        // Assurer que le port n'est pas occupé
        try {
            this.process = spawn('node', ['index.js'], {
                stdio: 'inherit',
                env: {
                    ...process.env,
                    NODE_ENV: 'production',
                    UV_THREADPOOL_SIZE: '8'
                },
                detached: false
            });

            this.process.on('exit', (code, signal) => {
                console.log(`⚠️ Bot arrêté - Code: ${code}, Signal: ${signal}`);
                this.handleBotExit(code, signal);
            });

            this.process.on('error', (error) => {
                console.error('❌ Erreur processus bot:', error);
                this.handleBotExit(1, null);
            });
            
            // Stocker la référence pour vérification
            this.botProcess = this.process;
            
        } catch (error) {
            console.error('❌ Échec démarrage bot:', error);
            setTimeout(() => this.startBot(), 5000);
        }
    }

    handleBotExit(code, signal) {
        const now = Date.now();
        
        // Si le bot s'arrête trop souvent, attendre plus longtemps
        if (now - this.lastRestart < this.restartCooldown) {
            this.restartCount++;
        } else {
            this.restartCount = 0;
        }

        this.lastRestart = now;

        // Arrêter les redémarrages si trop nombreux
        if (this.restartCount >= this.maxRestarts) {
            console.error(`❌ Trop de redémarrages (${this.maxRestarts}). Arrêt du système.`);
            process.exit(1);
        }

        // Délai avant redémarrage (augmente avec le nombre de tentatives)
        const delay = Math.min(5000 + (this.restartCount * 2000), 30000);
        console.log(`⏱️ Redémarrage dans ${delay/1000}s...`);

        setTimeout(() => {
            this.startBot();
        }, delay);
    }

    async checkBotHealth() {
        try {
            // Vérifier d'abord si le processus existe
            if (!this.botProcess || this.botProcess.killed) {
                console.log('⚠️ Processus bot mort, redémarrage immédiat...');
                this.restartBot();
                return;
            }
            
            const http = require('http');
            let healthCheckCompleted = false;
            
            // Vérifier l'endpoint de santé avec timeout strict
            const req = http.get('http://localhost:3000/health', (res) => {
                if (healthCheckCompleted) return;
                healthCheckCompleted = true;
                
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const health = JSON.parse(data);
                        if (health.status === 'healthy') {
                            console.log(`✅ Bot sain - Uptime: ${health.uptimeFormatted}`);
                        } else {
                            console.log('⚠️ Bot en mauvaise santé, redémarrage...');
                            this.restartBot();
                        }
                    } catch (e) {
                        console.log('⚠️ Réponse santé invalide, redémarrage...');
                        this.restartBot();
                    }
                });
            });

            req.on('error', (error) => {
                if (!healthCheckCompleted) {
                    healthCheckCompleted = true;
                    console.log(`⚠️ Endpoint santé inaccessible (${error.code}), redémarrage...`);
                    this.restartBot();
                }
            });

            req.setTimeout(2000, () => {
                if (!healthCheckCompleted) {
                    healthCheckCompleted = true;
                    req.destroy();
                    console.log('⚠️ Timeout endpoint santé (2s), redémarrage...');
                    this.restartBot();
                }
            });

        } catch (error) {
            console.error('Erreur vérification santé:', error);
            this.restartBot();
        }
    }

    restartBot() {
        if (this.process && !this.process.killed) {
            console.log('🔄 Redémarrage forcé du bot...');
            this.process.kill('SIGTERM');
            
            // Forcer l'arrêt si nécessaire
            setTimeout(() => {
                if (this.process && !this.process.killed) {
                    console.log('🔥 Arrêt forcé du bot...');
                    this.process.kill('SIGKILL');
                }
            }, 5000);
        }
    }

    stop() {
        if (this.process) {
            this.process.kill('SIGTERM');
        }
    }
}

// Démarrer le système si ce fichier est exécuté directement
if (require.main === module) {
    const autoRestart = new AutoRestart();
    autoRestart.start();

    // Gérer l'arrêt propre
    process.on('SIGINT', () => {
        console.log('🛑 Arrêt du système auto-restart...');
        autoRestart.stop();
        process.exit(0);
    });
}

module.exports = AutoRestart;