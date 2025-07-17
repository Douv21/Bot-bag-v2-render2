const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('configeconomie')
    .setDescription("Configurer les paramètres de l'économie du serveur"),

  async execute(interaction) {
    console.log('✅ Commande /configeconomie exécutée');

    const embed = new EmbedBuilder()
      .setTitle("⚙️ Paramètres de l'économie")
      .setDescription("Choisissez un paramètre à modifier.")
      .setColor('Gold');

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('param1')
        .setLabel('💰 Paramètre 1')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('param2')
        .setLabel('📈 Paramètre 2')
        .setStyle(ButtonStyle.Primary)
    );

    // ✅ Répond rapidement avec defer
    await interaction.deferReply({ ephemeral: true });

    await interaction.editReply({
      embeds: [embed],
      components: [buttons]
    });
  },

  async handleInteraction(interaction) {
    if (!interaction.isButton()) return;

    const { customId } = interaction;

    let response = '';
    switch (customId) {
      case 'param1':
        response = '🔧 Vous avez sélectionné **Paramètre 1**.';
        break;
      case 'param2':
        response = '🔧 Vous avez sélectionné **Paramètre 2**.';
        break;
      default:
        response = '❓ Option inconnue.';
        break;
    }

    // ✅ Assure-toi de répondre rapidement
    await interaction.reply({
      content: response,
      ephemeral: true
    });
  }
};
