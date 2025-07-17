const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Système de gestion des rôles staff
const staffCommand = require('./staff');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('compter')
        .setDescription('Configuration du système de comptage avec mathématiques')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        try {
            // Vérifier les permissions avec le système de rôles staff
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                const hasStaffPermission = staffCommand.hasStaffPermission(interaction.member, interaction.guild.id);
                if (!hasStaffPermission) {
                    await interaction.reply({
                        content: '❌ Vous n\'avez pas les permissions nécessaires pour utiliser cette commande.',
                        flags: 64
                    });
                    return;
                }
            }

            // Vérifier que c'est un canal textuel
            if (interaction.channel.type !== 0) {
                await interaction.reply({
                    content: '❌ Cette commande ne peut être utilisée que dans un canal textuel.',
                    flags: 64
                });
                return;
            }

            const guildId = interaction.guild.id;
            const channelId = interaction.channel.id;
            const config = this.getCountingConfig(guildId);
            
            // Vérifier si le canal est déjà configuré
            const existingChannel = config.channels.find(c => c.channelId === channelId);
            
            if (existingChannel) {
                await this.showChannelStatus(interaction, existingChannel);
            } else {
                await this.showActivationPrompt(interaction);
            }
        } catch (error) {
            console.error('Erreur commande compter:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Une erreur est survenue lors de l\'exécution de la commande.',
                    flags: 64
                });
            }
        }
    },

    async activateChannel(interaction) {
        try {
            const guildId = interaction.guild.id;
            const channelId = interaction.channel.id;
            
            // Ajouter le canal à la configuration
            const config = this.getCountingConfig(guildId);
            config.channels.push({
                channelId: channelId,
                nextNumber: 1,
                lastUserId: null,
                isActive: true,
                mathMode: false,
                createdAt: new Date().toISOString()
            });
            
            this.saveCountingConfig(guildId, config);
            
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Canal Activé')
                .setDescription(`Le système de comptage est maintenant actif dans <#${channelId}>\n\n**Règles :**\n• Comptez dans l'ordre (1, 2, 3...)\n• Une personne ne peut pas compter deux fois de suite\n• En cas d'erreur, le comptage repart à 1`)
                .addFields([
                    {
                        name: '🎯 Prochain Nombre',
                        value: '1',
                        inline: true
                    },
                    {
                        name: '🎮 Mode Mathématiques',
                        value: 'Désactivé',
                        inline: true
                    }
                ]);

            await interaction.update({
                embeds: [embed],
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('counting_config')
                                .setLabel('⚙️ Configuration')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId('counting_deactivate')
                                .setLabel('❌ Désactiver')
                                .setStyle(ButtonStyle.Danger)
                        )
                ]
            });
        } catch (error) {
            console.error('Erreur activateChannel:', error);
        }
    },

    async deactivateChannel(interaction) {
        try {
            const guildId = interaction.guild.id;
            const channelId = interaction.channel.id;
            
            // Retirer le canal de la configuration
            const config = this.getCountingConfig(guildId);
            config.channels = config.channels.filter(c => c.channelId !== channelId);
            this.saveCountingConfig(guildId, config);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Canal Désactivé')
                .setDescription(`Le système de comptage a été désactivé dans ce canal.\n\nUtilisez le bouton ci-dessous pour le réactiver si nécessaire.`);

            await interaction.update({
                embeds: [embed],
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('counting_activate')
                                .setLabel('✅ Activer le Comptage')
                                .setStyle(ButtonStyle.Success)
                        )
                ]
            });
        } catch (error) {
            console.error('Erreur deactivateChannel:', error);
        }
    },

    async showActivationPrompt(interaction) {
        try {
            const embed = new EmbedBuilder()
                .setColor('#ffaa00')
                .setTitle('📊 Configuration Système de Comptage')
                .setDescription(`Ce canal n'est pas encore configuré pour le comptage.\n\n**Le système de comptage permet :**\n• Compter ensemble de 1 à l'infini\n• Mode mathématiques avec calculs\n• Statistiques et records\n• Anti-triche automatique`)
                .addFields([
                    {
                        name: '📋 Règles du Comptage',
                        value: '• Une personne = un nombre à la fois\n• Comptage séquentiel obligatoire\n• Erreur = redémarrage à 1',
                        inline: false
                    }
                ]);

            const components = [
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('counting_activate')
                            .setLabel('✅ Activer le Comptage')
                            .setStyle(ButtonStyle.Success)
                            .setEmoji('📊')
                    )
            ];

            await interaction.reply({
                embeds: [embed],
                components: components,
                flags: 64
            });
        } catch (error) {
            console.error('Erreur showActivationPrompt:', error);
        }
    },

    getCountingConfig(guildId) {
        try {
            const configPath = path.join('./data', 'counting.json');
            if (!fs.existsSync(configPath)) {
                return { channels: [] };
            }
            const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            return data[guildId] || { channels: [] };
        } catch (error) {
            console.error('Erreur getCountingConfig:', error);
            return { channels: [] };
        }
    },

    saveCountingConfig(guildId, config) {
        try {
            const configPath = path.join('./data', 'counting.json');
            let data = {};
            if (fs.existsSync(configPath)) {
                data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            }
            data[guildId] = config;
            fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Erreur saveCountingConfig:', error);
        }
    },

    async handleButtonInteraction(interaction) {
        try {
            if (interaction.customId === 'counting_config') {
                await this.showMainConfig(interaction);
            } else if (interaction.customId === 'counting_add_channel') {
                await this.showChannelAdd(interaction, '', 0);
            } else if (interaction.customId.startsWith('counting_add_page_')) {
                const page = parseInt(interaction.customId.split('_').pop());
                await this.showChannelAdd(interaction, '', page);
            } else if (interaction.customId.startsWith('counting_filtered_page_')) {
                const parts = interaction.customId.split('_');
                const page = parseInt(parts[3]);
                const searchFilter = parts.slice(4).join('_');
                await this.showChannelAdd(interaction, searchFilter, page);
            } else if (interaction.customId === 'counting_remove_channel') {
                await this.showChannelRemove(interaction);
            } else if (interaction.customId === 'counting_settings') {
                await this.showCountingSettings(interaction);
            } else if (interaction.customId === 'counting_activate') {
                await this.activateChannel(interaction);
            } else if (interaction.customId === 'counting_deactivate') {
                await this.deactivateChannel(interaction);
            } else if (interaction.customId === 'counting_toggle_math') {
                await this.toggleMathMode(interaction);
            } else if (interaction.customId === 'counting_toggle_reactions') {
                await this.toggleReactions(interaction);
            } else if (interaction.customId === 'counting_reset_channel') {
                await this.showResetSelector(interaction);
            } else if (interaction.customId === 'counting_back_main') {
                await this.showMainConfig(interaction);
            } else if (interaction.customId === 'counting_manual_add') {
                await this.showManualAddModal(interaction);
            } else if (interaction.customId === 'counting_filter_channels') {
                await this.showFilterModal(interaction);
            } else if (interaction.customId === 'counting_clear_filter') {
                await this.showChannelAdd(interaction, '', 0);
            } else if (interaction.customId === 'counting_activate_channel') {
                await this.activateCurrentChannel(interaction);
            } else if (interaction.customId === 'counting_cancel') {
                await interaction.update({
                    content: '❌ Activation annulée.',
                    embeds: [],
                    components: []
                });
            } else if (interaction.customId === 'counting_toggle_math_current') {
                await this.toggleMathForCurrentChannel(interaction);
            } else if (interaction.customId === 'counting_reset_current') {
                await this.resetCurrentChannel(interaction);
            } else if (interaction.customId === 'counting_disable_current') {
                await this.disableCurrentChannel(interaction);
            }
        } catch (error) {
            console.error('Erreur handleButtonInteraction compter:', error);
        }
    },

    async handleSelectMenuInteraction(interaction) {
        try {
            if (interaction.customId.startsWith('counting_channel_add_')) {
                const channelId = interaction.values[0];
                await this.addCountingChannel(interaction, channelId);
            } else if (interaction.customId === 'counting_channel_remove') {
                const channelId = interaction.values[0];
                await this.removeCountingChannel(interaction, channelId);
            } else if (interaction.customId === 'counting_channel_reset') {
                const channelId = interaction.values[0];
                await this.resetCountingChannel(interaction, channelId);
            }
        } catch (error) {
            console.error('Erreur handleSelectMenuInteraction compter:', error);
        }
    },

    async showMainConfig(interaction) {
        try {
            const guildId = interaction.guild.id;
            const config = this.getCountingConfig(guildId);
            
            const embed = new EmbedBuilder()
                .setTitle('⚙️ Configuration Système de Comptage')
                .setDescription('Gérez les canaux de comptage avec support mathématique')
                .setColor('#00ff00')
                .addFields(
                    {
                        name: '📊 Canaux configurés',
                        value: this.formatCountingChannels(interaction.guild, config),
                        inline: false
                    },
                    {
                        name: '🧮 Mode Mathématique',
                        value: config.mathEnabled ? '✅ Activé' : '❌ Désactivé',
                        inline: true
                    },
                    {
                        name: '😀 Réactions automatiques',
                        value: config.reactionsEnabled ? '✅ Activées' : '❌ Désactivées',
                        inline: true
                    }
                )
                .setFooter({ text: 'Système de comptage avec mathématiques' });

            const components = [
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('counting_add_channel')
                            .setLabel('Ajouter Canal')
                            .setStyle(ButtonStyle.Success)
                            .setEmoji('➕'),
                        new ButtonBuilder()
                            .setCustomId('counting_remove_channel')
                            .setLabel('Retirer Canal')
                            .setStyle(ButtonStyle.Danger)
                            .setEmoji('➖'),
                        new ButtonBuilder()
                            .setCustomId('counting_settings')
                            .setLabel('Paramètres')
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji('⚙️')
                    ),
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('counting_reset_channel')
                            .setLabel('Réinitialiser Canal')
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji('🔄')
                    )
            ];

            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ embeds: [embed], components });
            } else {
                await interaction.reply({ embeds: [embed], components, flags: 64 });
            }
        } catch (error) {
            console.error('Erreur showMainConfig compter:', error);
        }
    },

    async showChannelAdd(interaction, searchFilter = '', page = 0) {
        try {
            const guildId = interaction.guild.id;
            const config = this.getCountingConfig(guildId);
            
            // Récupérer tous les canaux textuels non configurés
            let allChannels = interaction.guild.channels.cache
                .filter(channel => 
                    channel.type === 0 && // Text channel
                    !config.channels.some(c => c.channelId === channel.id)
                );

            // Appliquer le filtre de recherche si fourni
            if (searchFilter) {
                allChannels = allChannels.filter(channel => 
                    channel.name.toLowerCase().includes(searchFilter.toLowerCase())
                );
            }

            if (allChannels.size === 0) {
                const message = searchFilter 
                    ? `❌ Aucun canal trouvé pour "${searchFilter}". Modifiez votre recherche ou ajoutez par ID.`
                    : '❌ Aucun canal disponible. Tous les canaux sont déjà configurés.';
                
                const embed = new EmbedBuilder()
                    .setTitle('➕ Ajouter Canal de Comptage')
                    .setDescription(message)
                    .setColor('#ff0000');

                const components = [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('counting_filter_channels')
                            .setLabel('🔍 Filtrer par nom')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('counting_manual_add')
                            .setLabel('✏️ Ajouter par ID')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId('counting_back_main')
                            .setLabel('🔙 Retour')
                            .setStyle(ButtonStyle.Secondary)
                    )
                ];

                if (searchFilter) {
                    components[0].addComponents(
                        new ButtonBuilder()
                            .setCustomId('counting_clear_filter')
                            .setLabel('❌ Effacer filtre')
                            .setStyle(ButtonStyle.Danger)
                    );
                }

                if (interaction.replied || interaction.deferred) {
                    await interaction.editReply({ embeds: [embed], components });
                } else {
                    await interaction.reply({ embeds: [embed], components, flags: 64 });
                }
                return;
            }

            // Pagination des canaux (25 par page)
            const channelsArray = Array.from(allChannels.values());
            const totalPages = Math.ceil(channelsArray.length / 25);
            const startIndex = page * 25;
            const endIndex = Math.min(startIndex + 25, channelsArray.length);
            const currentPageChannels = channelsArray.slice(startIndex, endIndex);

            const searchInfo = searchFilter ? `\n🔍 **Filtre actif:** "${searchFilter}"` : '';
            const embed = new EmbedBuilder()
                .setTitle('➕ Ajouter Canal de Comptage')
                .setDescription(`Sélectionnez un canal à configurer pour le comptage${searchInfo}\n📊 Page ${page + 1}/${totalPages} - ${currentPageChannels.length} canaux sur ${channelsArray.length} disponibles`)
                .setColor('#00ff00');
            
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`counting_channel_add_${page}_${searchFilter}`)
                .setPlaceholder('🔢 Sélectionner un canal')
                .addOptions(
                    currentPageChannels.map(channel => ({
                        label: channel.name.length > 100 ? channel.name.substring(0, 97) + '...' : channel.name,
                        description: `#${channel.name} - Configurer pour le comptage`,
                        value: channel.id,
                        emoji: '🔢'
                    }))
                );

            const components = [new ActionRowBuilder().addComponents(selectMenu)];

            // Boutons de navigation si nécessaire
            if (totalPages > 1) {
                const navigationRow = new ActionRowBuilder();
                
                if (page > 0) {
                    navigationRow.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`counting_filtered_page_${page - 1}_${searchFilter}`)
                            .setLabel('◀️ Précédent')
                            .setStyle(ButtonStyle.Primary)
                    );
                }
                
                if (page < totalPages - 1) {
                    navigationRow.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`counting_filtered_page_${page + 1}_${searchFilter}`)
                            .setLabel('Suivant ▶️')
                            .setStyle(ButtonStyle.Primary)
                    );
                }

                if (navigationRow.components.length > 0) {
                    components.push(navigationRow);
                }
            }

            // Boutons d'action
            const actionRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('counting_filter_channels')
                    .setLabel('🔍 Filtrer par nom')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('counting_manual_add')
                    .setLabel('✏️ Ajouter par ID')
                    .setStyle(ButtonStyle.Success)
            );

            if (searchFilter) {
                actionRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId('counting_clear_filter')
                        .setLabel('❌ Effacer filtre')
                        .setStyle(ButtonStyle.Danger)
                );
            }

            actionRow.addComponents(
                new ButtonBuilder()
                    .setCustomId('counting_back_main')
                    .setLabel('🔙 Retour')
                    .setStyle(ButtonStyle.Secondary)
            );

            components.push(actionRow);

            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ embeds: [embed], components });
            } else {
                await interaction.reply({ embeds: [embed], components, flags: 64 });
            }
        } catch (error) {
            console.error('Erreur showChannelAdd compter:', error);
        }
    },

    async showChannelRemove(interaction) {
        try {
            const guildId = interaction.guild.id;
            const config = this.getCountingConfig(guildId);
            
            if (config.channels.length === 0) {
                await interaction.reply({
                    content: '❌ Aucun canal de comptage configuré.',
                    flags: 64
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle('➖ Retirer Canal de Comptage')
                .setDescription('Sélectionnez un canal à retirer de la configuration')
                .setColor('#ff0000');

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('counting_channel_remove')
                .setPlaceholder('🗑️ Sélectionner un canal à retirer')
                .addOptions(
                    config.channels.slice(0, 25).map(channelConfig => {
                        const channel = interaction.guild.channels.cache.get(channelConfig.channelId);
                        const channelName = channel ? channel.name : `Canal ${channelConfig.channelId.slice(-4)}`;
                        return {
                            label: channelName.length > 100 ? channelName.substring(0, 97) + '...' : channelName,
                            description: `Nombre actuel: ${channelConfig.currentNumber}`,
                            value: channelConfig.channelId,
                            emoji: '🗑️'
                        };
                    })
                );

            const components = [
                new ActionRowBuilder().addComponents(selectMenu)
            ];

            await interaction.reply({ embeds: [embed], components, flags: 64 });
        } catch (error) {
            console.error('Erreur showChannelRemove compter:', error);
        }
    },

    async showCountingSettings(interaction) {
        try {
            const guildId = interaction.guild.id;
            const config = this.getCountingConfig(guildId);
            
            const embed = new EmbedBuilder()
                .setTitle('⚙️ Paramètres du Comptage')
                .setDescription('Configurez les options du système de comptage')
                .setColor('#0099ff')
                .addFields(
                    {
                        name: '🧮 Mode Mathématique',
                        value: config.mathEnabled ? 
                            '✅ **Activé** - Supporte +, -, ×, ÷, ^, √, %, (, )' : 
                            '❌ **Désactivé** - Comptage simple uniquement',
                        inline: false
                    },
                    {
                        name: '😀 Réactions Automatiques',
                        value: config.reactionsEnabled ? 
                            '✅ **Activées** - Réactions ✅/❌ automatiques' : 
                            '❌ **Désactivées** - Pas de réactions',
                        inline: false
                    },
                    {
                        name: '📐 Opérateurs Supportés',
                        value: '`+` Addition • `-` Soustraction • `×` ou `*` Multiplication\n`÷` ou `/` Division • `^` Puissance • `√` Racine\n`%` Modulo • `()` Parenthèses',
                        inline: false
                    }
                );

            const components = [
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('counting_toggle_math')
                            .setLabel(config.mathEnabled ? 'Désactiver Math' : 'Activer Math')
                            .setStyle(config.mathEnabled ? ButtonStyle.Danger : ButtonStyle.Success)
                            .setEmoji('🧮'),
                        new ButtonBuilder()
                            .setCustomId('counting_toggle_reactions')
                            .setLabel(config.reactionsEnabled ? 'Désactiver Réactions' : 'Activer Réactions')
                            .setStyle(config.reactionsEnabled ? ButtonStyle.Danger : ButtonStyle.Success)
                            .setEmoji('😀'),
                        new ButtonBuilder()
                            .setCustomId('counting_config')
                            .setLabel('Retour')
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji('◀️')
                    )
            ];

            await interaction.reply({ embeds: [embed], components, flags: 64 });
        } catch (error) {
            console.error('Erreur showCountingSettings compter:', error);
        }
    },

    async addCountingChannel(interaction, channelId) {
        try {
            const guildId = interaction.guild.id;
            const config = this.getCountingConfig(guildId);
            const channel = interaction.guild.channels.cache.get(channelId);
            
            if (!channel) {
                await interaction.reply({
                    content: '❌ Canal introuvable.',
                    flags: 64
                });
                return;
            }

            // Vérifier si le canal est déjà configuré
            if (config.channels.some(c => c.channelId === channelId)) {
                await interaction.reply({
                    content: '❌ Ce canal est déjà configuré pour le comptage.',
                    flags: 64
                });
                return;
            }

            // Ajouter le canal
            config.channels.push({
                channelId: channelId,
                currentNumber: 0,
                lastUserId: null,
                lastMessageId: null
            });

            this.saveCountingConfig(guildId, config);

            await interaction.reply({
                content: `✅ Canal **${channel.name}** configuré pour le comptage !`,
                flags: 64
            });

            // Actualiser la configuration après un court délai
            setTimeout(async () => {
                try {
                    await this.showMainConfig(interaction);
                } catch (error) {
                    console.error('Erreur actualisation config addChannel:', error);
                }
            }, 1000);
        } catch (error) {
            console.error('Erreur addCountingChannel:', error);
        }
    },

    async removeCountingChannel(interaction, channelId) {
        try {
            const guildId = interaction.guild.id;
            const config = this.getCountingConfig(guildId);
            const channel = interaction.guild.channels.cache.get(channelId);
            
            const channelIndex = config.channels.findIndex(c => c.channelId === channelId);
            if (channelIndex === -1) {
                await interaction.reply({
                    content: '❌ Ce canal n\'est pas configuré pour le comptage.',
                    flags: 64
                });
                return;
            }

            config.channels.splice(channelIndex, 1);
            this.saveCountingConfig(guildId, config);

            const channelName = channel ? channel.name : `Canal ${channelId.slice(-4)}`;
            await interaction.reply({
                content: `✅ Canal **${channelName}** retiré du comptage !`,
                flags: 64
            });

            // Actualiser la configuration après un court délai
            setTimeout(async () => {
                try {
                    await this.showMainConfig(interaction);
                } catch (error) {
                    console.error('Erreur actualisation config removeChannel:', error);
                }
            }, 1000);
        } catch (error) {
            console.error('Erreur removeCountingChannel:', error);
        }
    },

    async toggleMathMode(interaction) {
        try {
            const guildId = interaction.guild.id;
            const config = this.getCountingConfig(guildId);
            
            config.mathEnabled = !config.mathEnabled;
            this.saveCountingConfig(guildId, config);

            await interaction.reply({
                content: `✅ Mode mathématique ${config.mathEnabled ? 'activé' : 'désactivé'} !`,
                flags: 64
            });

            // Actualiser la configuration après un court délai
            setTimeout(async () => {
                try {
                    await this.showCountingSettings(interaction);
                } catch (error) {
                    console.error('Erreur actualisation toggleMath:', error);
                }
            }, 1000);
        } catch (error) {
            console.error('Erreur toggleMathMode:', error);
        }
    },

    async toggleReactions(interaction) {
        try {
            const guildId = interaction.guild.id;
            const config = this.getCountingConfig(guildId);
            
            config.reactionsEnabled = !config.reactionsEnabled;
            this.saveCountingConfig(guildId, config);

            await interaction.reply({
                content: `✅ Réactions automatiques ${config.reactionsEnabled ? 'activées' : 'désactivées'} !`,
                flags: 64
            });

            // Actualiser la configuration après un court délai
            setTimeout(async () => {
                try {
                    await this.showCountingSettings(interaction);
                } catch (error) {
                    console.error('Erreur actualisation toggleReactions:', error);
                }
            }, 1000);
        } catch (error) {
            console.error('Erreur toggleReactions:', error);
        }
    },

    async showResetSelector(interaction) {
        try {
            const guildId = interaction.guild.id;
            const config = this.getCountingConfig(guildId);
            
            if (config.channels.length === 0) {
                await interaction.reply({
                    content: '❌ Aucun canal de comptage configuré.',
                    flags: 64
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle('🔄 Réinitialiser Canal de Comptage')
                .setDescription('⚠️ **Attention:** Cette action remettra le compteur à 0')
                .setColor('#ff9900');

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('counting_channel_reset')
                .setPlaceholder('🔄 Sélectionner un canal à réinitialiser')
                .addOptions(
                    config.channels.slice(0, 25).map(channelConfig => {
                        const channel = interaction.guild.channels.cache.get(channelConfig.channelId);
                        const channelName = channel ? channel.name : `Canal ${channelConfig.channelId.slice(-4)}`;
                        return {
                            label: channelName.length > 100 ? channelName.substring(0, 97) + '...' : channelName,
                            description: `Remettre à 0 (actuellement: ${channelConfig.currentNumber})`,
                            value: channelConfig.channelId,
                            emoji: '🔄'
                        };
                    })
                );

            const components = [
                new ActionRowBuilder().addComponents(selectMenu)
            ];

            await interaction.reply({ embeds: [embed], components, flags: 64 });
        } catch (error) {
            console.error('Erreur showResetSelector:', error);
        }
    },

    async resetCountingChannel(interaction, channelId) {
        try {
            const guildId = interaction.guild.id;
            const config = this.getCountingConfig(guildId);
            const channel = interaction.guild.channels.cache.get(channelId);
            
            const channelConfig = config.channels.find(c => c.channelId === channelId);
            if (!channelConfig) {
                await interaction.reply({
                    content: '❌ Canal de comptage introuvable.',
                    flags: 64
                });
                return;
            }

            const oldNumber = channelConfig.currentNumber;
            channelConfig.currentNumber = 0;
            channelConfig.lastUserId = null;
            channelConfig.lastMessageId = null;

            this.saveCountingConfig(guildId, config);

            const channelName = channel ? channel.name : `Canal ${channelId.slice(-4)}`;
            await interaction.reply({
                content: `✅ Canal **${channelName}** réinitialisé ! (${oldNumber} → 0)`,
                flags: 64
            });

            // Actualiser la configuration après un court délai
            setTimeout(async () => {
                try {
                    await this.showMainConfig(interaction);
                } catch (error) {
                    console.error('Erreur actualisation config resetChannel:', error);
                }
            }, 1000);
        } catch (error) {
            console.error('Erreur resetCountingChannel:', error);
        }
    },

    async showManualAddModal(interaction) {
        const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
        
        const modal = new ModalBuilder()
            .setCustomId('counting_manual_add_modal')
            .setTitle('Ajouter Canal par ID');

        const channelIdInput = new TextInputBuilder()
            .setCustomId('channel_id_input')
            .setLabel('ID du Canal')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Collez l\'ID du canal ici...')
            .setRequired(true)
            .setMaxLength(20);

        const row = new ActionRowBuilder().addComponents(channelIdInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
    },

    async handleModalSubmit(interaction) {
        try {
            if (interaction.customId === 'counting_manual_add_modal') {
                const channelId = interaction.fields.getTextInputValue('channel_id_input');
                
                // Vérifier que le canal existe
                const channel = interaction.guild.channels.cache.get(channelId);
                if (!channel) {
                    await interaction.reply({
                        content: '❌ Canal introuvable. Vérifiez l\'ID du canal.',
                        flags: 64
                    });
                    return;
                }

                if (channel.type !== 0) {
                    await interaction.reply({
                        content: '❌ Ce canal n\'est pas un canal textuel.',
                        flags: 64
                    });
                    return;
                }

                // Vérifier que le canal n'est pas déjà configuré
                const guildId = interaction.guild.id;
                const config = this.getCountingConfig(guildId);
                if (config.channels.some(c => c.channelId === channelId)) {
                    await interaction.reply({
                        content: '❌ Ce canal est déjà configuré pour le comptage.',
                        flags: 64
                    });
                    return;
                }

                await this.addCountingChannel(interaction, channelId);
            } else if (interaction.customId === 'counting_filter_modal') {
                const filterTerm = interaction.fields.getTextInputValue('filter_input');
                await this.showChannelAdd(interaction, filterTerm, 0);
            }
        } catch (error) {
            console.error('Erreur handleModalSubmit compter:', error);
        }
    },

    async showActivationPrompt(interaction) {
        try {
            const embed = new EmbedBuilder()
                .setTitle('🔢 Activer le Comptage')
                .setDescription(`Voulez-vous activer le système de comptage dans **#${interaction.channel.name}** ?\n\n📊 **Fonctionnalités:**\n• Comptage séquentiel (1, 2, 3...)\n• Support des opérations mathématiques\n• Réactions automatiques\n• Prévention des erreurs\n• Messages spéciaux sur les nombres ronds`)
                .setColor('#00ff00');

            const components = [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('counting_activate_channel')
                        .setLabel('✅ Activer le Comptage')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('counting_cancel')
                        .setLabel('❌ Annuler')
                        .setStyle(ButtonStyle.Secondary)
                )
            ];

            await interaction.reply({ embeds: [embed], components, flags: 64 });
        } catch (error) {
            console.error('Erreur showActivationPrompt:', error);
        }
    },

    async showChannelStatus(interaction, channelConfig) {
        try {
            const embed = new EmbedBuilder()
                .setTitle('🔢 Statut du Comptage')
                .setDescription(`Le comptage est **activé** dans **#${interaction.channel.name}**`)
                .addFields(
                    { name: '📊 Nombre Actuel', value: channelConfig.currentNumber.toString(), inline: true },
                    { name: '👤 Dernier Utilisateur', value: channelConfig.lastUserId ? `<@${channelConfig.lastUserId}>` : 'Aucun', inline: true },
                    { name: '🧮 Mode Mathématique', value: this.getCountingConfig(interaction.guild.id).mathEnabled ? '✅ Activé' : '❌ Désactivé', inline: true }
                )
                .setColor('#0099ff');

            const components = [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('counting_toggle_math_current')
                        .setLabel('🧮 Basculer Math')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('counting_reset_current')
                        .setLabel('🔄 Réinitialiser')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('counting_disable_current')
                        .setLabel('🗑️ Désactiver')
                        .setStyle(ButtonStyle.Danger)
                )
            ];

            await interaction.reply({ embeds: [embed], components, flags: 64 });
        } catch (error) {
            console.error('Erreur showChannelStatus:', error);
        }
    },

    async showFilterModal(interaction) {
        const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
        
        const modal = new ModalBuilder()
            .setCustomId('counting_filter_modal')
            .setTitle('Filtrer les Canaux');

        const filterInput = new TextInputBuilder()
            .setCustomId('filter_input')
            .setLabel('Filtrer par nom de canal')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ex: general, comptage, discussion...')
            .setRequired(false)
            .setMaxLength(50);

        const row = new ActionRowBuilder().addComponents(filterInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
    },

    async activateCurrentChannel(interaction) {
        try {
            const guildId = interaction.guild.id;
            const channelId = interaction.channel.id;
            const config = this.getCountingConfig(guildId);

            // Ajouter le canal à la configuration
            config.channels.push({
                channelId: channelId,
                currentNumber: 0,
                lastUserId: null,
                lastMessageId: null
            });

            this.saveCountingConfig(guildId, config);

            await interaction.update({
                content: `✅ **Comptage activé** dans #${interaction.channel.name} !\n\n🎯 **Le comptage commence maintenant.** Tapez **1** pour commencer !`,
                embeds: [],
                components: []
            });

            // Envoyer un message public pour indiquer l'activation
            await interaction.followUp({
                content: `🔢 **Système de comptage activé !**\n\n📋 **Comment jouer :**\n• Comptez dans l'ordre : 1, 2, 3...\n• Pas deux fois d'affilée\n• Utilisez les maths : 2+3 pour 5\n\n🎯 **Commençons ! Tapez 1**`,
                flags: 0
            });
        } catch (error) {
            console.error('Erreur activateCurrentChannel:', error);
        }
    },

    async toggleMathForCurrentChannel(interaction) {
        try {
            const guildId = interaction.guild.id;
            const config = this.getCountingConfig(guildId);
            
            config.mathEnabled = !config.mathEnabled;
            this.saveCountingConfig(guildId, config);

            await interaction.update({
                content: `✅ Mode mathématique ${config.mathEnabled ? '**activé**' : '**désactivé**'} pour ce serveur !`,
                embeds: [],
                components: []
            });
        } catch (error) {
            console.error('Erreur toggleMathForCurrentChannel:', error);
        }
    },

    async resetCurrentChannel(interaction) {
        try {
            const guildId = interaction.guild.id;
            const channelId = interaction.channel.id;
            const config = this.getCountingConfig(guildId);
            
            const channelConfig = config.channels.find(c => c.channelId === channelId);
            if (channelConfig) {
                const oldNumber = channelConfig.currentNumber;
                channelConfig.currentNumber = 0;
                channelConfig.lastUserId = null;
                channelConfig.lastMessageId = null;
                
                this.saveCountingConfig(guildId, config);

                await interaction.update({
                    content: `✅ **Comptage réinitialisé !** (${oldNumber} → 0)\n\n🎯 Le prochain nombre est **1**`,
                    embeds: [],
                    components: []
                });
            }
        } catch (error) {
            console.error('Erreur resetCurrentChannel:', error);
        }
    },

    async disableCurrentChannel(interaction) {
        try {
            const guildId = interaction.guild.id;
            const channelId = interaction.channel.id;
            const config = this.getCountingConfig(guildId);
            
            const channelIndex = config.channels.findIndex(c => c.channelId === channelId);
            if (channelIndex !== -1) {
                config.channels.splice(channelIndex, 1);
                this.saveCountingConfig(guildId, config);

                await interaction.update({
                    content: `✅ **Comptage désactivé** dans #${interaction.channel.name}`,
                    embeds: [],
                    components: []
                });
            }
        } catch (error) {
            console.error('Erreur disableCurrentChannel:', error);
        }
    },

    getCountingConfig(guildId) {
        const configPath = path.join(__dirname, '../data/counting.json');
        
        try {
            if (!fs.existsSync(path.dirname(configPath))) {
                fs.mkdirSync(path.dirname(configPath), { recursive: true });
            }

            if (!fs.existsSync(configPath)) {
                fs.writeFileSync(configPath, '{}');
            }

            const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            
            if (!data[guildId]) {
                data[guildId] = {
                    channels: [],
                    mathEnabled: true,
                    reactionsEnabled: true
                };
                fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
            }

            return data[guildId];
        } catch (error) {
            console.error('Erreur getCountingConfig:', error);
            return {
                channels: [],
                mathEnabled: true,
                reactionsEnabled: true
            };
        }
    },

    saveCountingConfig(guildId, config) {
        const configPath = path.join(__dirname, '../data/counting.json');
        
        try {
            const data = fs.existsSync(configPath) ? 
                JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
            
            data[guildId] = config;
            fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Erreur saveCountingConfig:', error);
        }
    },

    formatCountingChannels(guild, config) {
        if (config.channels.length === 0) {
            return 'Aucun canal configuré';
        }

        return config.channels.map(channelConfig => {
            const channel = guild.channels.cache.get(channelConfig.channelId);
            const channelName = channel ? channel.name : `Canal supprimé`;
            return `🔢 **${channelName}** - Nombre actuel: **${channelConfig.currentNumber}**`;
        }).join('\n');
    }
};