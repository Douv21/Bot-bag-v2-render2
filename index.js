// Configuration spéciale pour Render.com
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');
const countingManager = require('./utils/countingManager');
const dataManager = require('./utils/dataManager');
const keepAlive = require('./server'); // Pour uptime robot

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
    ],
});

client.commands = new Collection();
client.buttons = new Collection();
client.selectMenus = new Collection();
client.modals = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[AVERTISSEMENT] La commande au chemin ${filePath} n'a pas de propriété "data" ou "execute".`);
        }
    }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);

    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

const buttonsPath = path.join(__dirname, 'interactions/buttons');
const buttonFiles = fs.readdirSync(buttonsPath).filter(file => file.endsWith('.js'));

for (const file of buttonFiles) {
    const button = require(path.join(buttonsPath, file));
    client.buttons.set(button.data.name, button);
}

const selectMenusPath = path.join(__dirname, 'interactions/selectMenus');
const selectMenuFiles = fs.readdirSync(selectMenusPath).filter(file => file.endsWith('.js'));

for (const file of selectMenuFiles) {
    const selectMenu = require(path.join(selectMenusPath, file));
    client.selectMenus.set(selectMenu.data.name, selectMenu);
}

const modalsPath = path.join(__dirname, 'interactions/modals');
const modalFiles = fs.readdirSync(modalsPath).filter(file => file.endsWith('.js'));

for (const file of modalFiles) {
    const modal = require(path.join(modalsPath, file));
    client.modals.set(modal.data.name, modal);
}

client.on('interactionCreate', async interaction => {
    if (interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) return;

        try {
            await command.execute(interaction, client);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Une erreur est survenue lors de l\'exécution de cette commande.', ephemeral: true });
        }
    } else if (interaction.isButton()) {
        const button = client.buttons.get(interaction.customId);

        if (!button) return;

        try {
            await button.execute(interaction, client);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Une erreur est survenue lors de l\'exécution de ce bouton.', ephemeral: true });
        }
    } else if (interaction.isSelectMenu()) {
        const selectMenu = client.selectMenus.get(interaction.customId);

        if (!selectMenu) return;

        try {
            await selectMenu.execute(interaction, client);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Une erreur est survenue lors de l\'exécution de ce menu.', ephemeral: true });
        }
    } else if (interaction.isModalSubmit()) {
        const modal = client.modals.get(interaction.customId);

        if (!modal) return;

        try {
            await modal.execute(interaction, client);
        } catch (error) {
            console.error(error);
            try {
                await interaction.reply({ content: 'Une erreur est survenue lors de l\'exécution de ce formulaire.', ephemeral: true });
            } catch (followUpError) {
                console.error('❌ Failed to send error follow-up reply:', followUpError);
            }
        }
    }
});

client.login(config.token);
keepAlive();
