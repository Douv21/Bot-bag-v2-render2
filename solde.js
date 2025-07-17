const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const economyManager = require('../utils/economyManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('solde')
        .setDescription('€ Consulter le solde et le karma d\'un membre')
        .addUserOption(option =>
            option.setName('membre')
                .setDescription('Membre dont consulter le solde (optionnel)')
                .setRequired(false)),

    async execute(interaction) {
        try {
            // Defer immédiatement pour éviter timeout
            await interaction.deferReply({ flags: 0 });
            const targetUser = interaction.options.getUser('membre') || interaction.user;
            const guildId = interaction.guild.id;
            const userId = targetUser.id;

            // Créer ou récupérer l'utilisateur directement  
            const user = await economyManager.getOrCreateUser(userId, guildId);
            
            console.log(`Données solde utilisateur ${userId}:`, user);
            const isOwnProfile = targetUser.id === interaction.user.id;

            // Utiliser les champs unifiés comme userinfo.js
            const karmaGood = Math.max(user.karmaGood || 0, user.karma_good || 0);
            const karmaBad = Math.max(user.karmaBad || 0, user.karma_bad || 0);
            const karmaTotal = karmaGood - karmaBad;
            let karmaLevel = 'Neutre';
            let karmaEmoji = '⚖️';
            
            if (karmaTotal > 50) {
                karmaLevel = 'Saint';
                karmaEmoji = '😇';
            } else if (karmaTotal > 20) {
                karmaLevel = 'Très Bon';
                karmaEmoji = '😊';
            } else if (karmaTotal > 5) {
                karmaLevel = 'Bon';
                karmaEmoji = '🙂';
            } else if (karmaTotal < -50) {
                karmaLevel = 'Diabolique';
                karmaEmoji = '😈';
            } else if (karmaTotal < -20) {
                karmaLevel = 'Très Mauvais';
                karmaEmoji = '😠';
            } else if (karmaTotal < -5) {
                karmaLevel = 'Mauvais';
                karmaEmoji = '😒';
            }

            const embed = new EmbedBuilder()
                .setColor(karmaTotal > 0 ? '#00ff00' : karmaTotal < 0 ? '#ff0000' : '#ffff00')
                .setTitle(`${karmaEmoji} Profil de ${targetUser.displayName}`)
                .setThumbnail(targetUser.displayAvatarURL())
                .addFields(
                    {
                        name: '💶 Solde',
                        value: `**${user.balance || 0}€**`,
                        inline: true
                    },
                    {
                        name: '📊 Karma Total',
                        value: `**${karmaTotal}** (${karmaLevel})`,
                        inline: true
                    },
                    {
                        name: '😇 Karma Bon',
                        value: `${karmaGood}`,
                        inline: true
                    },
                    {
                        name: '😈 Karma Mauvais', 
                        value: `${karmaBad}`,
                        inline: true
                    },
                    {
                        name: '🏆 Rang',
                        value: `Level ${karmaLevel}`,
                        inline: true
                    },
                    {
                        name: '🎯 Statut',
                        value: karmaTotal > 0 ? '✅ Citoyen Exemplaire' : 
                               karmaTotal < 0 ? '⚠️ Surveillance Requise' : 
                               '🔄 Profil Neutre',
                        inline: true
                    }
                )
                .setFooter({ 
                    text: isOwnProfile ? 
                        'Gagnez de l\'argent avec /daily, /travailler, /pecher, /donner' : 
                        `Demandé par ${interaction.user.username}`,
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setTimestamp();

            await interaction.editReply({ 
                embeds: [embed]
            });

        } catch (error) {
            console.error('Erreur solde:', error);
            try {
                if (interaction.deferred) {
                    await interaction.editReply({
                        content: '❌ Erreur lors de la consultation du profil.'
                    });
                } else {
                    await interaction.reply({
                        content: '❌ Erreur lors de la consultation du profil.',
                        flags: 64
                    });
                }
            } catch (replyError) {
                console.error('Erreur lors de la réponse:', replyError);
            }
        }
    }
};