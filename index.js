const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const express = require('express');
require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.commands = new Collection();

// Charger les commandes à la racine du dossier /commands
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
    } else {
        console.warn(`[⚠️] La commande ${file} est invalide.`);
    }
}

// Charger les commandes dans les sous-dossiers de /commands
const commandFolders = fs.readdirSync('./commands').filter(f => fs.lstatSync(`./commands/${f}`).isDirectory());
for (const folder of commandFolders) {
    const subCommandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
    for (const file of subCommandFiles) {
        const command = require(`./commands/${folder}/${file}`);
        if (command.data && command.execute) {
            client.commands.set(command.data.name, command);
        } else {
            console.warn(`[⚠️] La commande ${folder}/${file} est invalide.`);
        }
    }
}

// InteractionCreate handler
const interactionHandler = require('./events/interactionCreate');
client.on('interactionCreate', async interaction => {
    try {
        await interactionHandler(interaction, client);
    } catch (error) {
        console.error('Erreur dans interactionCreate:', error);
    }
});

// Démarrer le serveur Express pour Render (garder vivant)
const app = express();
app.get('/', (req, res) => res.send('Bot en ligne !'));
app.listen(process.env.PORT || 3000, () => {
    console.log('Serveur web lancé.');
});

client.once('ready', () => {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

client.login(process.env.TOKEN);