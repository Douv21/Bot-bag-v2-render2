// Protection contre les déconnexions mobiles Replit
const fs = require('fs');

class MobileDisconnectGuard {
    constructor() {
        this.isActive = false;
        this.lastActivity = Date.now();
        this.disconnectTimeout = 180000; // 3 minutes (plus agressif)
        this.checkInterval = 20000; // 20 secondes (plus fréquent)
        this.preventiveRestarts = 0;
        this.maxPreventiveRestarts = 3;
    }

    startGuarding() {
        if (this.isActive) return;
        
        this.isActive = true;
        console.log('📱 Protection déconnexions mobiles activée');
        
        // Surveillance préventive
        this.guardInterval = setInterval(() => {
            this.checkMobileDisconnection();
        }, this.checkInterval);
        
        // Reset quotidien des compteurs
        this.dailyReset = setInterval(() => {
            this.preventiveRestarts = 0;
            console.log('🔄 Reset quotidien protection mobile');
        }, 86400000); // 24h
    }

    updateActivity() {
        this.lastActivity = Date.now();
    }

    checkMobileDisconnection() {
        const now = Date.now();
        const timeSinceActivity = now - this.lastActivity;
        
        // Si pas d'activité depuis 3 minutes, redémarrage préventif
        if (timeSinceActivity > this.disconnectTimeout) {
            if (this.preventiveRestarts < this.maxPreventiveRestarts) {
                this.triggerPreventiveRestart();
            } else {
                console.log('⚠️ Maximum redémarrages préventifs atteint');
            }
        }
        
        // Log état toutes les 2 minutes
        if (timeSinceActivity > 120000) {
            console.log(`📱 Inactivité détectée: ${Math.floor(timeSinceActivity/60000)}m`);
        }
    }

    triggerPreventiveRestart() {
        this.preventiveRestarts++;
        console.log(`🔄 Redémarrage préventif #${this.preventiveRestarts} (protection mobile)`);
        
        // Créer signal de redémarrage préventif
        const alertData = {
            timestamp: new Date().toISOString(),
            type: 'mobile_disconnect_prevention',
            reason: 'Extended inactivity detected',
            inactivity_duration: Date.now() - this.lastActivity,
            restart_count: this.preventiveRestarts
        };
        
        try {
            fs.writeFileSync('./data/mobile_restart_alert.json', JSON.stringify(alertData, null, 2));
        } catch (error) {
            console.error('Erreur sauvegarde alerte mobile:', error);
        }
        
        // Signal au système principal
        try {
            process.kill(process.pid, 'SIGUSR1');
        } catch (error) {
            console.error('Erreur signal redémarrage préventif:', error);
        }
        
        // Reset timer d'activité
        this.lastActivity = Date.now();
    }

    handleWebRequest() {
        this.updateActivity();
    }

    handleDiscordEvent() {
        this.updateActivity();
    }

    getStatus() {
        return {
            active: this.isActive,
            last_activity: new Date(this.lastActivity).toISOString(),
            inactivity_duration: Date.now() - this.lastActivity,
            preventive_restarts: this.preventiveRestarts
        };
    }

    stop() {
        if (this.guardInterval) {
            clearInterval(this.guardInterval);
        }
        if (this.dailyReset) {
            clearInterval(this.dailyReset);
        }
        this.isActive = false;
        console.log('📱 Protection mobile arrêtée');
    }
}

module.exports = MobileDisconnectGuard;