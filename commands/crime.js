const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const economyManager = require('../utils/economyManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('crime')
        .setDescription('🔫 Commettez un crime pour beaucoup d\'argent'),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const userId = interaction.user.id;
            const guildId = interaction.guild.id;

            const result = await economyManager.executeAction(userId, guildId, 'crime');

            if (!result.success) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Impossible de commettre un crime')
                    .setDescription(result.message);

                return await interaction.editReply({ embeds: [embed] });
            }

            const embed = new EmbedBuilder()
                .setColor('#cc0000')
                .setTitle('🔫 Crime Accompli !')
                .setDescription('Vous avez commis un crime grave et gagné beaucoup d\'argent.')
                .addFields(
                    {
                        name: '💶 Gain',
                        value: `+${result.reward}€`,
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
                .setFooter({ text: 'Cooldown: 2 heures | Action très mauvaise pour le karma' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur commande crime:', error);
            await interaction.editReply({
                content: '❌ Une erreur s\'est produite lors du crime.'
            });
        }
    }
};