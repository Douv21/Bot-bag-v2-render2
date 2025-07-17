const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = async (client) => {
    const commands = [];
    const commandsPath = path.join(__dirname, '..', 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(path.join(commandsPath, file));
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        }
    }

    const rest = new REST().setToken(process.env.DISCORD_TOKEN);
    try {
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        console.log(`✅ ${data.length} commandes slash déployées.`);
    } catch (err) {
        console.error('Erreur de déploiement des commandes :', err);
    }
};
