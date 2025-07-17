const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const economyManager = require('../utils/economyManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('karma')
        .setDescription('⚖️ Affiche les classements karma (bon et mauvais) du serveur'),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const guildId = interaction.guild.id;
            
            const karmaGoodTop = await economyManager.getLeaderboard(guildId, 'karma_good', 10);
            const karmaBadTop = await economyManager.getLeaderboard(guildId, 'karma_bad', 10);

            let karmaGoodText = '';
            if (karmaGoodTop.length === 0) {
                karmaGoodText = 'Aucun membre avec bon karma';
            } else {
                for (let i = 0; i < karmaGoodTop.length; i++) {
                    const user = karmaGoodTop[i];
                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
                    karmaGoodText += `${medal} <@${user.id}> - **${user.karma_good}**😇\n`;
                }
            }

            let karmaBadText = '';
            if (karmaBadTop.length === 0) {
                karmaBadText = 'Aucun membre avec mauvais karma';
            } else {
                for (let i = 0; i < karmaBadTop.length; i++) {
                    const user = karmaBadTop[i];
                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
                    karmaBadText += `${medal} <@${user.id}> - **${user.karma_bad}**😈\n`;
                }
            }

            const embed = new EmbedBuilder()
                .setColor('#9932cc')
                .setTitle('⚖️ Classements Karma du Serveur')
                .addFields(
                    {
                        name: '😇 Top Bon Karma',
                        value: karmaGoodText,
                        inline: true
                    },
                    {
                        name: '😈 Top Mauvais Karma',
                        value: karmaBadText,
                        inline: true
                    }
                )
                .setFooter({ text: 'Karma basé sur vos actions économiques' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur karma:', error);
            await interaction.editReply({
                content: '❌ Une erreur s\'est produite lors de l\'affichage des classements karma.'
            });
        }
    }
};