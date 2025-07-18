const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ]
});

// Collection des commandes
client.commands = new Collection();
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
            console.log(`[AVERTISSEMENT] La commande dans ${filePath} est manquante.`);
        }
    }
}

// Gestion des interactions (commandes, boutons, menus, modales)
client.on(Events.InteractionCreate, async interaction => {
    try {
        // Slash commands
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            await command.execute(interaction);
        }

        // Interactions par customId (boutons, menus, modales)
        else if (interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) {
            const customId = interaction.customId;
            const baseCommandName = customId?.split('_')[0]; // Ex: configeconomie_valider → configeconomie
            const command = client.commands.get(baseCommandName);

            if (!command) return;

            if (interaction.isButton() && command.handleButtonInteraction) {
                await command.handleButtonInteraction(interaction);
            } else if (interaction.isStringSelectMenu() && command.handleSelectMenuInteraction) {
                await command.handleSelectMenuInteraction(interaction);
            } else if (interaction.isModalSubmit() && command.handleModalSubmit) {
                await command.handleModalSubmit(interaction);
            } else {
                console.warn(`[WARN] Pas de handler pour ${customId}`);
            }
        }
    } catch (error) {
        console.error('❌ Erreur dans interactionCreate:', error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'Une erreur est survenue lors de l’exécution de la commande.', ephemeral: true });
        } else {
            await interaction.reply({ content: 'Une erreur est survenue.', ephemeral: true });
        }
    }
});

// Connexion du bot
client.once(Events.ClientReady, c => {
    console.log(`✅ Connecté en tant que ${c.user.tag}`);
});

client.login(process.env.TOKEN);
