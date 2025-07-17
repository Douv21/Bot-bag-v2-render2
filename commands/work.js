const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const economyManager = require('../utils/economyManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('travailler')
        .setDescription('💼 Travaillez pour gagner de l\'argent honnêtement'),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const userId = interaction.user.id;
            const guildId = interaction.guild.id;

            const result = await economyManager.executeAction(userId, guildId, 'work');

            if (!result.success) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Impossible de travailler')
                    .setDescription(result.message);

                return await interaction.editReply({ embeds: [embed] });
            }

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('💼 Travail Terminé !')
                .setDescription('Vous avez travaillé dur et gagné de l\'argent honnêtement.')
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
                        value: `😇 +${result.karmaChange.good} | 😈 ${result.karmaChange.bad}`,
                        inline: true
                    }
                )
                .setFooter({ text: 'Cooldown: 1 heure' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur commande work:', error);
            await interaction.editReply({
                content: '❌ Une erreur s\'est produite lors du travail.'
            });
        }
    }
};