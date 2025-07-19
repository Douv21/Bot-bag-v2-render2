const { Client, Collection, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
require('./keep_alive.js'); // Serveur Express pour Render + UptimeRobot

// 🤖 Initialisation du client Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// 📁 Collection des commandes
client.commands = new Collection();

// 🔄 Chargement des commandes dans ./commands (pas de sous-dossiers)
const commandFiles = fs
  .readdirSync('./commands')
  .filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.warn(`[⚠️] La commande ${file} est invalide (manque .data ou .execute).`);
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

// 🔐 Connexion au bot via token
client.login(process.env.TOKEN);
