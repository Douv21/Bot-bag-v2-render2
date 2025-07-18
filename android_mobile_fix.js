// Solution spécifique Android mobile pour éviter erreurs 503
const fs = require('fs');
const http = require('http');

class AndroidMobileFix {
    constructor() {
        this.isActive = false;
        this.keepAliveInterval = null;
        this.emergencyInterval = null;
        this.lastSuccessfulPing = Date.now();
        this.consecutiveFailures = 0;
        this.maxFailures = 2;
        
        // Configuration Android mobile optimisée
        this.pingInterval = 15000; // Ping toutes les 15 secondes
        this.emergencyCheckInterval = 45000; // Vérification d'urgence toutes les 45s
        this.connectionTimeout = 5000; // Timeout connexion 5s
        this.maxSilentTime = 90000; // Maximum 90 secondes sans réponse = redémarrage
    }

    startAndroidFix() {
        if (this.isActive) return;
        
        this.isActive = true;
        console.log('📱 ANDROID MOBILE FIX - Protection 503 activée');
        
        // Ping permanent pour maintenir la connexion
        this.keepAliveInterval = setInterval(() => {
            this.performKeepAlivePing();
        }, this.pingInterval);
        
        // Vérification d'urgence
        this.emergencyInterval = setInterval(() => {
            this.performEmergencyCheck();
        }, this.emergencyCheckInterval);
        
        // Premier ping immédiat
        this.performKeepAlivePing();
    }

    performKeepAlivePing() {
        const startTime = Date.now();
        
        // Ping multiple simultané pour garantir la connexion
        Promise.allSettled([
            this.pingEndpoint('http://localhost:3000/ping'),
            this.pingEndpoint('http://localhost:5000/bot/ping'),
            this.pingEndpoint('http://localhost:5000/ping')
        ]).then(results => {
            const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
            
            if (successCount >= 2) {
                this.lastSuccessfulPing = Date.now();
                this.consecutiveFailures = 0;
                console.log(`📱 Android Keep-Alive OK (${successCount}/3 endpoints)`);
            } else {
                this.consecutiveFailures++;
                console.log(`⚠️ Android Keep-Alive FAILED (${successCount}/3) - Échec #${this.consecutiveFailures}`);
                
                if (this.consecutiveFailures >= this.maxFailures) {
                    this.triggerEmergencyRestart();
                }
            }
        }).catch(error => {
            this.consecutiveFailures++;
            console.error(`❌ Android Keep-Alive ERROR: ${error.message}`);
            
            if (this.consecutiveFailures >= this.maxFailures) {
                this.triggerEmergencyRestart();
            }
        });
    }

    pingEndpoint(url) {
        return new Promise((resolve) => {
            const req = http.get(url, (res) => {
                if (res.statusCode === 200) {
                    resolve({ success: true, url, status: res.statusCode });
                } else {
                    resolve({ success: false, url, status: res.statusCode });
                }
            });
            
            req.on('error', (error) => {
                resolve({ success: false, url, error: error.message });
            });
            
            req.setTimeout(this.connectionTimeout, () => {
                req.destroy();
                resolve({ success: false, url, timeout: true });
            });
        });
    }

    performEmergencyCheck() {
        const timeSinceLastSuccess = Date.now() - this.lastSuccessfulPing;
        
        if (timeSinceLastSuccess > this.maxSilentTime) {
            console.log(`🚨 ANDROID EMERGENCY: ${Math.floor(timeSinceLastSuccess/1000)}s sans réponse`);
            this.triggerEmergencyRestart();
        } else {
            console.log(`📱 Android Health: ${Math.floor(timeSinceLastSuccess/1000)}s depuis dernier ping`);
        }
    }

    triggerEmergencyRestart() {
        console.log('🚨 ANDROID MOBILE: REDÉMARRAGE D\'URGENCE IMMÉDIAT');
        
        // Créer fichier d'alerte Android
        const alertData = {
            timestamp: new Date().toISOString(),
            type: 'android_mobile_emergency',
            reason: 'Connection failure detected',
            consecutive_failures: this.consecutiveFailures,
            silent_time: Date.now() - this.lastSuccessfulPing,
            severity: 'critical'
        };
        
        try {
            fs.writeFileSync('./data/android_emergency.json', JSON.stringify(alertData, null, 2));
        } catch (error) {
            console.error('Erreur sauvegarde alerte Android:', error);
        }
        
        // Signal d'arrêt immédiat
        try {
            process.exit(1);
        } catch (error) {
            console.error('Erreur redémarrage d\'urgence:', error);
        }
        
        // Reset pour éviter les boucles
        this.consecutiveFailures = 0;
        this.lastSuccessfulPing = Date.now();
    }

    getStatus() {
        return {
            active: this.isActive,
            last_successful_ping: new Date(this.lastSuccessfulPing).toISOString(),
            consecutive_failures: this.consecutiveFailures,
            silent_time_seconds: Math.floor((Date.now() - this.lastSuccessfulPing) / 1000),
            next_emergency_check: Math.floor((this.emergencyCheckInterval - ((Date.now() % this.emergencyCheckInterval))) / 1000)
        };
    }

    stop() {
        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
        }
        if (this.emergencyInterval) {
            clearInterval(this.emergencyInterval);
        }
        this.isActive = false;
        console.log('📱 Android Mobile Fix arrêté');
    }
}

module.exports = AndroidMobileFix;