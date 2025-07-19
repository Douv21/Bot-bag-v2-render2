// 📦 Import des modules
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
require('./keep_alive.js'); // Serveur Express pour Render + UptimeRobot

// 🤖 Initialisation du bot avec les intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers, // utile pour les événements membres
  ],
});

// 📁 Collection des commandes Slash
client.commands = new Collection();

// 🔄 Chargement des commandes dans ./commands/
const commandFolders = fs.readdirSync('./commands');
for (const folder of commandFolders) {
  const commandFiles = fs
    .readdirSync(`./commands/${folder}`)
    .filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(__dirname, `commands/${folder}/${file}`);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.warn(`[⚠️] La commande ${file} n'a pas les propriétés "data" ou "execute".`);
    }
  }
}

// 📂 Chargement des événements dans ./events/
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const eventPath = path.join(eventsPath, file);
  const event = require(eventPath);

  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

// 🚀 Connexion du bot
client.login(process.env.TOKEN);
