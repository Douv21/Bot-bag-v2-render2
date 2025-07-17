module.exports = {
    name: 'interactionCreate',
    execute: async (interaction, client) => {
        console.log('Interaction reçue :', interaction.type, interaction.customId || interaction.commandName);

        if (interaction.isChatInputCommand()) {
            const cmd = client.commands.get(interaction.commandName);
            if (cmd) return await cmd.execute(interaction);
        } else if (interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) {
            const cmd = client.commands.get('configeconomie');
            if (cmd && cmd.handleInteraction) {
                return await cmd.handleInteraction(interaction);
            }
        }
    }
};
