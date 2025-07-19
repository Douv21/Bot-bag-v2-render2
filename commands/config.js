const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ChannelSelectMenuBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config.json');
const logger = require('../utils/logger');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('configconfession')
        .setDescription('Configuration du système de confession')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        try {
            // Vérifier les permissions staff
            const staffCommand = interaction.client.commands.get('staff');
            if (!staffCommand || !staffCommand.hasStaffPermission(interaction.member, interaction.guild.id)) {
                return await interaction.reply({
                    content: '❌ Vous devez être administrateur ou avoir un rôle staff pour utiliser cette commande.',
                    flags: 64
                });
            }
            await showMainConfig(interaction);
        } catch (error) {
            console.error('Erreur dans la commande config:', error);
            await safeReply(interaction, '❌ Une erreur s\'est produite lors de l\'ouverture de la configuration.');
        }
    },

    async handleButtonInteraction(interaction) {
        try {
            const customId = interaction.customId;
            if (customId === 'config_back_main') {
                await showMainConfig(interaction);
            } else if (customId === 'config_back_channels') {
                await showChannelsConfig(interaction);
            } else if (customId === 'config_back_autothread') {
                await showAutoThreadConfig(interaction);
            }
        } catch (error) {
            console.error('Erreur bouton config:', error);
            await safeReply(interaction, '❌ Une erreur s\'est produite lors du traitement de votre sélection.');
        }
    },

    async handleSelectMenuInteraction(interaction) {
        try {
            const customId = interaction.customId;
            // Menu principal
            if (customId === 'config_main') {
                const value = interaction.values[0];
                if (value === 'channels') {
                    await showChannelsConfig(interaction);
                } else if (value === 'logs') {
                    await showLogsConfig(interaction);
                } else if (value === 'autothread') {
                    await showAutoThreadConfig(interaction);
                }
            }
            // Actions canaux
            else if (customId === 'config_channels_action') {
                const value = interaction.values[0];
                if (value === 'add') {
                    await showChannelAdd(interaction);
                } else if (value === 'remove') {
                    await showChannelRemove(interaction);
                } else if (value === 'back') {
                    await showMainConfig(interaction);
                }
            }
            // Ajout de canal (ChannelSelectMenu)
            else if (customId === 'config_channel_add') {
                await addChannel(interaction);
            }
            // Suppression de canal (StringSelectMenu)
            else if (customId === 'config_channel_remove') {
                await removeChannel(interaction);
            }
            // Configuration du canal de logs (ChannelSelectMenu)
            else if (customId === 'config_log_channel') {
                await setLogChannel(interaction);
            }
            // Auto-thread actions
            else if (customId === 'config_autothread_action') {
                const value = interaction.values[0];
                if (value === 'add') {
                    await showAutoThreadAdd(interaction);
                } else if (value === 'remove') {
                    await showAutoThreadRemove(interaction);
                } else if (value === 'settings') {
                    await showAutoThreadSettings(interaction);
                } else if (value === 'back') {
                    await showMainConfig(interaction);
                }
            }
            // Auto-thread ajout de canal (ChannelSelectMenu)
            else if (customId === 'config_autothread_add') {
                await addAutoThreadChannel(interaction);
            }
            // Auto-thread suppression de canal (StringSelectMenu)
            else if (customId === 'config_autothread_remove') {
                await removeAutoThreadChannel(interaction);
            }
            // Auto-thread paramètres (StringSelectMenu)
            else if (customId === 'config_autothread_settings') {
                await updateAutoThreadSettings(interaction);
            }
        } catch (error) {
            console.error('Erreur menu config:', error);
            await safeReply(interaction, '❌ Une erreur s\'est produite lors du traitement de votre sélection.');
        }
    }
};

// Sécurise la réponse à Discord (évite erreur double réponse)
async function safeReply(interaction, content) {
    if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content, flags: 64 }).catch(() => {});
    } else {
        await interaction.editReply({ content }).catch(() => {});
    }
}

async function showMainConfig(interaction) {
    const stats = logger.getStatistics() || {
        totalConfessions: 0,
        uniqueUsers: 0,
        last24Hours: 0
    };

    const embed = new EmbedBuilder()
        .setColor('#5865f2')
        .setTitle('⚙️ Configuration - Bot Confession')
        .setDescription('Configuration simple du système de confession')
        .addFields(
            { name: '📊 Statistiques', value: `**${stats.totalConfessions}** confessions totales\n**${stats.uniqueUsers}** utilisateurs uniques\n**${stats.last24Hours}** dernières 24h`, inline: true },
            { name: '📝 Canaux configurés', value: `**${config.confessionChannels.length}** canaux de confession`, inline: true },
            { name: '📋 Canal de logs', value: config.logChannelId ? `<#${config.logChannelId}>` : 'Aucun', inline: true },
            { name: '🧵 Auto-Thread', value: config.autoThreadSettings?.enabled ? `${config.autoThreadSettings.channels.length} canaux` : 'Désactivé', inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'Configuration Discord Bot' });

    const row = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('config_main')
                .setPlaceholder('⚙️ Sélectionner une option...')
                .addOptions([
                    { label: 'Gérer les Canaux de Confession', description: 'Activer/désactiver les canaux autorisés', value: 'channels', emoji: '📝' },
                    { label: 'Canal de Logs', description: 'Définir où envoyer les logs des confessions', value: 'logs', emoji: '📋' },
                    { label: 'Auto-Thread Confessions', description: 'Configurer la création automatique de threads', value: 'autothread', emoji: '🧵' }
                ])
        );

    const method = interaction.deferred || interaction.replied ? 'editReply' : 'reply';
    await interaction[method]({ embeds: [embed], components: [row], flags: 64 });
}

async function showChannelsConfig(interaction) {
    const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('📝 Gestion des Canaux de Confession')
        .setDescription('Activez ou désactivez les canaux autorisés pour les confessions')
        .addFields(
            { name: 'Canaux configurés', value: config.confessionChannels.length > 0 ? config.confessionChannels.map(id => `<#${id}>`).join('\n') : 'Aucun canal configuré', inline: false }
        );

    const row = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('config_channels_action')
                .setPlaceholder('🔧 Choisir une action...')
                .addOptions([
                    { label: 'Ajouter un Canal', value: 'add', emoji: '➕' },
                    { label: 'Supprimer un Canal', value: 'remove', emoji: '➖' },
                    { label: '← Retour', value: 'back', emoji: '🔙' }
                ])
        );

    await interaction.update({ embeds: [embed], components: [row], flags: 64 });
}

async function showChannelAdd(interaction) {
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('➕ Ajouter un Canal de Confession')
        .setDescription('Sélectionnez le canal textuel où les confessions pourront être postées');

    const row1 = new ActionRowBuilder()
        .addComponents(
            new ChannelSelectMenuBuilder()
                .setCustomId('config_channel_add')
                .setChannelTypes([0])
                .setPlaceholder('📝 Sélectionner un canal textuel...')
        );

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('config_back_channels')
                .setLabel('← Retour')
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.update({ embeds: [embed], components: [row1, row2], flags: 64 });
}

async function addChannel(interaction) {
    const channelId = interaction.values[0];
    const channel = interaction.guild.channels.cache.get(channelId);

    if (!channel) {
        return await interaction.update({
            content: `❌ Le canal sélectionné n'existe plus.`,
            embeds: [],
            components: [],
            flags: 64
        });
    }

    if (config.confessionChannels.includes(channel.id)) {
        return await interaction.update({
            content: `❌ Le canal ${channel} est déjà configuré comme canal de confession.`,
            embeds: [],
            components: [],
            flags: 64
        });
    }

    config.confessionChannels.push(channel.id);
    fs.writeFileSync('./config.json', JSON.stringify(config, null, 4));

    const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('✅ Canal Ajouté')
        .setDescription(`Le canal ${channel} a été ajouté avec succès aux canaux de confession.`)
        .addFields(
            { name: 'Canal ajouté', value: `${channel}`, inline: true },
            { name: 'Total des canaux', value: `${config.confessionChannels.length}`, inline: true }
        );

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('config_back_channels')
                .setLabel('← Retour aux Canaux')
                .setStyle(ButtonStyle.Primary)
        );

    await interaction.update({ embeds: [embed], components: [row], flags: 64 });
}

async function showChannelRemove(interaction) {
    if (config.confessionChannels.length === 0) {
        const embed = new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle('📋 Aucun Canal Configuré')
            .setDescription('Il n\'y a actuellement aucun canal de confession configuré à supprimer.');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('config_back_channels')
                    .setLabel('← Retour')
                    .setStyle(ButtonStyle.Secondary)
            );

        return await interaction.update({ embeds: [embed], components: [row], flags: 64 });
    }

    const embed = new EmbedBuilder()
        .setColor('#ff6b6b')
        .setTitle('➖ Supprimer un Canal de Confession')
        .setDescription('Sélectionnez le canal à retirer de la liste des canaux de confession');

    const options = config.confessionChannels.map(channelId => {
        const channel = interaction.guild.channels.cache.get(channelId);
        return {
            label: channel ? channel.name : 'Canal non trouvé',
            value: channelId,
            description: channel ? `Canal: #${channel.name}` : 'Canal supprimé du serveur',
            emoji: '📝'
        };
    });

    const row1 = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('config_channel_remove')
                .setPlaceholder('🗑️ Sélectionner un canal à supprimer...')
                .addOptions(options)
        );

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('config_back_channels')
                .setLabel('← Retour')
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.update({ embeds: [embed], components: [row1, row2], flags: 64 });
}

async function removeChannel(interaction) {
    const channelId = interaction.values[0];
    const channel = interaction.guild.channels.cache.get(channelId);

    const index = config.confessionChannels.indexOf(channelId);
    if (index > -1) {
        config.confessionChannels.splice(index, 1);
        fs.writeFileSync('./config.json', JSON.stringify(config, null, 4));
    }

    const embed = new EmbedBuilder()
        .setColor('#ff6b6b')
        .setTitle('✅ Canal Supprimé')
        .setDescription(`Le canal ${channel ? channel : 'supprimé'} a été retiré des canaux de confession.`)
        .addFields(
            { name: 'Canal retiré', value: channel ? `${channel}` : 'Canal supprimé', inline: true },
            { name: 'Canaux restants', value: `${config.confessionChannels.length}`, inline: true }
        );

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('config_back_channels')
                .setLabel('← Retour aux Canaux')
                .setStyle(ButtonStyle.Primary)
        );

    await interaction.update({ embeds: [embed], components: [row], flags: 64 });
}

async function showLogsConfig(interaction) {
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('📋 Configuration du Canal de Logs')
        .setDescription('Sélectionnez le canal où les logs des confessions seront envoyés')
        .addFields(
            { name: 'Canal actuel', value: config.logChannelId ? `<#${config.logChannelId}>` : 'Aucun canal configuré', inline: false }
        );

    const row1 = new ActionRowBuilder()
        .addComponents(
            new ChannelSelectMenuBuilder()
                .setCustomId('config_log_channel')
                .setChannelTypes([0])
                .setPlaceholder('📋 Sélectionner un canal pour les logs...')
        );

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('config_back_main')
                .setLabel('← Retour')
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.update({ embeds: [embed], components: [row1, row2], flags: 64 });
}

async function setLogChannel(interaction) {
    const channelId = interaction.values[0];
    const channel = interaction.guild.channels.cache.get(channelId);

    if (!channel) {
        return await interaction.update({
            content: `❌ Le canal sélectionné n'existe plus.`,
            embeds: [],
            components: [],
            flags: 64
        });
    }

    config.logChannelId = channel.id;
    fs.writeFileSync('./config.json', JSON.stringify(config, null, 4));

    const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('✅ Canal de Logs Configuré')
        .setDescription(`Le canal ${channel} a été configuré comme canal de logs.`)
        .addFields(
            { name: 'Canal de logs', value: `${channel}`, inline: true }
        );

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('config_back_main')
                .setLabel('← Retour au Menu Principal')
                .setStyle(ButtonStyle.Primary)
        );

    await interaction.update({ embeds: [embed], components: [row], flags: 64 });
}

async function showAutoThreadConfig(interaction) {
    const autoThreadConfig = config.autoThreadSettings || {
        enabled: false,
        channels: [],
        threadName: "Discussion - Confession #{count}",
        archiveAfter: 60,
        slowMode: 0
    };

    const embed = new EmbedBuilder()
        .setColor('#9b59b6')
        .setTitle('🧵 Configuration Auto-Thread')
        .setDescription('Gérer la création automatique de threads pour les confessions')
        .addFields(
            { name: 'Statut', value: autoThreadConfig.enabled ? '✅ Activé' : '❌ Désactivé', inline: true },
            { name: 'Canaux configurés', value: autoThreadConfig.channels.length.toString(), inline: true },
            { name: 'Nom du thread', value: autoThreadConfig.threadName, inline: false },
            { name: 'Archive après', value: `${autoThreadConfig.archiveAfter} minutes`, inline: true },
            { name: 'Mode lent', value: `${autoThreadConfig.slowMode} secondes`, inline: true }
        );

    const row1 = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('config_autothread_action')
                .setPlaceholder('🧵 Sélectionner une action...')
                .addOptions([
                    { label: 'Ajouter un Canal', description: 'Activer l\'auto-thread pour un canal', value: 'add', emoji: '➕' },
                    { label: 'Retirer un Canal', description: 'Désactiver l\'auto-thread pour un canal', value: 'remove', emoji: '➖' },
                    { label: 'Paramètres Avancés', description: 'Configurer la durée d\'archivage et autres options', value: 'settings', emoji: '⚙️' }
                ])
        );

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('config_back_main')
                .setLabel('← Retour')
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.update({ embeds: [embed], components: [row1, row2], flags: 64 });
}

async function showAutoThreadAdd(interaction) {
    const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('➕ Ajouter Canal Auto-Thread')
        .setDescription('Sélectionnez le canal où activer l\'auto-thread pour les confessions');

    const row1 = new ActionRowBuilder()
        .addComponents(
            new ChannelSelectMenuBuilder()
                .setCustomId('config_autothread_add')
                .setChannelTypes([0])
                .setPlaceholder('🧵 Sélectionner un canal...')
        );

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('config_back_autothread')
                .setLabel('← Retour')
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.update({ embeds: [embed], components: [row1, row2], flags: 64 });
}

async function showAutoThreadRemove(interaction) {
    const autoThreadConfig = config.autoThreadSettings || { channels: [] };
    if (autoThreadConfig.channels.length === 0) {
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('❌ Aucun Canal Configuré')
            .setDescription('Aucun canal n\'a l\'auto-thread activé.');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('config_back_autothread')
                    .setLabel('← Retour')
                    .setStyle(ButtonStyle.Secondary)
            );

        return await interaction.update({ embeds: [embed], components: [row], flags: 64 });
    }

    const options = [];
    for (const channelId of autoThreadConfig.channels) {
        const channel = interaction.guild.channels.cache.get(channelId);
        if (channel) {
            options.push({
                label: channel.name,
                value: channelId,
                description: `Désactiver l'auto-thread pour #${channel.name}`
            });
        }
    }

    const embed = new EmbedBuilder()
        .setColor('#ff6b6b')
        .setTitle('➖ Retirer Canal Auto-Thread')
        .setDescription('Sélectionnez le canal où désactiver l\'auto-thread');

    const row1 = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('config_autothread_remove')
                .setPlaceholder('🧵 Sélectionner un canal à retirer...')
                .addOptions(options)
        );

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('config_back_autothread')
                .setLabel('← Retour')
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.update({ embeds: [embed], components: [row1, row2], flags: 64 });
}

async function addAutoThreadChannel(interaction) {
    const channelId = interaction.values[0];
    const channel = interaction.guild.channels.cache.get(channelId);

    if (!channel) {
        return await interaction.update({
            content: `❌ Le canal sélectionné n'existe plus.`,
            embeds: [],
            components: [],
            flags: 64
        });
    }

    if (!config.autoThreadSettings) {
        config.autoThreadSettings = {
            enabled: true,
            channels: [],
            threadName: "Discussion - Confession #{count}",
            archiveAfter: 60,
            slowMode: 0
        };
    }

    if (!config.autoThreadSettings.channels.includes(channel.id)) {
        config.autoThreadSettings.channels.push(channel.id);
        config.autoThreadSettings.enabled = true;
        fs.writeFileSync('./config.json', JSON.stringify(config, null, 4));
    }

    const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('✅ Canal Auto-Thread Ajouté')
        .setDescription(`L'auto-thread a été activé pour ${channel}`)
        .addFields(
            { name: 'Canal', value: `${channel}`, inline: true },
            { name: 'Total canaux', value: config.autoThreadSettings.channels.length.toString(), inline: true }
        );

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('config_back_autothread')
                .setLabel('← Retour à Auto-Thread')
                .setStyle(ButtonStyle.Primary)
        );

    await interaction.update({ embeds: [embed], components: [row], flags: 64 });
}

async function removeAutoThreadChannel(interaction) {
    const channelId = interaction.values[0];
    const channel = interaction.guild.channels.cache.get(channelId);

    if (config.autoThreadSettings && config.autoThreadSettings.channels) {
        const index = config.autoThreadSettings.channels.indexOf(channelId);
        if (index > -1) {
            config.autoThreadSettings.channels.splice(index, 1);
            if (config.autoThreadSettings.channels.length === 0) {
                config.autoThreadSettings.enabled = false;
            }
            fs.writeFileSync('./config.json', JSON.stringify(config, null, 4));
        }
    }

    const embed = new EmbedBuilder()
        .setColor('#ff6b6b')
        .setTitle('✅ Canal Auto-Thread Retiré')
        .setDescription(`L'auto-thread a été désactivé pour ${channel ? channel : 'le canal sélectionné'}`)
        .addFields(
            { name: 'Canal', value: channel ? `${channel}` : channelId, inline: true },
            { name: 'Total canaux', value: (config.autoThreadSettings?.channels?.length || 0).toString(), inline: true }
        );

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('config_back_autothread')
                .setLabel('← Retour à Auto-Thread')
                .setStyle(ButtonStyle.Primary)
        );

    await interaction.update({ embeds: [embed], components: [row], flags: 64 });
}

async function showAutoThreadSettings(interaction) {
    const autoThreadConfig = config.autoThreadSettings || {
        enabled: false,
        channels: [],
        threadName: "Discussion - Confession #{count}",
        archiveAfter: 60,
        slowMode: 0
    };

    const embed = new EmbedBuilder()
        .setColor('#f39c12')
        .setTitle('⚙️ Paramètres Auto-Thread')
        .setDescription('Configurer les paramètres avancés des threads automatiques')
        .addFields(
            { name: 'Nom du thread', value: `\`${autoThreadConfig.threadName}\``, inline: false },
            { name: 'Archive après', value: `${autoThreadConfig.archiveAfter} minutes`, inline: true },
            { name: 'Mode lent', value: `${autoThreadConfig.slowMode} secondes`, inline: true },
            { name: 'Canaux actifs', value: autoThreadConfig.channels.length.toString(), inline: true },
            { name: 'Options disponibles', value: '**60** = 1 heure\n**1440** = 24 heures\n**4320** = 3 jours\n**10080** = 7 jours', inline: false }
        );

    const row1 = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('config_autothread_settings')
                .setPlaceholder('⚙️ Choisir une durée d\'archivage...')
                .addOptions([
                    { label: '1 heure', description: 'Archives automatiquement après 1 heure', value: '60', emoji: '⏰' },
                    { label: '24 heures', description: 'Archives automatiquement après 24 heures', value: '1440', emoji: '📅' },
                    { label: '3 jours', description: 'Archives automatiquement après 3 jours', value: '4320', emoji: '📋' },
                    { label: '1 semaine', description: 'Archives automatiquement après 1 semaine', value: '10080', emoji: '📄' }
                ])
        );

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('config_back_autothread')
                .setLabel('← Retour')
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.update({ embeds: [embed], components: [row1, row2], flags: 64 });
}

async function updateAutoThreadSettings(interaction) {
    const newArchiveTime = parseInt(interaction.values[0]);
    if (!config.autoThreadSettings) {
        config.autoThreadSettings = {
            enabled: true,
            channels: [],
            threadName: "Discussion - Confession #{count}",
            archiveAfter: 60,
            slowMode: 0
        };
    }
    config.autoThreadSettings.archiveAfter = newArchiveTime;
    fs.writeFileSync('./config.json', JSON.stringify(config, null, 4));

    let timeText;
    switch(newArchiveTime) {
        case 60: timeText = '1 heure'; break;
        case 1440: timeText = '24 heures'; break;
        case 4320: timeText = '3 jours'; break;
        case 10080: timeText = '1 semaine'; break;
        default: timeText = `${newArchiveTime} minutes`;
    }

    const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('✅ Paramètres Auto-Thread Mis à Jour')
        .setDescription(`La durée d'archivage a été configurée à **${timeText}**`)
        .addFields(
            { name: 'Nouvelle durée', value: `${newArchiveTime} minutes`, inline: true },
            { name: 'Canaux affectés', value: config.autoThreadSettings.channels.length.toString(), inline: true }
        );

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('config_back_autothread')
                .setLabel('← Retour à Auto-Thread')
                .setStyle(ButtonStyle.Primary)
        );

    await interaction.update({ embeds: [embed], components: [row], flags: 64 });
}