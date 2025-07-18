// Système de détection proactive des erreurs 502
const http = require('http');

class Error502Detector {
    constructor() {
        this.errorCount = 0;
        this.maxErrors = 3;
        this.resetInterval = 300000; // 5 minutes
        this.isMonitoring = false;
        this.lastErrorReset = Date.now();
    }

    startMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        console.log('🔍 Démarrage détecteur erreurs 502');
        
        // Test continu des endpoints toutes les 30 secondes
        setInterval(() => {
            this.performErrorCheck();
        }, 30000);
        
        // Reset du compteur d'erreurs toutes les 5 minutes
        setInterval(() => {
            this.resetErrorCount();
        }, this.resetInterval);
    }

    async performErrorCheck() {
        const endpoints = [
            'http://localhost:3000/',
            'http://localhost:3000/ping',
            'http://localhost:3000/health',
            'http://localhost:3000/status'
        ];

        for (const endpoint of endpoints) {
            try {
                const result = await this.testEndpoint(endpoint);
                if (!result.success) {
                    this.handleError(endpoint, result);
                }
            } catch (error) {
                this.handleError(endpoint, { error: error.message });
            }
        }
    }

    testEndpoint(url) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            
            const req = http.get(url, (res) => {
                const responseTime = Date.now() - startTime;
                
                if (res.statusCode === 502) {
                    console.log(`🚨 ERREUR 502 détectée sur ${url}`);
                    resolve({ 
                        success: false, 
                        statusCode: 502, 
                        responseTime, 
                        error: 'Bad Gateway' 
                    });
                } else if (res.statusCode >= 500) {
                    console.log(`⚠️ Erreur ${res.statusCode} sur ${url}`);
                    resolve({ 
                        success: false, 
                        statusCode: res.statusCode, 
                        responseTime 
                    });
                } else if (res.statusCode === 200) {
                    resolve({ 
                        success: true, 
                        statusCode: 200, 
                        responseTime 
                    });
                } else {
                    resolve({ 
                        success: false, 
                        statusCode: res.statusCode, 
                        responseTime 
                    });
                }
            });

            req.on('error', (error) => {
                const responseTime = Date.now() - startTime;
                resolve({ 
                    success: false, 
                    error: error.message, 
                    responseTime 
                });
            });

            req.setTimeout(8000, () => {
                req.destroy();
                const responseTime = Date.now() - startTime;
                resolve({ 
                    success: false, 
                    error: 'Timeout', 
                    responseTime 
                });
            });
        });
    }

    handleError(endpoint, result) {
        this.errorCount++;
        
        const errorInfo = {
            timestamp: new Date().toISOString(),
            endpoint: endpoint,
            statusCode: result.statusCode,
            error: result.error,
            responseTime: result.responseTime,
            errorCount: this.errorCount
        };

        console.log(`❌ [${errorInfo.timestamp}] Erreur ${endpoint}: ${result.statusCode || result.error}`);
        
        // Alerte si erreur 502 spécifique
        if (result.statusCode === 502) {
            console.log(`🚨 ALERTE 502: ${endpoint} - Intervention nécessaire`);
            this.trigger502Alert(errorInfo);
        }
        
        // Redémarrage automatique si trop d'erreurs
        if (this.errorCount >= this.maxErrors) {
            console.log(`🔥 ALERTE: ${this.errorCount} erreurs détectées - Redémarrage requis`);
            this.triggerRestart();
        }
        
        // Sauvegarder l'erreur
        this.logError(errorInfo);
    }

    trigger502Alert(errorInfo) {
        // Créer un fichier d'alerte pour l'auto-restart
        const fs = require('fs');
        const alertPath = './data/502_alert.json';
        
        try {
            const alertData = {
                ...errorInfo,
                severity: 'high',
                action: 'restart_required'
            };
            
            fs.writeFileSync(alertPath, JSON.stringify(alertData, null, 2));
            console.log('📝 Alerte 502 sauvegardée');
        } catch (error) {
            console.error('Erreur sauvegarde alerte:', error);
        }
    }

    triggerRestart() {
        console.log('🔄 Déclenchement redémarrage automatique...');
        
        // Signal pour l'auto-restart
        process.emit('SIGUSR1');
        
        // Reset du compteur après redémarrage
        setTimeout(() => {
            this.errorCount = 0;
        }, 10000);
    }

    resetErrorCount() {
        if (this.errorCount > 0) {
            console.log(`🔄 Reset compteur erreurs (${this.errorCount} → 0)`);
            this.errorCount = 0;
        }
        this.lastErrorReset = Date.now();
    }

    logError(errorInfo) {
        const fs = require('fs');
        const logPath = './data/502_errors.json';
        
        try {
            let errors = [];
            if (fs.existsSync(logPath)) {
                const content = fs.readFileSync(logPath, 'utf8');
                if (content.trim()) {
                    errors = JSON.parse(content);
                }
            }
            
            errors.push(errorInfo);
            
            // Garder seulement les 100 dernières erreurs
            if (errors.length > 100) {
                errors = errors.slice(-100);
            }
            
            fs.writeFileSync(logPath, JSON.stringify(errors, null, 2));
        } catch (error) {
            console.error('Erreur log erreur 502:', error);
        }
    }

    getErrorStats() {
        return {
            currentErrors: this.errorCount,
            maxErrors: this.maxErrors,
            lastReset: this.lastErrorReset,
            isMonitoring: this.isMonitoring
        };
    }
}

module.exports = Error502Detector;