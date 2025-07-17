const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ChannelSelectMenuBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autothread')
        .setDescription('Configuration du système auto-thread global')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    
    async execute(interaction) {
        try {
            // Vérifier les permissions avec le système de rôles staff
            const staffCommand = interaction.client.commands.get('staff');
            if (!staffCommand || !staffCommand.hasStaffPermission(interaction.member, interaction.guild.id)) {
                return await interaction.reply({
                    content: '❌ Vous devez être administrateur ou avoir un rôle staff pour utiliser cette commande.',
                    flags: 64
                });
            }

            await showMainAutoThread(interaction);
        } catch (error) {
            console.error('Erreur autothread execute:', error);
            await interaction.reply({
                content: '❌ Erreur lors de l\'exécution de la commande.',
                flags: 64
            });
        }
    },
    
    async handleButtonInteraction(interaction) {
        try {
            const customId = interaction.customId;
            
            // Navigation principale
            if (customId === 'autothread_back_main') {
                await showMainAutoThread(interaction);
            }
            
            // Actions auto-thread
            else if (customId === 'autothread_action') {
                const value = interaction.values[0];
                
                if (value === 'add') {
                    await showAutoThreadAdd(interaction);
                } else if (value === 'remove') {
                    await showAutoThreadRemove(interaction);
                } else if (value === 'settings') {
                    await showAutoThreadSettings(interaction);
                }
            }
            
            // Ajout de canal
            else if (customId === 'autothread_add') {
                await addAutoThreadChannel(interaction);
            }
            
            // Suppression de canal
            else if (customId === 'autothread_remove') {
                await removeAutoThreadChannel(interaction);
            }
            
            // Paramètres
            else if (customId === 'autothread_settings') {
                await updateAutoThreadSettings(interaction);
            }

        } catch (error) {
            console.error('Erreur dans la gestion de l\'interaction autothread:', error);
            
            await interaction.reply({
                content: '❌ Une erreur s\'est produite lors du traitement de votre sélection.',
                flags: 64
            }).catch(() => {
                interaction.editReply({
                    content: '❌ Une erreur s\'est produite lors du traitement de votre sélection.'
                }).catch(console.error);
            });
        }
    }
};

async function showMainAutoThread(interaction) {
    const globalAutoThread = config.globalAutoThread || {
        enabled: false,
        channels: [],
        threadName: "Discussion - Message #{count}",
        archiveAfter: 60,
        slowMode: 0,
        excludeConfessions: true
    };

    const embed = new EmbedBuilder()
        .setColor('#9b59b6')
        .setTitle('🧵 Auto-Thread Global')
        .setDescription('Configuration du système auto-thread pour tous les messages (sauf confessions)')
        .addFields(
            { name: 'Statut', value: globalAutoThread.enabled ? '✅ Activé' : '❌ Désactivé', inline: true },
            { name: 'Canaux configurés', value: globalAutoThread.channels.length.toString(), inline: true },
            { name: 'Nom du thread', value: globalAutoThread.threadName, inline: false },
            { name: 'Archive après', value: `${globalAutoThread.archiveAfter} minutes`, inline: true },
            { name: 'Mode lent', value: `${globalAutoThread.slowMode} secondes`, inline: true },
            { name: 'Exclusions', value: globalAutoThread.excludeConfessions ? 'Confessions exclues' : 'Tous messages', inline: true }
        );

    const row1 = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('autothread_action')
                .setPlaceholder('🧵 Sélectionner une action...')
                .addOptions([
                    {
                        label: 'Ajouter un Canal',
                        description: 'Activer l\'auto-thread pour un canal',
                        value: 'add',
                        emoji: '➕'
                    },
                    {
                        label: 'Retirer un Canal',
                        description: 'Désactiver l\'auto-thread pour un canal',
                        value: 'remove',
                        emoji: '➖'
                    },
                    {
                        label: 'Paramètres Avancés',
                        description: 'Configurer la durée d\'archivage et autres options',
                        value: 'settings',
                        emoji: '⚙️'
                    }
                ])
        );

    const method = interaction.deferred || interaction.replied ? 'editReply' : 'reply';
    await interaction[method]({
        embeds: [embed],
        components: [row1],
        flags: method === 'reply' ? 64 : undefined
    });
}

async function showAutoThreadAdd(interaction) {
    const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('➕ Ajouter Canal Auto-Thread Global')
        .setDescription('Sélectionnez le canal où activer l\'auto-thread pour tous les messages');

    const row1 = new ActionRowBuilder()
        .addComponents(
            new ChannelSelectMenuBuilder()
                .setCustomId('autothread_add')
                .setChannelTypes([0])
                .setPlaceholder('🧵 Sélectionner un canal...')
        );

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('autothread_back_main')
                .setLabel('← Retour')
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.update({
        embeds: [embed],
        components: [row1, row2]
    });
}

async function showAutoThreadRemove(interaction) {
    const globalAutoThread = config.globalAutoThread || { channels: [] };
    
    if (globalAutoThread.channels.length === 0) {
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('❌ Aucun Canal Configuré')
            .setDescription('Aucun canal n\'a l\'auto-thread global activé.');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('autothread_back_main')
                    .setLabel('← Retour')
                    .setStyle(ButtonStyle.Secondary)
            );

        return await interaction.update({
            embeds: [embed],
            components: [row]
        });
    }

    const options = [];
    for (const channelId of globalAutoThread.channels) {
        const channel = interaction.guild.channels.cache.get(channelId);
        if (channel) {
            options.push({
                label: channel.name,
                value: channelId,
                description: `Désactiver l'auto-thread global pour #${channel.name}`
            });
        }
    }

    const embed = new EmbedBuilder()
        .setColor('#ff6b6b')
        .setTitle('➖ Retirer Canal Auto-Thread Global')
        .setDescription('Sélectionnez le canal où désactiver l\'auto-thread global');

    const row1 = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('autothread_remove')
                .setPlaceholder('🧵 Sélectionner un canal à retirer...')
                .addOptions(options)
        );

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('autothread_back_main')
                .setLabel('← Retour')
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.update({
        embeds: [embed],
        components: [row1, row2]
    });
}

async function addAutoThreadChannel(interaction) {
    const channel = interaction.channels.first();
    
    if (!config.globalAutoThread) {
        config.globalAutoThread = {
            enabled: true,
            channels: [],
            threadName: "Discussion - Message #{count}",
            archiveAfter: 60,
            slowMode: 0,
            excludeConfessions: true
        };
    }
    
    if (!config.globalAutoThread.channels.includes(channel.id)) {
        config.globalAutoThread.channels.push(channel.id);
        config.globalAutoThread.enabled = true;
        fs.writeFileSync('./config.json', JSON.stringify(config, null, 4));
    }

    const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('✅ Canal Auto-Thread Global Ajouté')
        .setDescription(`L'auto-thread global a été activé pour ${channel}`)
        .addFields(
            { name: 'Canal', value: `${channel}`, inline: true },
            { name: 'Total canaux', value: config.globalAutoThread.channels.length.toString(), inline: true }
        );

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('autothread_back_main')
                .setLabel('← Retour à Auto-Thread')
                .setStyle(ButtonStyle.Primary)
        );

    await interaction.update({
        embeds: [embed],
        components: [row]
    });
}

async function removeAutoThreadChannel(interaction) {
    const channelId = interaction.values[0];
    const channel = interaction.guild.channels.cache.get(channelId);
    
    if (config.globalAutoThread && config.globalAutoThread.channels) {
        const index = config.globalAutoThread.channels.indexOf(channelId);
        if (index > -1) {
            config.globalAutoThread.channels.splice(index, 1);
            
            if (config.globalAutoThread.channels.length === 0) {
                config.globalAutoThread.enabled = false;
            }
            
            fs.writeFileSync('./config.json', JSON.stringify(config, null, 4));
        }
    }

    const embed = new EmbedBuilder()
        .setColor('#ff6b6b')
        .setTitle('✅ Canal Auto-Thread Global Retiré')
        .setDescription(`L'auto-thread global a été désactivé pour ${channel ? channel : 'le canal sélectionné'}`)
        .addFields(
            { name: 'Canal', value: channel ? `${channel}` : channelId, inline: true },
            { name: 'Total canaux', value: (config.globalAutoThread?.channels?.length || 0).toString(), inline: true }
        );

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('autothread_back_main')
                .setLabel('← Retour à Auto-Thread')
                .setStyle(ButtonStyle.Primary)
        );

    await interaction.update({
        embeds: [embed],
        components: [row]
    });
}

async function showAutoThreadSettings(interaction) {
    const globalAutoThread = config.globalAutoThread || {
        enabled: false,
        channels: [],
        threadName: "Discussion - Message #{count}",
        archiveAfter: 60,
        slowMode: 0,
        excludeConfessions: true
    };

    const embed = new EmbedBuilder()
        .setColor('#f39c12')
        .setTitle('⚙️ Paramètres Auto-Thread Global')
        .setDescription('Configurer les paramètres avancés des threads automatiques globaux')
        .addFields(
            { name: 'Nom du thread', value: `\`${globalAutoThread.threadName}\``, inline: false },
            { name: 'Archive après', value: `${globalAutoThread.archiveAfter} minutes`, inline: true },
            { name: 'Mode lent', value: `${globalAutoThread.slowMode} secondes`, inline: true },
            { name: 'Canaux actifs', value: globalAutoThread.channels.length.toString(), inline: true },
            { name: 'Options disponibles', value: '**60** = 1 heure\n**1440** = 24 heures\n**4320** = 3 jours\n**10080** = 7 jours', inline: false }
        );

    const row1 = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('autothread_settings')
                .setPlaceholder('⚙️ Choisir une durée d\'archivage...')
                .addOptions([
                    {
                        label: '1 heure',
                        description: 'Archives automatiquement après 1 heure',
                        value: '60',
                        emoji: '⏰'
                    },
                    {
                        label: '24 heures',
                        description: 'Archives automatiquement après 24 heures',
                        value: '1440',
                        emoji: '📅'
                    },
                    {
                        label: '3 jours',
                        description: 'Archives automatiquement après 3 jours',
                        value: '4320',
                        emoji: '📋'
                    },
                    {
                        label: '1 semaine',
                        description: 'Archives automatiquement après 1 semaine',
                        value: '10080',
                        emoji: '📄'
                    }
                ])
        );

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('autothread_back_main')
                .setLabel('← Retour')
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.update({
        embeds: [embed],
        components: [row1, row2]
    });
}

async function updateAutoThreadSettings(interaction) {
    const newArchiveTime = parseInt(interaction.values[0]);
    
    if (!config.globalAutoThread) {
        config.globalAutoThread = {
            enabled: true,
            channels: [],
            threadName: "Discussion - Message #{count}",
            archiveAfter: 60,
            slowMode: 0,
            excludeConfessions: true
        };
    }
    
    config.globalAutoThread.archiveAfter = newArchiveTime;
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
        .setTitle('✅ Paramètres Auto-Thread Global Mis à Jour')
        .setDescription(`La durée d'archivage globale a été configurée à **${timeText}**`)
        .addFields(
            { name: 'Nouvelle durée', value: `${newArchiveTime} minutes`, inline: true },
            { name: 'Canaux affectés', value: config.globalAutoThread.channels.length.toString(), inline: true }
        );

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('autothread_back_main')
                .setLabel('← Retour à Auto-Thread')
                .setStyle(ButtonStyle.Primary)
        );

    await interaction.update({
        embeds: [embed],
        components: [row]
    });
}