const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'data', 'economy.json');
const cooldowns = {};

function loadEconomyData() {
    try {
        if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify({}));
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
        console.error('Erreur lecture economy.json:', err);
        return {};
    }
}

function saveEconomyData(data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Erreur sauvegarde economy.json:', err);
    }
}

function getUserData(userId, guildId, data) {
    if (!data[guildId]) data[guildId] = {};
    if (!data[guildId][userId]) {
        data[guildId][userId] = {
            coins: 0,
            karma: 0
        };
    }
    return data[guildId][userId];
}

module.exports = {
    addMoney(userId, guildId, amount) {
        const data = loadEconomyData();
        const user = getUserData(userId, guildId, data);

        user.coins += amount;
        user.karma += 1;

        saveEconomyData(data);
    },

    getMoney(userId, guildId) {
        const data = loadEconomyData();
        const user = getUserData(userId, guildId, data);
        return user.coins;
    },

    getKarma(userId, guildId) {
        const data = loadEconomyData();
        const user = getUserData(userId, guildId, data);
        return user.karma;
    },

    isOnCooldown(userId, type) {
        if (!cooldowns[userId]) cooldowns[userId] = {};
        const now = Date.now();
        return cooldowns[userId][type] && cooldowns[userId][type] > now;
    },

    setCooldown(userId, type, duration) {
        if (!cooldowns[userId]) cooldowns[userId] = {};
        cooldowns[userId][type] = Date.now() + duration;
    }
};
