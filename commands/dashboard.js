const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dashboard')
        .setDescription('Accéder au tableau de bord web du bot')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            // Vérifier les permissions admin ou modérateur
            const hasAdminRole = interaction.member.roles.cache.some(role => 
                config.adminRoles.includes(role.name)
            );
            const hasModRole = interaction.member.roles.cache.some(role => 
                ['Modérateur', 'Moderateur', 'Modo', 'Staff'].includes(role.name)
            );
            
            if (!hasAdminRole && !hasModRole && !interaction.member.permissions.has(PermissionFlagsBits.Administrator) && !interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                return await interaction.reply({
                    content: '❌ Vous devez être administrateur ou modérateur pour utiliser cette commande.',
                    flags: 64
                });
            }

            // Générer l'URL du panel web
            const panelUrl = `https://${process.env.REPLIT_DEV_DOMAIN || 'workspace.replit.dev'}`;

            const embed = new EmbedBuilder()
                .setColor('#5865f2')
                .setTitle('🖥️ Panel de Configuration Web')
                .setDescription('Interface complète de gestion pour votre bot de confession')
                .addFields(
                    { 
                        name: '🌐 Accès Web', 
                        value: `[🔗 Ouvrir le Panel](${panelUrl})\n\`${panelUrl}\``, 
                        inline: false 
                    },
                    { 
                        name: '📊 Fonctionnalités', 
                        value: '• Configuration en temps réel\n• Statistiques détaillées\n• Gestion des canaux\n• Logs complets\n• Paramètres avancés', 
                        inline: true 
                    },
                    { 
                        name: '🔧 Alternatives', 
                        value: '• `/config` - Configuration rapide\n• `/stats` - Statistiques Discord', 
                        inline: true 
                    }
                )
                .addFields({
                    name: '⚠️ Accès Sécurisé',
                    value: 'Le panel web est accessible uniquement aux administrateurs du serveur.',
                    inline: false
                })
                .setTimestamp()
                .setFooter({ text: 'Panel Web Bot Confession' });

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('🌐 Ouvrir le Panel Web')
                        .setStyle(ButtonStyle.Link)
                        .setURL(panelUrl),
                    new ButtonBuilder()
                        .setLabel('📊 Stats Discord')
                        .setCustomId('show_stats')
                        .setStyle(ButtonStyle.Secondary)
                );

            await interaction.reply({
                embeds: [embed],
                components: [row],
                flags: 64
            });

        } catch (error) {
            console.error('Erreur dans la commande dashboard:', error);
            
            const errorMessage = '❌ Une erreur s\'est produite lors de l\'ouverture du dashboard.';
            
            if (interaction.deferred) {
                await interaction.editReply({ content: errorMessage });
            } else {
                await interaction.reply({ content: errorMessage, flags: 64 });
            }
        }
    },

    async handleButtonInteraction(interaction) {
        if (interaction.customId === 'show_stats') {
            // Charger et exécuter la commande stats
            const statsCommand = require('./stats');
            await statsCommand.execute(interaction);
        }
    }
};