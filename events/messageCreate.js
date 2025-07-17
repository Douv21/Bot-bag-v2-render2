const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    const filePath = path.join(__dirname, '..', 'data', 'economy.json');
    let data = {};

    // Lecture ou initialisation
    if (fs.existsSync(filePath)) {
      data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }

    const userId = message.author.id;
    const guildId = message.guild.id;

    // Init guild & user
    if (!data[guildId]) data[guildId] = {};
    if (!data[guildId][userId]) {
      data[guildId][userId] = {
        coins: 0,
        karma: 0,
        lastMessage: 0
      };
    }

    const now = Date.now();
    const cooldown = 60_000; // 1 minute entre les gains

    if (now - data[guildId][userId].lastMessage >= cooldown) {
      const gain = Math.floor(Math.random() * 10) + 5; // 5 à 15 coins
      data[guildId][userId].coins += gain;
      data[guildId][userId].karma += 1;
      data[guildId][userId].lastMessage = now;

      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

      console.log(`💰 ${message.author.tag} a gagné ${gain} coins et 1 karma.`);
    }
  }
};
