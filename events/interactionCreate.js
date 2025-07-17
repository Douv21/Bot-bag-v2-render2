module.exports = {
  name: 'interactionCreate',
  execute: async (interaction, client) => {
    console.log(`👉 Interaction reçue : ${interaction.type} | ${interaction.commandName || interaction.customId}`);

    try {
      // Si c'est une commande slash
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) {
          console.warn(`❌ Commande inconnue : ${interaction.commandName}`);
          return;
        }

        await command.execute(interaction, client);
      }

      // Si c'est un bouton, menu ou modal
      else if (
        interaction.isButton() ||
        interaction.isStringSelectMenu() ||
        interaction.isModalSubmit()
      ) {
        // On peut avoir plusieurs fichiers qui gèrent leurs propres interactions, ici on cible celui prévu
        const command = client.commands.get('configeconomie');
        if (command && typeof command.handleInteraction === 'function') {
          await command.handleInteraction(interaction, client);
        }
      }
    } catch (error) {
      console.error('❗ Erreur lors de l’exécution de l’interaction :', error);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "❌ Une erreur est survenue lors de l'exécution de la commande.",
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: "❌ Une erreur est survenue lors de l'exécution de la commande.",
          ephemeral: true
        });
      }
    }
  }
};
