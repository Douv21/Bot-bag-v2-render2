// index.js - version corrigée avec prise en charge des interactions (boutons, select menus)

const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection, Partials, Events } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
    }
    if (command.commandName) {
        client.commands.set(command.commandName, command);
    }
}

client.once('ready', () => {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
    try {
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            await command.execute(interaction);
        } else if (interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) {
            const customId = interaction.customId;
            const [commandName] = customId.split('_');
            const command = client.commands.get(commandName);

            if (command && typeof command.handleInteraction === 'function') {
                await command.handleInteraction(interaction);
            } else {
                console.warn('Aucune commande ou handler trouvé pour:', customId);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: '❌ Cette interaction n\'est pas reconnue. Veuillez réessayer.',
                        ephemeral: true
                    });
                }
            }
        }
    } catch (error) {
        console.error('Erreur dans InteractionCreate:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ Une erreur est survenue.',
                ephemeral: true
            });
        }
    }
});

client.login(process.env.TOKEN);
