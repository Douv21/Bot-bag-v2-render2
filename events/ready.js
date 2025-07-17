const deployCommands = require('../utils/deployCommands');
const dataManager = require('../utils/dataManager');
const startKeepAlive = require('../utils/keepAlive');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`✅ Connecté en tant que ${client.user.tag}`);
        await deployCommands(client);
        dataManager.startAutoBackup(15);
        startKeepAlive();
    }
};
