module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // Vérifie les types d'interactions
    if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

    const [command, action] = interaction.customId.split('_');

    try {
      // Chargement du handler selon la convention /commands/<command>/<action>.js
      const handlerPath = `../commands/${command}/config_${action}.js`;
      const handler = require(handlerPath);

      if (interaction.isButton()) {
        if (handler.run) {
          await handler.run(interaction, client);
        } else if (handler.handleButtonInteraction) {
          await handler.handleButtonInteraction(interaction, client);
        } else {
          console.warn(`⚠️ Le handler ${handlerPath} ne contient pas de méthode valide pour bouton.`);
        }
      }

      if (interaction.isStringSelectMenu()) {
        if (handler.run) {
          await handler.run(interaction, client);
        } else if (handler.handleSelectMenuInteraction) {
          await handler.handleSelectMenuInteraction(interaction, client);
        } else {
          console.warn(`⚠️ Le handler ${handlerPath} ne contient pas de méthode valide pour menu.`);
        }
      }

    } catch (error) {
      console.error(`❌ Erreur dans l'interaction ${interaction.customId}:`, error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: '❌ Une erreur est survenue lors de l\'interaction.', ephemeral: true });
      } else {
        await interaction.reply({ content: '❌ Une erreur est survenue lors de l\'interaction.', ephemeral: true });
      }
    }
  }
};
