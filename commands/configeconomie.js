const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('configeconomie')
    .setDescription("Configurer l'économie du serveur"),

  async execute(interaction) {
    console.log('Commande /configeconomie exécutée');

    const embed = new EmbedBuilder()
      .setTitle("Paramètres de l'économie")
      .setDescription("Choisissez un paramètre à modifier.")
      .setColor('Gold');

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('param1')
        .setLabel('Paramètre 1')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('param2')
        .setLabel('Paramètre 2')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({
      embeds: [embed],
      components: [buttons],
      flags: MessageFlags.Ephemeral // ⚠️ remplace "ephemeral: true"
    });
  },

  async handleInteraction(interaction) {
    console.log('Interaction personnalisée reçue :', interaction.customId);

    if (!interaction.isButton()) return;

    let response = '';

    switch (interaction.customId) {
      case 'param1':
        response = 'Vous avez choisi Paramètre 1.';
        break;
      case 'param2':
        response = 'Vous avez choisi Paramètre 2.';
        break;
      default:
        response = 'Action inconnue.';
        break;
    }

    await interaction.reply({
      content: response,
      flags: MessageFlags.Ephemeral
    });
  }
};
