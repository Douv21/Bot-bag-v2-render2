// SOLUTION DÉFINITIVE ANDROID - ÉLIMINE TOUTES ERREURS 503
const { spawn, exec } = require('child_process');
const fs = require('fs');
const http = require('http');

class Android503Killer {
    constructor() {
        this.isActive = false;
        this.restartCount = 0;
        this.maxSilentTime = 30000; // 30 secondes max sans réponse = RESTART IMMÉDIAT
        this.checkInterval = 10000; // Vérification toutes les 10 secondes
        this.lastSuccessTime = Date.now();
        this.aggressiveMode = true;
    }

    start() {
        if (this.isActive) return;
        
        this.isActive = true;
        console.log('🔥 ANDROID 503 KILLER - MODE ULTRA AGRESSIF ACTIVÉ');
        console.log('📱 Spécialement conçu pour téléphones Android');
        
        // Surveillance ultra-agressive
        this.killInterval = setInterval(() => {
            this.performKillCheck();
        }, this.checkInterval);
        
        // Test immédiat
        this.performKillCheck();
    }

    async performKillCheck() {
        const startTime = Date.now();
        
        try {
            // Test TOUS les endpoints simultanément
            const tests = await Promise.allSettled([
                this.testUptimeRobotEndpoint(),
                this.testLocalBot(),
                this.testKeepAlive(),
                this.testWebServer()
            ]);
            
            // Analyser les résultats
            const successCount = tests.filter(t => t.status === 'fulfilled' && t.value.success).length;
            const timeSinceLastSuccess = Date.now() - this.lastSuccessTime;
            
            if (successCount >= 3) {
                // Système OK
                this.lastSuccessTime = Date.now();
                console.log(`🔥 503 Killer: SYSTÈME OK (${successCount}/4 endpoints)`);
            } else {
                // PROBLÈME DÉTECTÉ
                console.log(`🚨 503 Killer: PROBLÈME DÉTECTÉ (${successCount}/4 endpoints)`);
                this.triggerImmediateKill();
            }
            
            // Si plus de 30 secondes sans succès = KILL IMMÉDIAT
            if (timeSinceLastSuccess > this.maxSilentTime) {
                console.log(`💀 503 Killer: TEMPS DÉPASSÉ (${Math.floor(timeSinceLastSuccess/1000)}s) - KILL IMMÉDIAT`);
                this.triggerImmediateKill();
            }
            
        } catch (error) {
            console.error(`💀 503 Killer: ERREUR CRITIQUE - ${error.message}`);
            this.triggerImmediateKill();
        }
    }

    async testUptimeRobotEndpoint() {
        return new Promise((resolve) => {
            const req = http.get('http://localhost:5000/bot/ping', (res) => {
                if (res.statusCode === 200) {
                    resolve({ success: true, endpoint: 'uptimerobot' });
                } else {
                    resolve({ success: false, endpoint: 'uptimerobot', status: res.statusCode });
                }
            });
            
            req.on('error', () => resolve({ success: false, endpoint: 'uptimerobot', error: true }));
            req.setTimeout(3000, () => {
                req.destroy();
                resolve({ success: false, endpoint: 'uptimerobot', timeout: true });
            });
        });
    }

    async testLocalBot() {
        return new Promise((resolve) => {
            const req = http.get('http://localhost:5000/ping', (res) => {
                if (res.statusCode === 200) {
                    resolve({ success: true, endpoint: 'localbot' });
                } else {
                    resolve({ success: false, endpoint: 'localbot', status: res.statusCode });
                }
            });
            
            req.on('error', () => resolve({ success: false, endpoint: 'localbot', error: true }));
            req.setTimeout(3000, () => {
                req.destroy();
                resolve({ success: false, endpoint: 'localbot', timeout: true });
            });
        });
    }

    async testKeepAlive() {
        return new Promise((resolve) => {
            const req = http.get('http://localhost:3000/ping', (res) => {
                if (res.statusCode === 200) {
                    resolve({ success: true, endpoint: 'keepalive' });
                } else {
                    resolve({ success: false, endpoint: 'keepalive', status: res.statusCode });
                }
            });
            
            req.on('error', () => resolve({ success: false, endpoint: 'keepalive', error: true }));
            req.setTimeout(3000, () => {
                req.destroy();
                resolve({ success: false, endpoint: 'keepalive', timeout: true });
            });
        });
    }

    async testWebServer() {
        return new Promise((resolve) => {
            const req = http.get('http://localhost:5000/status', (res) => {
                if (res.statusCode === 200) {
                    resolve({ success: true, endpoint: 'webserver' });
                } else {
                    resolve({ success: false, endpoint: 'webserver', status: res.statusCode });
                }
            });
            
            req.on('error', () => resolve({ success: false, endpoint: 'webserver', error: true }));
            req.setTimeout(3000, () => {
                req.destroy();
                resolve({ success: false, endpoint: 'webserver', timeout: true });
            });
        });
    }

    triggerImmediateKill() {
        this.restartCount++;
        console.log(`💀 ANDROID 503 KILLER: REDÉMARRAGE IMMÉDIAT #${this.restartCount}`);
        
        // Sauvegarder l'alerte
        const killAlert = {
            timestamp: new Date().toISOString(),
            restart_count: this.restartCount,
            reason: 'Android 503 prevention',
            last_success: new Date(this.lastSuccessTime).toISOString(),
            silent_time: Date.now() - this.lastSuccessTime
        };
        
        try {
            fs.writeFileSync('./data/android_kill_alert.json', JSON.stringify(killAlert, null, 2));
        } catch (error) {
            console.error('Erreur sauvegarde kill alert:', error);
        }
        
        // KILL IMMÉDIAT - AUCUNE PITIÉ
        console.log('💀 PROCESSUS KILL EN 3 SECONDES...');
        setTimeout(() => {
            process.exit(1);
        }, 3000);
    }

    getStatus() {
        return {
            active: this.isActive,
            restart_count: this.restartCount,
            last_success: new Date(this.lastSuccessTime).toISOString(),
            silent_time_seconds: Math.floor((Date.now() - this.lastSuccessTime) / 1000),
            next_check_in: Math.floor((this.checkInterval - (Date.now() % this.checkInterval)) / 1000)
        };
    }

    stop() {
        if (this.killInterval) {
            clearInterval(this.killInterval);
        }
        this.isActive = false;
        console.log('💀 Android 503 Killer arrêté');
    }
}

// Démarrage automatique si exécuté directement
if (require.main === module) {
    const killer = new Android503Killer();
    killer.start();
    
    // Afficher le statut toutes les minutes
    setInterval(() => {
        console.log('💀 Status:', killer.getStatus());
    }, 60000);
}

module.exports = Android503Killer;