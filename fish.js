const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const economyManager = require('../utils/economyManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pecher')
        .setDescription('🎣 Pêchez du poisson pour gagner de l\'argent'),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const userId = interaction.user.id;
            const guildId = interaction.guild.id;

            const result = await economyManager.executeAction(userId, guildId, 'fish');

            if (!result.success) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Impossible de pêcher')
                    .setDescription(result.message);

                return await interaction.editReply({ embeds: [embed] });
            }

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('🎣 Bonne Pêche !')
                .setDescription('Vous avez attrapé de beaux poissons !')
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
                        value: `😇 +${result.karmaChange.good}`,
                        inline: true
                    }
                )
                .setFooter({ text: 'Cooldown: 30 minutes' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur commande fish:', error);
            await interaction.editReply({
                content: '❌ Une erreur s\'est produite lors de la pêche.'
            });
        }
    }
};