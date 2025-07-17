const fs = require('fs');

module.exports = () => {
    const dirs = ['data', 'logs', 'temp_cards', 'data/backups'];
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`📁 Dossier créé : ${dir}`);
        }
    });
};
