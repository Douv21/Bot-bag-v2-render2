const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
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

    const select = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('menu_config')
        .setPlaceholder('🔽 Choisissez un paramètre')
        .addOptions(
          {
            label: 'Taux de gain',
            value: 'gain'
          },
          {
            label: 'Limite journalière',
            value: 'daily_limit'
          }
        )
    );

    await interaction.deferReply({ flags: 64 }); // ⇨ réponse éphémère moderne

    await interaction.editReply({
      embeds: [embed],
      components: [buttons, select]
    });
  },

  async handleInteraction(interaction) {
    const { customId } = interaction;

    // Gestion des boutons
    if (interaction.isButton()) {
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

      return await interaction.reply({
        content: response,
        flags: 64
      });
    }

    // Gestion du select menu
    if (interaction.isStringSelectMenu()) {
      let response = '';

      switch (interaction.values[0]) {
        case 'gain':
          response = '💸 Vous avez choisi de modifier le **taux de gain**.';
          break;
        case 'daily_limit':
          response = '📅 Vous avez choisi de modifier la **limite journalière**.';
          break;
        default:
          response = '❓ Option de menu inconnue.';
          break;
      }

      return await interaction.reply({
        content: response,
        flags: 64
      });
    }
  }
};
