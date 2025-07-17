// events/messageCreate.js
module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    const fs = require('fs');
    const path = require('path');

    const filePath = path.join(__dirname, '..', 'data', 'economy.json');

    // Chargement ou initialisation de la base de données
    let data = {};
    if (fs.existsSync(filePath)) {
      data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }

    const userId = message.author.id;
    const guildId = message.guild.id;

    // Initialise si besoin
    if (!data[guildId]) data[guildId] = {};
    if (!data[guildId][userId]) {
      data[guildId][userId] = {
        coins: 0,
        lastMessage: 0
      };
    }

    const now = Date.now();
    const cooldown = 60000; // 1 min entre chaque gain

    if (now - data[guildId][userId].lastMessage >= cooldown) {
      const gain = Math.floor(Math.random() * 10) + 5; // 5 à 15 coins
      data[guildId][userId].coins += gain;
      data[guildId][userId].lastMessage = now;

      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`💸 ${message.author.tag} a gagné ${gain} coins !`);
    }
  }
};
