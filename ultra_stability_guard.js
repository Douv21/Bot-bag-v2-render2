// Gardien de stabilité ultra-robuste pour prévenir les pannes 503
const fs = require('fs');
const http = require('http');

class UltraStabilityGuard {
    constructor() {
        this.isGuarding = false;
        this.healthHistory = [];
        this.consecutiveFailures = 0;
        this.maxConsecutiveFailures = 2;
        this.checkInterval = 10000; // 10 secondes
        this.emergencyRestartTriggered = false;
    }

    startGuarding() {
        if (this.isGuarding) return;
        
        this.isGuarding = true;
        console.log('🛡️ Gardien de stabilité ultra-robuste activé');
        
        // Surveillance continue toutes les 10 secondes
        this.guardInterval = setInterval(() => {
            this.performUltraCheck();
        }, this.checkInterval);
        
        // Reset d'urgence toutes les 5 minutes si nécessaire
        this.emergencyInterval = setInterval(() => {
            this.performEmergencyCheck();
        }, 300000);
    }

    async performUltraCheck() {
        const checkStart = Date.now();
        
        try {
            // Test multi-endpoint simultané (incluant bot direct)
            const results = await Promise.allSettled([
                this.testEndpoint('http://localhost:3000/ping'),
                this.testEndpoint('http://localhost:3000/health'),
                this.testEndpoint('http://localhost:5000/ping'),
                this.testEndpoint('http://localhost:5000/bot/ping')
            ]);
            
            const healthRecord = {
                timestamp: checkStart,
                ping3000: results[0].status === 'fulfilled' && results[0].value.success,
                health3000: results[1].status === 'fulfilled' && results[1].value.success,
                ping5000: results[2].status === 'fulfilled' && results[2].value.success,
                botPing5000: results[3].status === 'fulfilled' && results[3].value.success,
                overallHealth: false,
                responseTime: Date.now() - checkStart
            };
            
            // Considérer comme sain si au moins 3/4 endpoints répondent
            const successCount = [healthRecord.ping3000, healthRecord.health3000, healthRecord.ping5000, healthRecord.botPing5000].filter(Boolean).length;
            healthRecord.overallHealth = successCount >= 3;
            
            this.healthHistory.push(healthRecord);
            
            // Garder seulement les 50 dernières vérifications
            if (this.healthHistory.length > 50) {
                this.healthHistory = this.healthHistory.slice(-50);
            }
            
            if (healthRecord.overallHealth) {
                this.consecutiveFailures = 0;
                console.log(`🛡️ Système stable (${successCount}/4 endpoints OK)`);
            } else {
                this.consecutiveFailures++;
                console.log(`⚠️ Instabilité détectée (${successCount}/4 endpoints OK) - Échec #${this.consecutiveFailures}`);
                
                if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
                    this.triggerEmergencyAction();
                }
            }
            
        } catch (error) {
            this.consecutiveFailures++;
            console.error(`❌ Erreur vérification ultra-stabilité: ${error.message}`);
            
            if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
                this.triggerEmergencyAction();
            }
        }
    }

    async testEndpoint(url) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const timeout = 5000;
            
            const req = http.get(url, (res) => {
                const responseTime = Date.now() - startTime;
                
                if (res.statusCode === 200) {
                    resolve({ success: true, responseTime, statusCode: 200 });
                } else {
                    resolve({ success: false, responseTime, statusCode: res.statusCode });
                }
            });
            
            req.on('error', (error) => {
                const responseTime = Date.now() - startTime;
                resolve({ success: false, responseTime, error: error.message });
            });
            
            req.setTimeout(timeout, () => {
                req.destroy();
                resolve({ success: false, responseTime: timeout, timeout: true });
            });
        });
    }

    triggerEmergencyAction() {
        if (this.emergencyRestartTriggered) return;
        
        this.emergencyRestartTriggered = true;
        console.log('🚨 ALERTE CRITIQUE: Déclenchement action d\'urgence');
        
        // Créer fichier d'alerte d'urgence
        this.createEmergencyAlert();
        
        // Signal d'urgence au système auto-restart
        try {
            process.kill(process.pid, 'SIGUSR2');
        } catch (error) {
            console.error('Erreur signal d\'urgence:', error);
        }
        
        // Reset du flag après 30 secondes
        setTimeout(() => {
            this.emergencyRestartTriggered = false;
            this.consecutiveFailures = 0;
        }, 30000);
    }

    createEmergencyAlert() {
        try {
            const alertData = {
                timestamp: new Date().toISOString(),
                consecutiveFailures: this.consecutiveFailures,
                lastHealthChecks: this.healthHistory.slice(-5),
                severity: 'critical',
                action: 'emergency_restart_required',
                message: 'Multiple endpoint failures detected'
            };
            
            fs.writeFileSync('./data/emergency_alert.json', JSON.stringify(alertData, null, 2));
            console.log('📝 Alerte d\'urgence sauvegardée');
        } catch (error) {
            console.error('Erreur sauvegarde alerte d\'urgence:', error);
        }
    }

    performEmergencyCheck() {
        // Vérifier la santé globale des 5 dernières minutes
        const fiveMinutesAgo = Date.now() - 300000;
        const recentChecks = this.healthHistory.filter(check => check.timestamp > fiveMinutesAgo);
        
        if (recentChecks.length === 0) return;
        
        const healthyChecks = recentChecks.filter(check => check.overallHealth);
        const healthPercentage = (healthyChecks.length / recentChecks.length) * 100;
        
        console.log(`🔍 Santé des 5 dernières minutes: ${healthPercentage.toFixed(1)}% (${healthyChecks.length}/${recentChecks.length})`);
        
        if (healthPercentage < 50) {
            console.log('🚨 ALERTE: Santé critique (<50%) - Action d\'urgence requise');
            this.triggerEmergencyAction();
        }
    }

    getStabilityReport() {
        const recent = this.healthHistory.slice(-10);
        const healthy = recent.filter(check => check.overallHealth);
        
        return {
            currentHealth: this.consecutiveFailures === 0,
            consecutiveFailures: this.consecutiveFailures,
            recentHealthPercentage: recent.length > 0 ? (healthy.length / recent.length) * 100 : 0,
            totalChecks: this.healthHistory.length,
            averageResponseTime: recent.length > 0 ? 
                recent.reduce((sum, check) => sum + check.responseTime, 0) / recent.length : 0
        };
    }

    stop() {
        if (this.guardInterval) {
            clearInterval(this.guardInterval);
        }
        if (this.emergencyInterval) {
            clearInterval(this.emergencyInterval);
        }
        this.isGuarding = false;
        console.log('🛡️ Gardien de stabilité arrêté');
    }
}

module.exports = UltraStabilityGuard;