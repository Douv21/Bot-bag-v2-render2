module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // Gère boutons, menus string, menus channel
    if (
      !interaction.isButton() &&
      !interaction.isStringSelectMenu() &&
      !interaction.isChannelSelectMenu()
    ) return;

    // Conventions : customId = <commande>_<action>
    const [command] = interaction.customId.split('_');

    try {
      // Convention : dossier /commands/<command>.js
      // Pour la structure modulaire, adapte le chemin ici si besoin
      const handlerPath = `../commands/${command}.js`;
      const handler = require(handlerPath);

      if (interaction.isButton()) {
        if (handler.handleButtonInteraction) {
          await handler.handleButtonInteraction(interaction, client);
        } else if (handler.run) {
          await handler.run(interaction, client);
        }
      }

      if (interaction.isStringSelectMenu() || interaction.isChannelSelectMenu()) {
        if (handler.handleSelectMenuInteraction) {
          await handler.handleSelectMenuInteraction(interaction, client);
        } else if (handler.run) {
          await handler.run(interaction, client);
        }
      }

    } catch (error) {
      console.error(`❌ Erreur dans l'interaction ${interaction.customId}:`, error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '❌ Une erreur est survenue lors de l\'interaction.', ephemeral: true });
      } else {
        await interaction.editReply({ content: '❌ Une erreur est survenue lors de l\'interaction.' });
      }
    }
  }
};