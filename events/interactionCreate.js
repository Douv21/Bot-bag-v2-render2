module.exports = async (interaction, client) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: '❌ Une erreur est survenue.', ephemeral: true });
    }
  }

  // 🔁 Gestion des menus ou boutons de la commande /configeconomie
  if (interaction.isStringSelectMenu() || interaction.isButton()) {
    const customId = interaction.customId;

    if (customId.startsWith('configeconomie')) {
      try {
        const configModule = require('../commands/configeconomie');
        if (interaction.isStringSelectMenu() && configModule.handleSelectMenuInteraction) {
          await configModule.handleSelectMenuInteraction(interaction, client);
        } else if (interaction.isButton() && configModule.handleButtonInteraction) {
          await configModule.handleButtonInteraction(interaction, client);
        } else {
          console.warn('[⚠️] Interaction non gérée dans configeconomie.js');
        }
      } catch (err) {
        console.error('[❌] Erreur lors du chargement de configeconomie.js :', err);
        await interaction.reply({ content: 'Erreur interne : configeconomie.', ephemeral: true });
      }
    }
  }
};
