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
          ephemeral: true,
        });
      }
    }

    if (interaction.isStringSelectMenu()) {
      // 🎯 Menu principal de configuration
      if (interaction.customId === 'configmenu') {
        const selected = interaction.values[0];

        switch (selected) {
          case 'configéconomie':
            await interaction.reply({
              content: '🪙 Tu as ouvert le menu de configuration économie.',
              ephemeral: true,
            });
            break;

          case 'configgénéral':
            await interaction.reply({
              content: '⚙️ Tu as ouvert le menu de configuration général.',
              ephemeral: true,
            });
            break;

          default:
            await interaction.reply({
              content: '❓ Option inconnue dans le menu config.',
              ephemeral: true,
            });
        }
      }

      // 🧩 Sous-menu potentiel : configéconomie
      if (interaction.customId === 'configeconomie_menu') {
        const sousChoix = interaction.values[0];

        switch (sousChoix) {
          case 'activer':
            await interaction.reply({ content: '💰 Économie activée !', ephemeral: true });
            break;

          case 'désactiver':
            await interaction.reply({ content: '🔒 Économie désactivée.', ephemeral: true });
            break;

          default:
            await interaction.reply({
              content: '❌ Option non reconnue dans configeconomie.',
              ephemeral: true,
            });
        }
      }
    }
  },
};
