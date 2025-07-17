// Gestionnaire central des données avec système de backup automatique
const fs = require('fs');
const path = require('path');

class DataManager {
    constructor() {
        this.dataPath = './data';
        this.backupPath = './data/backups';
        this.ensureDirectories();
    }

    ensureDirectories() {
        if (!fs.existsSync(this.dataPath)) {
            fs.mkdirSync(this.dataPath, { recursive: true });
        }
        if (!fs.existsSync(this.backupPath)) {
            fs.mkdirSync(this.backupPath, { recursive: true });
        }
    }

    // Sauvegarde sécurisée avec backup automatique
    saveData(filename, data) {
        const filepath = path.join(this.dataPath, filename);
        const backupFilepath = path.join(this.backupPath, `${filename}.backup.${Date.now()}`);
        
        try {
            // Créer une sauvegarde de l'ancien fichier
            if (fs.existsSync(filepath)) {
                fs.copyFileSync(filepath, backupFilepath);
            }
            
            // Sauvegarder atomiquement (écriture en temp puis rename)
            const tempFilepath = filepath + '.tmp';
            fs.writeFileSync(tempFilepath, JSON.stringify(data, null, 2), 'utf8');
            
            // Renommer atomiquement pour éviter la corruption
            fs.renameSync(tempFilepath, filepath);
            
            console.log(`💾 Données sauvegardées: ${filename}`);
            
            // Nettoyer les anciens backups (garder seulement les 10 derniers)
            this.cleanOldBackups(filename);
            
        } catch (error) {
            console.error(`❌ Erreur sauvegarde ${filename}:`, error);
            
            // Restaurer depuis backup si possible
            if (fs.existsSync(backupFilepath)) {
                try {
                    fs.copyFileSync(backupFilepath, filepath);
                    console.log(`🔄 Fichier restauré depuis backup: ${filename}`);
                } catch (restoreError) {
                    console.error(`❌ Échec restauration backup:`, restoreError);
                }
            }
        }
    }

    // Chargement sécurisé avec fallback sur backup
    loadData(filename, defaultValue = {}) {
        const filepath = path.join(this.dataPath, filename);
        
        try {
            if (!fs.existsSync(filepath)) {
                console.log(`📁 Création fichier initial: ${filename}`);
                this.saveData(filename, defaultValue);
                return defaultValue;
            }
            
            const content = fs.readFileSync(filepath, 'utf8').trim();
            if (!content) {
                console.log(`📄 Fichier vide détecté: ${filename}, utilisation backup...`);
                return this.restoreFromLatestBackup(filename, defaultValue);
            }
            
            const data = JSON.parse(content);
            return data || defaultValue;
            
        } catch (error) {
            console.error(`❌ Erreur lecture ${filename}:`, error);
            console.log(`🔄 Tentative restauration depuis backup...`);
            
            return this.restoreFromLatestBackup(filename, defaultValue);
        }
    }

    // Restaurer depuis le backup le plus récent
    restoreFromLatestBackup(filename, defaultValue = {}) {
        try {
            const backupFiles = fs.readdirSync(this.backupPath)
                .filter(file => file.startsWith(`${filename}.backup.`))
                .sort((a, b) => {
                    const timeA = parseInt(a.split('.backup.')[1]);
                    const timeB = parseInt(b.split('.backup.')[1]);
                    return timeB - timeA; // Plus récent en premier
                });
            
            if (backupFiles.length > 0) {
                const latestBackup = path.join(this.backupPath, backupFiles[0]);
                const backupData = JSON.parse(fs.readFileSync(latestBackup, 'utf8'));
                
                // Restaurer le fichier principal
                this.saveData(filename, backupData);
                console.log(`✅ Données restaurées depuis backup: ${backupFiles[0]}`);
                
                return backupData;
            }
        } catch (error) {
            console.error(`❌ Échec restauration backup pour ${filename}:`, error);
        }
        
        console.log(`📝 Utilisation valeurs par défaut pour: ${filename}`);
        this.saveData(filename, defaultValue);
        return defaultValue;
    }

    // Nettoyer les anciens backups (garder les 10 plus récents)
    cleanOldBackups(filename) {
        try {
            const backupFiles = fs.readdirSync(this.backupPath)
                .filter(file => file.startsWith(`${filename}.backup.`))
                .sort((a, b) => {
                    const timeA = parseInt(a.split('.backup.')[1]);
                    const timeB = parseInt(b.split('.backup.')[1]);
                    return timeB - timeA;
                });
            
            // Supprimer les backups au-delà de 10
            if (backupFiles.length > 10) {
                const filesToDelete = backupFiles.slice(10);
                filesToDelete.forEach(file => {
                    try {
                        fs.unlinkSync(path.join(this.backupPath, file));
                    } catch (deleteError) {
                        console.error(`Erreur suppression backup ${file}:`, deleteError);
                    }
                });
                console.log(`🧹 ${filesToDelete.length} anciens backups supprimés pour ${filename}`);
            }
        } catch (error) {
            console.error(`Erreur nettoyage backups:`, error);
        }
    }

    // Créer un backup manuel avec timestamp
    createManualBackup(filename, reason = 'manual') {
        const filepath = path.join(this.dataPath, filename);
        if (!fs.existsSync(filepath)) return false;
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFilepath = path.join(this.backupPath, `${filename}.${reason}.${timestamp}.backup`);
        
        try {
            fs.copyFileSync(filepath, backupFilepath);
            console.log(`📦 Backup manuel créé: ${filename} (${reason})`);
            return true;
        } catch (error) {
            console.error(`❌ Erreur backup manuel:`, error);
            return false;
        }
    }

    // Synchronisation périodique automatique
    startAutoBackup(intervalMinutes = 30) {
        const interval = intervalMinutes * 60 * 1000;
        
        setInterval(() => {
            const criticalFiles = ['users.json', 'actions.json', 'cooldowns.json', 'message_rewards.json'];
            
            criticalFiles.forEach(filename => {
                if (fs.existsSync(path.join(this.dataPath, filename))) {
                    this.createManualBackup(filename, 'auto');
                }
            });
            
            console.log(`🔄 Backup automatique effectué - ${new Date().toLocaleTimeString()}`);
        }, interval);
        
        console.log(`⏰ Système de backup automatique démarré (${intervalMinutes} min)`);
    }
}

// Instance globale
const dataManager = new DataManager();

module.exports = dataManager;