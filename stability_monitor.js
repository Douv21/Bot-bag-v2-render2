// Moniteur de stabilité avancé pour éviter les erreurs 503
const fs = require('fs');
const http = require('http');

class StabilityMonitor {
    constructor() {
        this.healthChecks = [];
        this.uptimeHistory = [];
        this.errorHistory = [];
        this.isMonitoring = false;
    }

    startMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        console.log('🔍 Démarrage du moniteur de stabilité');
        
        // Vérifications santé toutes les 10 secondes
        setInterval(() => {
            this.performHealthCheck();
        }, 10000);
        
        // Nettoyage des logs toutes les heures
        setInterval(() => {
            this.cleanupHistory();
        }, 3600000);
        
        // Rapport de stabilité toutes les 15 minutes
        setInterval(() => {
            this.generateStabilityReport();
        }, 900000);
    }

    async performHealthCheck() {
        const checkStartTime = Date.now();
        
        try {
            const health = await this.checkEndpoint('http://localhost:3000/health');
            const ping = await this.checkEndpoint('http://localhost:3000/ping');
            const panel = await this.checkEndpoint('http://localhost:5000');
            
            const checkResult = {
                timestamp: checkStartTime,
                health: health.success,
                healthTime: health.responseTime,
                ping: ping.success,
                pingTime: ping.responseTime,
                panel: panel.success,
                panelTime: panel.responseTime,
                overallHealth: health.success && ping.success,
                responseTime: health.responseTime
            };
            
            this.healthChecks.push(checkResult);
            
            if (!checkResult.overallHealth) {
                this.logError(`Échec vérification santé: health=${health.success}, ping=${ping.success}`);
            }
            
            // Garder seulement les 100 dernières vérifications
            if (this.healthChecks.length > 100) {
                this.healthChecks = this.healthChecks.slice(-100);
            }
            
        } catch (error) {
            this.logError(`Erreur vérification santé: ${error.message}`);
        }
    }

    async checkEndpoint(url) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const timeout = 5000;
            
            const req = http.get(url, (res) => {
                const responseTime = Date.now() - startTime;
                
                if (res.statusCode === 200) {
                    resolve({ success: true, responseTime, statusCode: res.statusCode });
                } else {
                    resolve({ success: false, responseTime, statusCode: res.statusCode });
                }
            });
            
            req.on('error', () => {
                const responseTime = Date.now() - startTime;
                resolve({ success: false, responseTime, error: true });
            });
            
            req.setTimeout(timeout, () => {
                req.destroy();
                resolve({ success: false, responseTime: timeout, timeout: true });
            });
        });
    }

    logError(message) {
        const errorEntry = {
            timestamp: Date.now(),
            message: message,
            iso: new Date().toISOString()
        };
        
        this.errorHistory.push(errorEntry);
        console.log(`⚠️ [${errorEntry.iso}] ${message}`);
        
        // Garder seulement les 50 dernières erreurs
        if (this.errorHistory.length > 50) {
            this.errorHistory = this.errorHistory.slice(-50);
        }
    }

    generateStabilityReport() {
        if (this.healthChecks.length === 0) return;
        
        const recentChecks = this.healthChecks.slice(-60); // 10 dernières minutes
        const successfulChecks = recentChecks.filter(check => check.overallHealth);
        const uptime = (successfulChecks.length / recentChecks.length) * 100;
        
        const avgResponseTime = recentChecks
            .filter(check => check.healthTime)
            .reduce((sum, check) => sum + check.healthTime, 0) / recentChecks.length;
        
        console.log(`📊 Rapport stabilité - Uptime: ${uptime.toFixed(2)}% | Temps réponse moyen: ${avgResponseTime.toFixed(0)}ms`);
        
        // Sauvegarder le rapport
        const report = {
            timestamp: Date.now(),
            uptime: uptime,
            avgResponseTime: avgResponseTime,
            totalChecks: recentChecks.length,
            successfulChecks: successfulChecks.length,
            recentErrors: this.errorHistory.slice(-10)
        };
        
        this.saveReport(report);
        
        // Alerte si uptime < 95%
        if (uptime < 95) {
            console.log(`🚨 ALERTE: Uptime faible (${uptime.toFixed(2)}%) - Vérifications nécessaires`);
        }
    }

    saveReport(report) {
        try {
            const reportsPath = './data/stability_reports.json';
            let reports = [];
            
            if (fs.existsSync(reportsPath)) {
                const content = fs.readFileSync(reportsPath, 'utf8');
                if (content.trim()) {
                    reports = JSON.parse(content);
                }
            }
            
            reports.push(report);
            
            // Garder seulement les 48 derniers rapports (12 heures)
            if (reports.length > 48) {
                reports = reports.slice(-48);
            }
            
            fs.writeFileSync(reportsPath, JSON.stringify(reports, null, 2));
        } catch (error) {
            console.error('Erreur sauvegarde rapport:', error);
        }
    }

    cleanupHistory() {
        const oneHourAgo = Date.now() - 3600000;
        
        this.healthChecks = this.healthChecks.filter(check => check.timestamp > oneHourAgo);
        this.errorHistory = this.errorHistory.filter(error => error.timestamp > oneHourAgo);
        
        console.log('🧹 Nettoyage historique de stabilité effectué');
    }

    getLatestStatus() {
        if (this.healthChecks.length === 0) {
            return { status: 'unknown', message: 'Aucune vérification effectuée' };
        }
        
        const latest = this.healthChecks[this.healthChecks.length - 1];
        const recentChecks = this.healthChecks.slice(-10);
        const successCount = recentChecks.filter(check => check.overallHealth).length;
        
        return {
            status: latest.overallHealth ? 'healthy' : 'unhealthy',
            uptime: (successCount / recentChecks.length) * 100,
            responseTime: latest.responseTime,
            lastCheck: new Date(latest.timestamp).toISOString()
        };
    }
}

module.exports = StabilityMonitor;