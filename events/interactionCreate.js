module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: "❌ Une erreur s'est produite lors de l'exécution de la commande.",
          flags: 64, // Réponse éphémère
        });
      }
    }

    if (interaction.isStringSelectMenu()) {
      // 🔧 Menu principal "configmenu"
      if (interaction.customId === 'configmenu') {
        const valeur = interaction.values[0];

        switch (valeur) {
          case 'configéconomie':
            await interaction.reply({
              content: '🪙 Tu as ouvert le menu de configuration économie.',
              flags: 64,
            });
            break;
          case 'configgénéral':
            await interaction.reply({
              content: '⚙️ Tu as ouvert le menu de configuration général.',
              flags: 64,
            });
            break;
          default:
            await interaction.reply({
              content: '❓ Option inconnue dans le menu config.',
              flags: 64,
            });
        }
      }

      // 🔧 Sous-menu "configeconomie_menu"
      if (interaction.customId === 'configeconomie_menu') {
        const option = interaction.values[0];

        switch (option) {
          case 'activer':
            await interaction.reply({
              content: '💰 Économie activée !',
              flags: 64,
            });
            break;
          case 'désactiver':
            await interaction.reply({
              content: '🔒 Économie désactivée.',
              flags: 64,
            });
            break;
          default:
            await interaction.reply({
              content: '❌ Option non reconnue dans configeconomie.',
              flags: 64,
            });
        }
      }
    }
  },
};
