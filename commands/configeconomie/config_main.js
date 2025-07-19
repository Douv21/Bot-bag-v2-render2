module.exports = {
  run: async (interaction, client) => {
    await interaction.reply({
      content: '✅ Interaction "config_main" bien reçue !',
      ephemeral: true,
    });
  },
};