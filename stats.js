const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config.json');
const logger = require('../utils/logger');
const rateLimit = require('../utils/rateLimit');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Afficher les statistiques du bot de confession')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            // Vérifier les permissions admin
            const hasAdminRole = interaction.member.roles.cache.some(role => 
                config.adminRoles.includes(role.name)
            );
            
            if (!hasAdminRole && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return await interaction.reply({
                    content: '❌ Vous n\'avez pas la permission d\'utiliser cette commande.',
                    flags: 64
                });
            }

            const stats = logger.getStatistics();
            const rateLimitStats = rateLimit.getStatistics();

            // Configuration actuelle
            const confessionChannels = config.confessionChannels.map(id => {
                const channel = interaction.guild.channels.cache.get(id);
                return channel ? `<#${id}>` : `Canal supprimé (${id})`;
            }).join('\n') || 'Aucun canal configuré';

            const logChannel = config.logChannelId ? 
                `<#${config.logChannelId}>` : 'Aucun canal configuré';

            const embed = new EmbedBuilder()
                .setColor('#5865f2')
                .setTitle('📊 Statistiques du Bot de Confession')
                .setDescription(`Statistiques détaillées pour le serveur **${interaction.guild.name}**`)
                .addFields(
                    { 
                        name: '📈 Confessions', 
                        value: `**${stats.totalConfessions}** au total\n**${stats.last24Hours}** dernières 24h\n**${stats.uniqueUsers}** utilisateurs uniques`, 
                        inline: true 
                    },
                    { 
                        name: '📝 Types de contenu', 
                        value: `**${stats.textOnly}** texte seulement\n**${stats.imageOnly}** image seulement\n**${stats.textAndImage}** texte + image`, 
                        inline: true 
                    },
                    { 
                        name: '⚡ Rate Limiting', 
                        value: `**${rateLimitStats.activeUsers}** utilisateurs actifs\n**${rateLimitStats.totalBlocked}** tentatives bloquées\n**${config.rateLimitMax}** max par ${config.rateLimitWindow/60000}min`, 
                        inline: true 
                    },
                    { 
                        name: '📝 Canaux de Confession', 
                        value: confessionChannels, 
                        inline: false 
                    },
                    { 
                        name: '📋 Canal de Logs Admin', 
                        value: logChannel, 
                        inline: false 
                    },
                    { 
                        name: '⚙️ Configuration', 
                        value: `Texte max: **${config.maxTextLength}** caractères\nImage max: **${(config.maxImageSize/1024/1024).toFixed(1)}** MB\nContenu requis: **${config.requireContent ? 'Oui' : 'Non'}**`, 
                        inline: false 
                    }
                )
                .setTimestamp()
                .setFooter({ text: `Bot Confession • Serveur: ${interaction.guild.name}` });

            await interaction.reply({
                embeds: [embed],
                flags: 64
            });

        } catch (error) {
            console.error('Erreur dans la commande stats:', error);
            
            await interaction.reply({
                content: '❌ Une erreur s\'est produite lors de la récupération des statistiques.',
                flags: 64
            });
        }
    }
};