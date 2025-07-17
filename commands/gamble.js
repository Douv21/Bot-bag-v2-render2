const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const economyManager = require('../utils/economyManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('parier')
        .setDescription('🎰 Pariez votre argent (très risqué)'),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const userId = interaction.user.id;
            const guildId = interaction.guild.id;

            const result = await economyManager.executeAction(userId, guildId, 'gamble');

            if (!result.success) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Impossible de parier')
                    .setDescription(result.message);

                return await interaction.editReply({ embeds: [embed] });
            }

            const embed = new EmbedBuilder()
                .setColor(result.reward > 0 ? '#ffaa00' : '#ff0000')
                .setTitle(result.reward > 0 ? '🎰 Jackpot !' : '🎰 Perdu !')
                .setDescription(result.reward > 0 ? 
                    'Dame Fortune vous sourit ! Vous avez gagné !' :
                    'La chance n\'était pas de votre côté... Vous avez perdu.')
                .addFields(
                    {
                        name: '💶 Résultat',
                        value: result.reward > 0 ? 
                            `+${result.reward}€` : 
                            `${result.reward}€`,
                        inline: true
                    },
                    {
                        name: '💶 Nouveau Solde',
                        value: `${result.newBalance}€`,
                        inline: true
                    },
                    {
                        name: '📊 Karma',
                        value: `😇 ${result.karmaChange.good} | 😈 +${result.karmaChange.bad}`,
                        inline: true
                    }
                )
                .setFooter({ text: 'Cooldown: 1 heure | 50% de chance de perdre' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur commande gamble:', error);
            await interaction.editReply({
                content: '❌ Une erreur s\'est produite lors du pari.'
            });
        }
    }
};