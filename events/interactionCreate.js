const { Events } = require('discord.js');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) {
        console.error(`❌ Commande introuvable : ${interaction.commandName}`);
        return;
      }

      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(`❌ Erreur dans la commande ${interaction.commandName} :`, error);
        await interaction.reply({
          content: '❌ Une erreur s’est produite lors de l’exécution de la commande.',
          ephemeral: true
        });
      }
    }
  }
};
