const { EmbedBuilder } = require('discord.js');

module.exports = {
  async handleSelectMenuInteraction(interaction, client) {
    const selected = interaction.values[0];

    let embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🛠️ Menu Configuration')
      .setFooter({ text: 'Bot BAG - Configuration Économie' });

    switch (selected) {
      case 'commandes':
        embed.setDescription('⚙️ Vous avez choisi **Réglage des commandes**.');
        break;
      case 'karma':
        embed.setDescription('💫 Vous avez choisi **Réglage du karma**.');
        break;
      case 'reset':
        embed.setDescription('♻️ Vous avez choisi **Réglage du reset**.');
        break;
      case 'messages':
        embed.setDescription('💬 Vous avez choisi **Réglage des messages**.');
        break;
      case 'boutique':
        embed.setDescription('🛍️ Vous avez choisi **Réglage de la boutique**.');
        break;
      default:
        embed.setDescription('❌ Option inconnue.');
        break;
    }

    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  }
};
