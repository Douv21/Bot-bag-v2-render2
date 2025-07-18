module.exports.commandName = 'configeconomie';
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, RoleSelectMenuBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('configeconomie')
        .setDescription('⚙️ Configuration complète du système d\'économie')
        .addStringOption(option =>
            option.setName('section')
                .setDescription('Section à configurer')
                .setRequired(false)
                .addChoices(
                    { name: '💼 Actions Économiques', value: 'actions' },
                    { name: '🛒 Boutique', value: 'shop' },
                    { name: '📊 Sanctions/Récompenses Karma', value: 'karma' }
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        try {
            // Vérifier les permissions avec le système de rôles staff
            const staffCommand = interaction.client.commands.get('staff');
            if (!staffCommand || !staffCommand.hasStaffPermission(interaction.member, interaction.guild.id)) {
                return await interaction.reply({
                    content: '❌ Vous devez être administrateur ou avoir un rôle staff pour utiliser cette commande.',
                    ephemeral: true
                });
            }

            const section = interaction.options.getString('section');
            
            if (section === 'actions') {
                await this.showActionsConfig(interaction);
            } else if (section === 'shop') {
                await this.showShopConfig(interaction);
            } else if (section === 'karma') {
                await this.showKarmaConfig(interaction);
            } else {
                await this.showMainEconomyConfig(interaction);
            }
        } catch (error) {
            console.error('Erreur configeconomie execute:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Erreur lors de l\'exécution de la commande.',
                    ephemeral: true
                });
            }
        }
    },

    async handleInteraction(interaction) {
        try {
            if (interaction.isButton()) {
                await this.handleButtonInteraction(interaction);
            } else if (interaction.isStringSelectMenu()) {
                await this.handleSelectMenuInteraction(interaction);
            } else if (interaction.isModalSubmit()) {
                await this.handleModalSubmit(interaction);
            }
        } catch (error) {
            console.error('Erreur handleInteraction configeconomie:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Erreur lors du traitement de l\'interaction.',
                    ephemeral: true
                });
            }
        }
    },

    async handleSelectMenuInteraction(interaction) {
        try {
            const customId = interaction.customId;
            const value = interaction.values[0];
            
            console.log('Select menu interaction:', customId, 'value:', value);
            
            if (customId === 'economy_config_menu') {
                // Update interaction immédiatement avec defer pour les pages
                await interaction.deferUpdate();
                
                switch (value) {
                    case 'main':
                        await this.showMainEconomyConfig(interaction);
                        break;
                    case 'actions':
                        await this.showActionsConfig(interaction);
                        break;
                    case 'shop':
                        await this.showShopConfig(interaction);
                        break;
                    case 'karma':
                        await this.showKarmaConfig(interaction);
                        break;
                    case 'daily':
                        await this.showDailyConfig(interaction);
                        break;
                    case 'messages':
                        await this.showMessageRewardsConfig(interaction);
                        break;
                    default:
                        console.log('Valeur menu principal inconnue:', value);
                        break;
                }
            } else if (customId === 'economy_action_config') {
                await this.showActionDetails(interaction, value);
            } else if (customId === 'economy_action_settings') {
                await this.handleActionSetting(interaction, value);
            } else if (customId === 'economy_karma_config') {
                await this.showKarmaDetails(interaction, value);
            } else if (customId.startsWith('economy_karma_type_')) {
                const karmaType = customId.replace('economy_karma_type_', '');
                const rewardType = value;
                await this.showKarmaConfigModal(interaction, karmaType, rewardType);
            } else if (customId.startsWith('economy_karma_shop_')) {
                const karmaType = customId.replace('economy_karma_shop_', '');
                const itemId = value;
                await this.showKarmaShopModal(interaction, karmaType, itemId);
            } else if (customId === 'economy_shop_type_selector') {
                const itemType = value;
                if (itemType === 'item') {
                    await this.showShopItemModal(interaction);
                } else if (itemType === 'temp_role' || itemType === 'perm_role') {
                    await this.showShopRoleSelector(interaction, itemType);
                }
            } else if (customId === 'economy_shop_remove_selector') {
                const itemId = value;
                await this.removeShopItem(interaction, itemId);
            } else if (customId === 'economy_daily_config') {
                // Pour les modals et actions, répondre immédiatement
                switch (value) {
                    case 'amount':
                        await this.showDailyAmountModal(interaction);
                        break;
                    case 'toggle':
                        await this.toggleDaily(interaction);
                        break;
                }
            } else if (customId === 'economy_message_rewards_config') {
                // Pour les modals et actions, répondre immédiatement  
                switch (value) {
                    case 'toggle':
                        await this.toggleMessageRewards(interaction);
                        break;
                    case 'amount':
                        await this.showMessageAmountModal(interaction);
                        break;
                    case 'cooldown':
                        await this.showMessageCooldownModal(interaction);
                        break;
                }
            } else if (customId === 'economy_shop_actions') {
                const action = value;
                if (action === 'add') {
                    await this.showShopTypeSelector(interaction);
                } else if (action === 'list') {
                    await this.showShopList(interaction);
                } else if (action === 'remove') {
                    await this.showShopRemoveSelector(interaction);
                }
            } else if (customId.startsWith('karma_good_select_')) {
                const actionId = customId.replace('karma_good_select_', '');
                const karmaValue = parseInt(value);
                console.log('Sélection karma bon:', actionId, 'valeur:', karmaValue);
                await this.updateActionKarmaGood(interaction, actionId, karmaValue);
            } else if (customId.startsWith('karma_bad_select_')) {
                const actionId = customId.replace('karma_bad_select_', '');
                const karmaValue = parseInt(value);
                console.log('Sélection karma mauvais:', actionId, 'valeur:', karmaValue);
                await this.updateActionKarmaBad(interaction, actionId, karmaValue);
            }
        } catch (error) {
            console.error('Erreur handleSelectMenuInteraction:', error);
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: '❌ Erreur lors du traitement de la sélection.',
                        ephemeral: true
                    });
                } else if (interaction.deferred) {
                    await interaction.editReply({
                        content: '❌ Erreur lors du traitement de la sélection.'
                    });
                }
            } catch (replyError) {
                console.error('Erreur finale reply:', replyError);
            }
        }
    },

    async handleButtonInteraction(interaction) {
        try {
            const action = interaction.customId;

            switch (action) {
                case 'economy_config_actions':
                    await this.showActionsConfig(interaction);
                    break;
                case 'economy_config_shop':
                    await this.showShopConfig(interaction);
                    break;
                case 'economy_config_karma':
                    await this.showKarmaConfig(interaction);
                    break;
                case 'economy_config_messages':
                    await this.showMessageRewardsConfig(interaction);
                    break;
                case 'economy_config_back':
                    await this.showMainEconomyConfig(interaction);
                    break;

                case 'economy_daily_amount':
                    await this.showDailyAmountModal(interaction);
                    break;
                case 'economy_daily_toggle':
                    await this.toggleDaily(interaction);
                    break;
                default:
                    if (action.startsWith('economy_karma_add_')) {
                        const karmaType = action.replace('economy_karma_add_', '');
                        await this.showKarmaTypeSelector(interaction, karmaType);
                    } else {
                        console.log('Action bouton inconnue:', action);
                    }
                    break;
            }
        } catch (error) {
            console.error('Erreur handleButtonInteraction:', error, 'customId:', action);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Erreur lors du traitement du bouton: ' + error.message,
                    ephemeral: true
                });
            }
        }
    },

    async showMainEconomyConfig(interaction) {
        try {
            const embed = new EmbedBuilder()
                .setColor('#9932cc')
                .setTitle('⚙️ Configuration Économie')
                .setDescription('Configurez le système d\'économie complet avec karma\n\n**Utilisation :**\n• Utilisez les boutons ci-dessous\n• Ou `/configeconomie actions` pour accéder directement à une section')
                .addFields(
                    {
                        name: '💼 Actions Économiques',
                        value: 'Gérez les actions disponibles (travail, vol, etc.)',
                        inline: true
                    },
                    {
                        name: '🛒 Boutique',
                        value: 'Configurez les objets et récompenses à vendre',
                        inline: true
                    },
                    {
                        name: '📊 Sanctions/Récompenses Karma',
                        value: 'Configurez les systèmes automatiques basés sur le karma',
                        inline: true
                    },
                    {
                        name: '💬 Récompenses Messages',
                        value: 'Configurez les gains d\'argent automatiques pour les messages',
                        inline: true
                    }
                )
                .setFooter({ text: 'Sélectionnez une catégorie à configurer' });

            const row = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('economy_config_menu')
                        .setPlaceholder('📋 Sélectionnez une section à configurer')
                        .addOptions([
                            {
                                label: 'Actions Économiques',
                                description: 'Gérer les actions (travail, vol, etc.)',
                                value: 'actions',
                                emoji: '💼'
                            },
                            {
                                label: 'Boutique',
                                description: 'Configurer la boutique et les objets',
                                value: 'shop',
                                emoji: '🛒'
                            },
                            {
                                label: 'Système Karma',
                                description: 'Sanctions et récompenses automatiques',
                                value: 'karma',
                                emoji: '📊'
                            },
                            {
                                label: 'Configuration Daily',
                                description: 'Récompense quotidienne des utilisateurs',
                                value: 'daily',
                                emoji: '🎁'
                            },
                            {
                                label: 'Récompenses Messages',
                                description: 'Gains automatiques pour chaque message',
                                value: 'messages',
                                emoji: '💬'
                            }
                        ])
                );

            await this.respondToInteraction(interaction, {
                embeds: [embed],
                components: [row]
            });
        } catch (error) {
            console.error('Erreur showMainEconomyConfig:', error);
        }
    },

    async showActionsConfig(interaction) {
        try {
            const guildId = interaction.guild.id;
            const actionsPath = path.join('./data', 'actions.json');
            
            let actionsData = {};
            if (fs.existsSync(actionsPath)) {
                actionsData = JSON.parse(fs.readFileSync(actionsPath, 'utf8'));
            }

            // Filtrer les actions pour ce serveur
            const guildActions = Object.values(actionsData).filter(action => action.guildId === guildId);

            let actionsText = '';
            guildActions.forEach(action => {
                const typeEmoji = action.actionType === 'good' ? '😇' : '😈';
                const statusEmoji = action.enabled !== false ? '🟢' : '🔴';
                actionsText += `${statusEmoji} ${typeEmoji} **${action.name}** - ${action.baseReward}€ (${Math.floor(action.cooldown/60)}min)\n`;
            });

            const embed = new EmbedBuilder()
                .setColor('#9932cc')
                .setTitle('💼 Gestion des Actions Économiques')
                .setDescription('Actions économiques disponibles sur ce serveur :')
                .addFields({
                    name: 'Actions Configurées',
                    value: actionsText || 'Aucune action configurée',
                    inline: false
                })
                .setFooter({ text: 'Sélectionnez une action à configurer ou naviguez' });

            const components = [this.getNavigationMenu()];

            // Ajouter le sélecteur d'actions si des actions existent
            if (guildActions.length > 0) {
                const actionSelector = new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('economy_action_config')
                            .setPlaceholder('⚙️ Configurer une action spécifique')
                            .addOptions(
                                guildActions.map(action => ({
                                    label: action.name,
                                    description: `${action.actionType === 'good' ? 'Bonne' : 'Mauvaise'} action - ${action.baseReward}€`,
                                    value: action.id,
                                    emoji: action.actionType === 'good' ? '😇' : '😈'
                                }))
                            )
                    );
                components.push(actionSelector);
            }

            await this.respondToInteraction(interaction, {
                embeds: [embed],
                components: components
            });
        } catch (error) {
            console.error('Erreur showActionsConfig:', error);
        }
    },

    async showShopConfig(interaction) {
        try {
            const guildId = interaction.guild.id;
            const shopPath = path.join('./data', 'shop.json');
            let shopData = {};
            
            if (fs.existsSync(shopPath)) {
                shopData = JSON.parse(fs.readFileSync(shopPath, 'utf8'));
            }

            const shopItems = shopData[guildId] || [];

            const embed = new EmbedBuilder()
                .setTitle('🛒 Configuration de la Boutique')
                .setDescription(`**${shopItems.length} objets** configurés dans la boutique\n\nTypes d'objets disponibles :\n🏆 **Objets virtuels** - Items personnalisés\n👤 **Rôles temporaires** - Rôles avec durée\n⭐ **Rôles permanents** - Rôles définitifs`)
                .setColor('#00AAFF');

            if (shopItems.length > 0) {
                const itemList = shopItems.slice(0, 10).map(item => {
                    let typeIcon = '🏆';
                    let typeText = '';
                    
                    if (item.type === 'temp_role') {
                        typeIcon = '👤';
                        typeText = ` (${Math.floor(item.duration/3600)}h)`;
                    } else if (item.type === 'perm_role') {
                        typeIcon = '⭐';
                        typeText = ' (permanent)';
                    }
                    
                    return `${typeIcon} **${item.name}** - ${item.price}€${typeText}`;
                }).join('\n');
                
                embed.addFields({ name: '📦 Objets Disponibles', value: itemList });
            }

            const components = [
                this.getNavigationMenu(),
                new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('economy_shop_actions')
                            .setPlaceholder('🛒 Gérer la boutique')
                            .addOptions([
                                {
                                    label: 'Ajouter un Objet',
                                    description: 'Créer un nouvel objet, rôle temporaire ou permanent',
                                    value: 'add',
                                    emoji: '➕'
                                },
                                {
                                    label: 'Liste Complète',
                                    description: 'Voir tous les objets de la boutique',
                                    value: 'list',
                                    emoji: '📋'
                                },
                                {
                                    label: 'Supprimer un Objet',
                                    description: 'Retirer un objet de la boutique',
                                    value: 'remove',
                                    emoji: '🗑️'
                                }
                            ])
                    )
            ];

            await this.respondToInteraction(interaction, {
                embeds: [embed],
                components: components
            });
        } catch (error) {
            console.error('Erreur showShopConfig:', error);
        }
    },

    async showKarmaConfig(interaction) {
        try {
            // Load karma configuration
            const karmaPath = path.join('./data', 'karma.json');
            let karmaData = {};
            
            if (fs.existsSync(karmaPath)) {
                karmaData = JSON.parse(fs.readFileSync(karmaPath, 'utf8'));
            }

            const guildId = interaction.guild.id;
            const guildKarma = karmaData[guildId] || {
                daily: { rewards: [], sanctions: [] },
                weekly: { rewards: [], sanctions: [] },
                monthly: { rewards: [], sanctions: [] }
            };

            const embed = new EmbedBuilder()
                .setTitle('⚖️ Configuration Karma')
                .setDescription('Configurez les sanctions et récompenses basées sur le karma.\n\n' +
                    `**Sanctions quotidiennes:** ${guildKarma.daily.sanctions.length} configurées\n` +
                    `**Récompenses quotidiennes:** ${guildKarma.daily.rewards.length} configurées\n` +
                    `**Sanctions hebdomadaires:** ${guildKarma.weekly.sanctions.length} configurées\n` +
                    `**Récompenses hebdomadaires:** ${guildKarma.weekly.rewards.length} configurées`)
                .setColor('#9932CC');

            const components = [
                this.getNavigationMenu(),
                new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('economy_karma_config')
                            .setPlaceholder('Choisir une configuration karma')
                            .addOptions([
                                {
                                    label: 'Sanctions quotidiennes',
                                    description: 'Configurer les sanctions pour karma négatif',
                                    value: 'daily_sanctions',
                                    emoji: '😈'
                                },
                                {
                                    label: 'Récompenses quotidiennes',
                                    description: 'Configurer les récompenses pour karma positif',
                                    value: 'daily_rewards',
                                    emoji: '😇'
                                },
                                {
                                    label: 'Sanctions hebdomadaires',
                                    description: 'Configurer les sanctions hebdomadaires',
                                    value: 'weekly_sanctions',
                                    emoji: '📅'
                                },
                                {
                                    label: 'Récompenses hebdomadaires',
                                    description: 'Configurer les récompenses hebdomadaires',
                                    value: 'weekly_rewards',
                                    emoji: '🎁'
                                }
                            ])
                    )
            ];

            await this.respondToInteraction(interaction, {
                embeds: [embed],
                components: components
            });
        } catch (error) {
            console.error('Erreur showKarmaConfig:', error);
        }
    },

    getNavigationMenu() {
        return new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('economy_config_menu')
                    .setPlaceholder('📋 Naviguer dans la configuration')
                    .addOptions([
                        {
                            label: 'Menu Principal',
                            description: 'Retourner au menu de configuration',
                            value: 'main',
                            emoji: '🏠'
                        },
                        {
                            label: 'Actions Économiques',
                            description: 'Gérer les actions (travail, vol, etc.)',
                            value: 'actions',
                            emoji: '💼'
                        },
                        {
                            label: 'Boutique',
                            description: 'Configurer la boutique et les objets',
                            value: 'shop',
                            emoji: '🛒'
                        },
                        {
                            label: 'Système Karma',
                            description: 'Sanctions et récompenses automatiques',
                            value: 'karma',
                            emoji: '📊'
                        }
                    ])
            );
    },

    async showActionDetails(interaction, actionId) {
        try {
            const guildId = interaction.guild.id;
            const actionsPath = path.join('./data', 'actions.json');
            
            let actionsData = {};
            if (fs.existsSync(actionsPath)) {
                actionsData = JSON.parse(fs.readFileSync(actionsPath, 'utf8'));
            }

            const actionKey = `${guildId}_${actionId}`;
            const action = actionsData[actionKey];

            if (!action) {
                await this.respondToInteraction(interaction, {
                    content: '❌ Action non trouvée.',
                    ephemeral: true
                });
                return;
            }

            const typeEmoji = action.actionType === 'good' ? '😇' : '😈';
            const statusEmoji = action.enabled !== false ? '🟢 Activée' : '🔴 Désactivée';
            
            const embed = new EmbedBuilder()
                .setColor(action.actionType === 'good' ? '#00ff00' : '#ff0000')
                .setTitle(`${typeEmoji} Configuration : ${action.name}`)
                .setDescription(`**Type :** ${action.actionType === 'good' ? 'Bonne action' : 'Mauvaise action'}\n**Description :** ${action.description}`)
                .addFields(
                    {
                        name: '💶 Gain',
                        value: `**${action.baseReward}€**`,
                        inline: true
                    },
                    {
                        name: '⏰ Cooldown',
                        value: `**${Math.floor(action.cooldown/60)}** minutes`,
                        inline: true
                    },
                    {
                        name: '🔄 Statut',
                        value: statusEmoji,
                        inline: true
                    },
                    {
                        name: '📊 Karma',
                        value: `Bon: **${action.karmaGoodChange || 0}** | Mauvais: **${action.karmaBadChange || 0}**`,
                        inline: false
                    }
                )
                .setFooter({ text: 'Utilisez le sélecteur pour modifier les paramètres' });

            const components = [
                this.getNavigationMenu(),
                new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('economy_action_settings')
                            .setPlaceholder('⚙️ Modifier les paramètres')
                            .addOptions([
                                {
                                    label: 'Modifier le gain',
                                    description: `Actuellement: ${action.baseReward}€`,
                                    value: `reward_${actionId}`,
                                    emoji: '💶'
                                },
                                {
                                    label: 'Modifier le cooldown',
                                    description: `Actuellement: ${Math.floor(action.cooldown/60)} minutes`,
                                    value: `cooldown_${actionId}`,
                                    emoji: '⏰'
                                },
                                {
                                    label: action.enabled !== false ? 'Désactiver' : 'Activer',
                                    description: `${action.enabled !== false ? 'Désactiver cette action' : 'Activer cette action'}`,
                                    value: `toggle_${actionId}`,
                                    emoji: action.enabled !== false ? '🔴' : '🟢'
                                },
                                {
                                    label: 'Modifier le karma bon',
                                    description: `Actuellement: ${action.karmaGoodChange || 0} karma bon`,
                                    value: `karma_good_${actionId}`,
                                    emoji: '😇'
                                },
                                {
                                    label: 'Modifier le karma mauvais',
                                    description: `Actuellement: ${action.karmaBadChange || 0} karma mauvais`,
                                    value: `karma_bad_${actionId}`,
                                    emoji: '😈'
                                }
                            ])
                    )
            ];

            await this.respondToInteraction(interaction, {
                embeds: [embed],
                components: components
            });
        } catch (error) {
            console.error('Erreur showActionDetails:', error);
        }
    },

    async handleActionSetting(interaction, value) {
        try {
            console.log('HandleActionSetting called with value:', value);
            const guildId = interaction.guild.id;

            if (value.startsWith('toggle_')) {
                const actionId = value.replace('toggle_', '');
                await this.toggleAction(interaction, guildId, actionId);
            } else if (value.startsWith('reward_')) {
                const actionId = value.replace('reward_', '');
                await this.showRewardModal(interaction, guildId, actionId);
            } else if (value.startsWith('cooldown_')) {
                const actionId = value.replace('cooldown_', '');
                await this.showCooldownModal(interaction, guildId, actionId);
            } else if (value.startsWith('karma_good_')) {
                const actionId = value.replace('karma_good_', '');
                await this.showKarmaGoodSelector(interaction, guildId, actionId);
            } else if (value.startsWith('karma_bad_')) {
                const actionId = value.replace('karma_bad_', '');
                await this.showKarmaBadSelector(interaction, guildId, actionId);
            }
        } catch (error) {
            console.error('Erreur handleActionSetting:', error);
        }
    },

    async toggleAction(interaction, guildId, actionId) {
        try {
            const actionsPath = path.join('./data', 'actions.json');
            let actionsData = {};
            
            if (fs.existsSync(actionsPath)) {
                actionsData = JSON.parse(fs.readFileSync(actionsPath, 'utf8'));
            }

            const actionKey = `${guildId}_${actionId}`;
            if (actionsData[actionKey]) {
                actionsData[actionKey].enabled = !actionsData[actionKey].enabled;
                fs.writeFileSync(actionsPath, JSON.stringify(actionsData, null, 2));

                const status = actionsData[actionKey].enabled ? 'activée' : 'désactivée';
                
                await interaction.update({
                    content: `✅ Action **${actionsData[actionKey].name}** ${status} avec succès.`,
                    embeds: [],
                    components: []
                });
            }
        } catch (error) {
            console.error('Erreur toggleAction:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Erreur lors de la modification.',
                    ephemeral: true
                });
            }
        }
    },

    async showRewardModal(interaction, guildId, actionId) {
        try {
            const modal = new ModalBuilder()
                .setCustomId(`economy_reward_modal_${actionId}`)
                .setTitle('€ Modifier le gain');

            const rewardInput = new TextInputBuilder()
                .setCustomId('reward_amount')
                .setLabel('Nouveau montant du gain')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Ex: 50, -20 (pour un coût)')
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(rewardInput));
            await interaction.showModal(modal);
        } catch (error) {
            console.error('Erreur showRewardModal:', error);
        }
    },

    async showCooldownModal(interaction, guildId, actionId) {
        try {
            const modal = new ModalBuilder()
                .setCustomId(`economy_cooldown_modal_${actionId}`)
                .setTitle('⏰ Modifier le cooldown');

            const cooldownInput = new TextInputBuilder()
                .setCustomId('cooldown_minutes')
                .setLabel('Nouveau cooldown en minutes')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Ex: 60 (pour 1 heure)')
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(cooldownInput));
            await interaction.showModal(modal);
        } catch (error) {
            console.error('Erreur showCooldownModal:', error);
        }
    },

    async handleModalSubmit(interaction) {
        try {
            const customId = interaction.customId;
            
            if (customId.startsWith('economy_reward_modal_')) {
                const actionId = customId.replace('economy_reward_modal_', '');
                const newReward = parseInt(interaction.fields.getTextInputValue('reward_amount'));
                await this.updateActionReward(interaction, actionId, newReward);
            } else if (customId.startsWith('economy_cooldown_modal_')) {
                const actionId = customId.replace('economy_cooldown_modal_', '');
                const newCooldown = parseInt(interaction.fields.getTextInputValue('cooldown_minutes')) * 60;
                await this.updateActionCooldown(interaction, actionId, newCooldown);
            } else if (customId.startsWith('karma_good_modal_')) {
                const actionId = customId.replace('karma_good_modal_', '');
                const karmaValue = interaction.fields.getTextInputValue('karma_good_value');
                const newKarmaGood = parseInt(karmaValue);
                
                if (!isNaN(newKarmaGood)) {
                    await this.updateActionKarmaGood(interaction, actionId, newKarmaGood);
                } else {
                    await interaction.reply({
                        content: '❌ Veuillez entrer un nombre valide.',
                        ephemeral: true
                    });
                }
            } else if (customId.startsWith('karma_bad_modal_')) {
                const actionId = customId.replace('karma_bad_modal_', '');
                const karmaValue = interaction.fields.getTextInputValue('karma_bad_value');
                const newKarmaBad = parseInt(karmaValue);
                
                if (!isNaN(newKarmaBad)) {
                    await this.updateActionKarmaBad(interaction, actionId, newKarmaBad);
                } else {
                    await interaction.reply({
                        content: '❌ Veuillez entrer un nombre valide.',
                        ephemeral: true
                    });
                }
            } else if (customId.startsWith('economy_karma_create_')) {
                const parts = customId.split('_');
                const period = parts[3]; // daily, weekly
                const type = parts[4];   // rewards, sanctions  
                const rewardType = parts[5]; // money, temp_role, perm_role, shop_item
                
                const karmaThreshold = parseInt(interaction.fields.getTextInputValue('karma_threshold'));
                
                let ruleData = {
                    karmaThreshold: karmaThreshold,
                    type: rewardType,
                    createdAt: new Date().toISOString()
                };

                if (rewardType === 'money') {
                    ruleData.amount = parseInt(interaction.fields.getTextInputValue('value'));
                } else if (rewardType === 'temp_role' || rewardType === 'perm_role') {
                    // For roles selected via modal, the roleId is in the customId
                    if (parts.length > 6) {
                        ruleData.roleId = parts[6]; // Role ID from customId
                        if (rewardType === 'temp_role') {
                            const duration = interaction.fields.getTextInputValue('duration');
                            ruleData.duration = duration ? parseInt(duration) * 3600 : 24 * 3600; // Default 24h
                        }
                    }
                } else if (rewardType === 'shop_item' || (rewardType === 'shop' && parts[6] === 'item')) {
                    // For shop items, the itemId is in the customId
                    if (parts.length > 7) {
                        ruleData.itemId = parts[7]; // Item ID from customId
                        ruleData.type = 'shop_item'; // Normalize type
                    }
                }

                await this.addAdvancedKarmaRule(interaction, `${period}_${type}`, ruleData);
            } else if (customId === 'economy_shop_create_item') {
                await this.createShopItem(interaction);
            } else if (customId.startsWith('economy_shop_create_')) {
                await this.createShopRole(interaction);
            }
        } catch (error) {
            console.error('Erreur handleModalSubmit:', error);
        }
    },

    async updateActionReward(interaction, actionId, newReward) {
        try {
            if (isNaN(newReward)) {
                await interaction.reply({
                    content: '❌ Veuillez entrer un nombre valide.',
                    ephemeral: true
                });
                return;
            }

            const guildId = interaction.guild.id;
            const actionsPath = path.join('./data', 'actions.json');
            let actionsData = {};
            
            if (fs.existsSync(actionsPath)) {
                actionsData = JSON.parse(fs.readFileSync(actionsPath, 'utf8'));
            }

            const actionKey = `${guildId}_${actionId}`;
            if (actionsData[actionKey]) {
                actionsData[actionKey].baseReward = newReward;
                fs.writeFileSync(actionsPath, JSON.stringify(actionsData, null, 2));

                await interaction.reply({
                    content: `✅ Gain de **${actionsData[actionKey].name}** modifié à **${newReward}€**.`,
                    ephemeral: true
                });

                // Rafraîchir l'affichage
                setTimeout(async () => {
                    await this.showActionDetails(interaction, actionId);
                }, 1000);
            }
        } catch (error) {
            console.error('Erreur updateActionReward:', error);
        }
    },

    async updateActionCooldown(interaction, actionId, newCooldown) {
        try {
            if (isNaN(newCooldown) || newCooldown < 0) {
                await interaction.reply({
                    content: '❌ Veuillez entrer un nombre de minutes valide.',
                    ephemeral: true
                });
                return;
            }

            const guildId = interaction.guild.id;
            const actionsPath = path.join('./data', 'actions.json');
            let actionsData = {};
            
            if (fs.existsSync(actionsPath)) {
                actionsData = JSON.parse(fs.readFileSync(actionsPath, 'utf8'));
            }

            const actionKey = `${guildId}_${actionId}`;
            if (actionsData[actionKey]) {
                actionsData[actionKey].cooldown = newCooldown;
                fs.writeFileSync(actionsPath, JSON.stringify(actionsData, null, 2));

                await interaction.reply({
                    content: `✅ Cooldown de **${actionsData[actionKey].name}** modifié à **${Math.floor(newCooldown/60)}** minutes.`,
                    ephemeral: true
                });

                // Rafraîchir l'affichage
                setTimeout(async () => {
                    await this.showActionDetails(interaction, actionId);
                }, 1000);
            }
        } catch (error) {
            console.error('Erreur updateActionCooldown:', error);
        }
    },

    async showKarmaGoodSelector(interaction, guildId, actionId) {
        try {
            console.log('Affichage sélecteur karma bon pour action:', actionId);
            const actionsPath = path.join('./data', 'actions.json');
            let actionsData = {};
            
            if (fs.existsSync(actionsPath)) {
                actionsData = JSON.parse(fs.readFileSync(actionsPath, 'utf8'));
            }

            const actionKey = `${guildId}_${actionId}`;
            const action = actionsData[actionKey];
            const currentValue = action ? action.karmaGoodChange || 0 : 0;

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('😇 Modifier le Karma Bon')
                .setDescription(`**Action :** ${action?.name || actionId}\n**Valeur actuelle :** ${currentValue}\n\nSélectionnez la nouvelle valeur de karma bon :`)
                .setFooter({ text: 'Valeurs négatives diminuent le karma bon' });

            const karmaSelector = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId(`karma_good_select_${actionId}`)
                        .setPlaceholder('Sélectionner une valeur de karma bon')
                        .addOptions([
                            {
                                label: '-5',
                                description: 'Diminue fortement le karma bon',
                                value: '-5',
                                emoji: '📉'
                            },
                            {
                                label: '-4',
                                description: 'Diminue le karma bon',
                                value: '-4',
                                emoji: '⬇️'
                            },
                            {
                                label: '-3',
                                description: 'Diminue le karma bon',
                                value: '-3',
                                emoji: '⬇️'
                            },
                            {
                                label: '-2',
                                description: 'Diminue le karma bon',
                                value: '-2',
                                emoji: '⬇️'
                            },
                            {
                                label: '-1',
                                description: 'Diminue légèrement le karma bon',
                                value: '-1',
                                emoji: '⬇️'
                            },
                            {
                                label: '0 (Aucun effet)',
                                description: 'N\'affecte pas le karma bon',
                                value: '0',
                                emoji: '➡️'
                            },
                            {
                                label: '+1',
                                description: 'Augmente légèrement le karma bon',
                                value: '1',
                                emoji: '⬆️'
                            },
                            {
                                label: '+2',
                                description: 'Augmente le karma bon',
                                value: '2',
                                emoji: '⬆️'
                            },
                            {
                                label: '+3',
                                description: 'Augmente le karma bon',
                                value: '3',
                                emoji: '⬆️'
                            },
                            {
                                label: '+4',
                                description: 'Augmente le karma bon',
                                value: '4',
                                emoji: '⬆️'
                            },
                            {
                                label: '+5',
                                description: 'Augmente fortement le karma bon',
                                value: '5',
                                emoji: '📈'
                            }
                        ])
                );

            const components = [karmaSelector];

            await interaction.reply({
                embeds: [embed],
                components: components,
                ephemeral: true
            });
        } catch (error) {
            console.error('Erreur showKarmaGoodSelector:', error);
        }
    },

    async showKarmaBadSelector(interaction, guildId, actionId) {
        try {
            console.log('Affichage sélecteur karma mauvais pour action:', actionId);
            const actionsPath = path.join('./data', 'actions.json');
            let actionsData = {};
            
            if (fs.existsSync(actionsPath)) {
                actionsData = JSON.parse(fs.readFileSync(actionsPath, 'utf8'));
            }

            const actionKey = `${guildId}_${actionId}`;
            const action = actionsData[actionKey];
            const currentValue = action ? action.karmaBadChange || 0 : 0;

            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('😈 Modifier le Karma Mauvais')
                .setDescription(`**Action :** ${action?.name || actionId}\n**Valeur actuelle :** ${currentValue}\n\nSélectionnez la nouvelle valeur de karma mauvais :`)
                .setFooter({ text: 'Valeurs négatives diminuent le karma mauvais' });

            const karmaSelector = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId(`karma_bad_select_${actionId}`)
                        .setPlaceholder('Sélectionner une valeur de karma mauvais')
                        .addOptions([
                            {
                                label: '-5',
                                description: 'Diminue fortement le karma mauvais',
                                value: '-5',
                                emoji: '📉'
                            },
                            {
                                label: '-4',
                                description: 'Diminue le karma mauvais',
                                value: '-4',
                                emoji: '⬇️'
                            },
                            {
                                label: '-3',
                                description: 'Diminue le karma mauvais',
                                value: '-3',
                                emoji: '⬇️'
                            },
                            {
                                label: '-2',
                                description: 'Diminue le karma mauvais',
                                value: '-2',
                                emoji: '⬇️'
                            },
                            {
                                label: '-1',
                                description: 'Diminue légèrement le karma mauvais',
                                value: '-1',
                                emoji: '⬇️'
                            },
                            {
                                label: '0 (Aucun effet)',
                                description: 'N\'affecte pas le karma mauvais',
                                value: '0',
                                emoji: '➡️'
                            },
                            {
                                label: '+1',
                                description: 'Augmente légèrement le karma mauvais',
                                value: '1',
                                emoji: '⬆️'
                            },
                            {
                                label: '+2',
                                description: 'Augmente le karma mauvais',
                                value: '2',
                                emoji: '⬆️'
                            },
                            {
                                label: '+3',
                                description: 'Augmente le karma mauvais',
                                value: '3',
                                emoji: '⬆️'
                            },
                            {
                                label: '+4',
                                description: 'Augmente le karma mauvais',
                                value: '4',
                                emoji: '⬆️'
                            },
                            {
                                label: '+5',
                                description: 'Augmente fortement le karma mauvais',
                                value: '5',
                                emoji: '📈'
                            }
                        ])
                );

            const components = [karmaSelector];

            await interaction.reply({
                embeds: [embed],
                components: components,
                ephemeral: true
            });
        } catch (error) {
            console.error('Erreur showKarmaBadSelector:', error);
        }
    },

    async updateActionKarmaGood(interaction, actionId, newKarmaGood) {
        try {
            console.log('Mise à jour karma bon:', actionId, 'nouvelle valeur:', newKarmaGood);
            
            if (isNaN(newKarmaGood)) {
                await interaction.reply({
                    content: '❌ Veuillez entrer un nombre valide.',
                    ephemeral: true
                });
                return;
            }

            const guildId = interaction.guild.id;
            const actionsPath = path.join('./data', 'actions.json');
            let actionsData = {};
            
            if (fs.existsSync(actionsPath)) {
                actionsData = JSON.parse(fs.readFileSync(actionsPath, 'utf8'));
            }

            const actionKey = `${guildId}_${actionId}`;
            if (actionsData[actionKey]) {
                actionsData[actionKey].karmaGoodChange = newKarmaGood;
                fs.writeFileSync(actionsPath, JSON.stringify(actionsData, null, 2));

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({
                        content: `✅ Karma bon de **${actionsData[actionKey].name}** modifié à **${newKarmaGood}**.`,
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: `✅ Karma bon de **${actionsData[actionKey].name}** modifié à **${newKarmaGood}**.`,
                        ephemeral: true
                    });
                }
            } else {
                await interaction.reply({
                    content: '❌ Action non trouvée.',
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('Erreur updateActionKarmaGood:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Une erreur s\'est produite lors de la modification du karma.',
                    ephemeral: true
                }).catch(() => {});
            }
        }
    },

    async updateActionKarmaBad(interaction, actionId, newKarmaBad) {
        try {
            console.log('Mise à jour karma mauvais:', actionId, 'nouvelle valeur:', newKarmaBad);
            
            if (isNaN(newKarmaBad)) {
                await interaction.reply({
                    content: '❌ Veuillez entrer un nombre valide.',
                    ephemeral: true
                });
                return;
            }

            const guildId = interaction.guild.id;
            const actionsPath = path.join('./data', 'actions.json');
            let actionsData = {};
            
            if (fs.existsSync(actionsPath)) {
                actionsData = JSON.parse(fs.readFileSync(actionsPath, 'utf8'));
            }

            const actionKey = `${guildId}_${actionId}`;
            if (actionsData[actionKey]) {
                actionsData[actionKey].karmaBadChange = newKarmaBad;
                fs.writeFileSync(actionsPath, JSON.stringify(actionsData, null, 2));

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({
                        content: `✅ Karma mauvais de **${actionsData[actionKey].name}** modifié à **${newKarmaBad}**.`,
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: `✅ Karma mauvais de **${actionsData[actionKey].name}** modifié à **${newKarmaBad}**.`,
                        ephemeral: true
                    });
                }
            } else {
                await interaction.reply({
                    content: '❌ Action non trouvée.',
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('Erreur updateActionKarmaBad:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Une erreur s\'est produite lors de la modification du karma.',
                    ephemeral: true
                }).catch(() => {});
            }
        }
    },

    async showKarmaDetails(interaction, karmaType) {
        try {
            const [period, type] = karmaType.split('_'); // daily_sanctions, weekly_rewards, etc.
            
            const karmaPath = path.join('./data', 'karma.json');
            let karmaData = {};
            
            if (fs.existsSync(karmaPath)) {
                karmaData = JSON.parse(fs.readFileSync(karmaPath, 'utf8'));
            }

            const guildId = interaction.guild.id;
            const guildKarma = karmaData[guildId] || {
                daily: { rewards: [], sanctions: [] },
                weekly: { rewards: [], sanctions: [] },
                monthly: { rewards: [], sanctions: [] }
            };

            const items = guildKarma[period] && guildKarma[period][type] ? guildKarma[period][type] : [];
            
            const embed = new EmbedBuilder()
                .setTitle(`⚖️ ${type === 'rewards' ? 'Récompenses' : 'Sanctions'} ${period === 'daily' ? 'Quotidiennes' : 'Hebdomadaires'}`)
                .setDescription(items.length > 0 ? 
                    items.map((item, index) => {
                        let reward = '';
                        switch (item.type) {
                            case 'money':
                                reward = `${item.amount}€`;
                                break;
                            case 'temp_role':
                                reward = `Rôle <@&${item.roleId}> (${Math.floor(item.duration/3600)}h)`;
                                break;
                            case 'perm_role':
                                reward = `Rôle <@&${item.roleId}> permanent`;
                                break;
                            case 'shop_item':
                                reward = `Objet: ${item.itemId}`;
                                break;
                            default:
                                reward = `${item.amount || 0}€`;
                        }
                        return `**${index + 1}.** Karma ${item.karmaThreshold > 0 ? '+' : ''}${item.karmaThreshold} → ${reward}`;
                    }).join('\n') :
                    'Aucune règle configurée.')
                .setColor(type === 'rewards' ? '#00FF00' : '#FF0000');

            const components = [
                this.getNavigationMenu(),
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`economy_karma_add_${karmaType}`)
                            .setLabel('Ajouter une règle')
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji('➕')
                    )
            ];

            if (items.length > 0) {
                components.push(
                    new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId(`economy_karma_manage_${karmaType}`)
                                .setPlaceholder('Modifier/Supprimer une règle')
                                .addOptions(
                                    items.map((item, index) => ({
                                        label: `Règle ${index + 1}: Karma ${item.karmaThreshold}`,
                                        description: `Donne ${item.amount} €`,
                                        value: `${index}`
                                    }))
                                )
                        )
                );
            }

            await this.respondToInteraction(interaction, {
                embeds: [embed],
                components: components
            });
        } catch (error) {
            console.error('Erreur showKarmaDetails:', error);
        }
    },

    async handleButtonInteraction(interaction) {
        try {
            const customId = interaction.customId;
            console.log('Button interaction:', customId);
            
            if (customId.startsWith('economy_karma_add_')) {
                const karmaType = customId.replace('economy_karma_add_', '');
                await this.showKarmaModal(interaction, karmaType);
            }
        } catch (error) {
            console.error('Erreur handleButtonInteraction:', error);
        }
    },

    async showKarmaModal(interaction, karmaType) {
        try {
            const [period, type] = karmaType.split('_');
            const isReward = type === 'rewards';
            
            const embed = new EmbedBuilder()
                .setTitle(`⚖️ ${isReward ? 'Récompense' : 'Sanction'} ${period === 'daily' ? 'Quotidienne' : 'Hebdomadaire'}`)
                .setDescription('Choisissez le type de sanction/récompense à configurer')
                .setColor(isReward ? '#00FF00' : '#FF0000');

            const components = [
                this.getNavigationMenu(),
                new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId(`economy_karma_type_${karmaType}`)
                            .setPlaceholder('Choisir le type de sanction/récompense')
                            .addOptions([
                                {
                                    label: 'Argent',
                                    description: isReward ? 'Donner de l\'argent' : 'Retirer de l\'argent',
                                    value: 'money',
                                    emoji: '€'
                                },
                                {
                                    label: 'Rôle temporaire',
                                    description: isReward ? 'Donner un rôle temporaire' : 'Retirer un rôle temporairement',
                                    value: 'temp_role',
                                    emoji: '⏰'
                                },
                                {
                                    label: 'Rôle permanent',
                                    description: isReward ? 'Donner un rôle permanent' : 'Retirer un rôle permanent',
                                    value: 'perm_role',
                                    emoji: '🏷️'
                                },
                                {
                                    label: 'Objet boutique',
                                    description: isReward ? 'Donner un objet' : 'Retirer un objet',
                                    value: 'shop_item',
                                    emoji: '🛒'
                                }
                            ])
                    )
            ];

            await this.respondToInteraction(interaction, {
                embeds: [embed],
                components: components
            });
        } catch (error) {
            console.error('Erreur showKarmaModal:', error);
        }
    },

    async showKarmaConfigModal(interaction, karmaType, rewardType) {
        try {
            const [period, type] = karmaType.split('_');
            const isReward = type === 'rewards';
            
            if (rewardType === 'money') {
                // For money, use a modal
                await this.showKarmaMoneyModal(interaction, karmaType);
            } else if (rewardType === 'temp_role' || rewardType === 'perm_role') {
                // For roles, show role selector
                await this.showKarmaRoleSelector(interaction, karmaType, rewardType);
            } else if (rewardType === 'shop_item') {
                // For shop items, show item selector
                await this.showKarmaShopSelector(interaction, karmaType);
            }
        } catch (error) {
            console.error('Erreur showKarmaConfigModal:', error);
        }
    },

    async showKarmaMoneyModal(interaction, karmaType) {
        try {
            const [period, type] = karmaType.split('_');
            const isReward = type === 'rewards';
            
            const modal = new ModalBuilder()
                .setCustomId(`economy_karma_create_${karmaType}_money`)
                .setTitle(`${isReward ? 'Récompense' : 'Sanction'} - Argent`);

            const karmaInput = new TextInputBuilder()
                .setCustomId('karma_threshold')
                .setLabel('Seuil de karma requis')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder(isReward ? 'Ex: 10 (karma positif)' : 'Ex: -5 (karma négatif)')
                .setRequired(true);

            const amountInput = new TextInputBuilder()
                .setCustomId('value')
                .setLabel('Montant en €')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder(isReward ? 'Ex: 100 (gain)' : 'Ex: -50 (perte)')
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(karmaInput),
                new ActionRowBuilder().addComponents(amountInput)
            );

            await interaction.showModal(modal);
        } catch (error) {
            console.error('Erreur showKarmaMoneyModal:', error);
        }
    },

    async showKarmaRoleSelector(interaction, karmaType, rewardType) {
        try {
            const [period, type] = karmaType.split('_');
            const isReward = type === 'rewards';
            const isTemp = rewardType === 'temp_role';
            
            // Get guild roles (excluding @everyone)
            const roles = interaction.guild.roles.cache
                .filter(role => role.id !== interaction.guild.id && !role.managed)
                .sort((a, b) => b.position - a.position)
                .first(25); // Discord limit

            if (roles.length === 0) {
                await this.respondToInteraction(interaction, {
                    content: '❌ Aucun rôle disponible sur ce serveur.',
                    ephemeral: true
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle(`⚖️ ${isReward ? 'Récompense' : 'Sanction'} - ${isTemp ? 'Rôle Temporaire' : 'Rôle Permanent'}`)
                .setDescription(`Sélectionnez un rôle et entrez le seuil de karma${isTemp ? ' et la durée' : ''}.`)
                .setColor(isReward ? '#00FF00' : '#FF0000');

            const components = [
                this.getNavigationMenu(),
                new ActionRowBuilder()
                    .addComponents(
                        new RoleSelectMenuBuilder()
                            .setCustomId(`economy_karma_role_${karmaType}_${rewardType}`)
                            .setPlaceholder('Sélectionner un rôle')
                            .setMaxValues(1)
                    )
            ];

            await this.respondToInteraction(interaction, {
                embeds: [embed],
                components: components
            });
        } catch (error) {
            console.error('Erreur showKarmaRoleSelector:', error);
        }
    },

    async showKarmaShopSelector(interaction, karmaType) {
        try {
            const [period, type] = karmaType.split('_');
            const isReward = type === 'rewards';
            
            // Load shop items
            const shopPath = path.join('./data', 'shop.json');
            let shopData = {};
            
            if (fs.existsSync(shopPath)) {
                shopData = JSON.parse(fs.readFileSync(shopPath, 'utf8'));
            }

            const guildId = interaction.guild.id;
            const shopItems = shopData[guildId] || [];

            if (shopItems.length === 0) {
                await this.respondToInteraction(interaction, {
                    content: '❌ Aucun objet configuré dans la boutique. Configurez d\'abord des objets dans la section Boutique.',
                    ephemeral: true
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle(`⚖️ ${isReward ? 'Récompense' : 'Sanction'} - Objet Boutique`)
                .setDescription('Sélectionnez un objet de la boutique et entrez le seuil de karma.')
                .setColor(isReward ? '#00FF00' : '#FF0000');

            const components = [
                this.getNavigationMenu(),
                new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId(`economy_karma_shop_${karmaType}`)
                            .setPlaceholder('Sélectionner un objet de la boutique')
                            .addOptions(
                                shopItems.slice(0, 25).map(item => ({
                                    label: item.name,
                                    description: `Prix: ${item.price}€`,
                                    value: item.id,
                                    emoji: item.emoji || '🛒'
                                }))
                            )
                    )
            ];

            await this.respondToInteraction(interaction, {
                embeds: [embed],
                components: components
            });
        } catch (error) {
            console.error('Erreur showKarmaShopSelector:', error);
        }
    },

    async handleRoleSelection(interaction) {
        try {
            const customId = interaction.customId;
            const roleId = interaction.values[0];
            
            console.log('Role selection:', customId, 'role:', roleId);
            
            // Extract karma type and reward type from customId
            // Format: economy_karma_role_{period}_{type}_{rewardType}
            const parts = customId.split('_');
            const period = parts[3]; // daily, weekly
            const type = parts[4];   // rewards, sanctions
            const rewardType = parts[5]; // temp_role, perm_role
            
            const karmaType = `${period}_${type}`;
            
            await this.showKarmaRoleModal(interaction, karmaType, rewardType, roleId);
        } catch (error) {
            console.error('Erreur handleRoleSelection:', error);
        }
    },

    async showKarmaRoleModal(interaction, karmaType, rewardType, roleId) {
        try {
            const [period, type] = karmaType.split('_');
            const isReward = type === 'rewards';
            const isTemp = rewardType === 'temp_role';
            
            const modal = new ModalBuilder()
                .setCustomId(`economy_karma_create_${karmaType}_${rewardType}_${roleId}`)
                .setTitle(`${isReward ? 'Récompense' : 'Sanction'} - ${isTemp ? 'Rôle Temporaire' : 'Rôle Permanent'}`);

            const karmaInput = new TextInputBuilder()
                .setCustomId('karma_threshold')
                .setLabel('Seuil de karma requis')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder(isReward ? 'Ex: 10 (karma positif)' : 'Ex: -5 (karma négatif)')
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(karmaInput));

            if (isTemp) {
                const durationInput = new TextInputBuilder()
                    .setCustomId('duration')
                    .setLabel('Durée en heures')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ex: 24 (pour 24h)')
                    .setRequired(true);
                    
                modal.addComponents(new ActionRowBuilder().addComponents(durationInput));
            }

            await interaction.showModal(modal);
        } catch (error) {
            console.error('Erreur showKarmaRoleModal:', error);
        }
    },

    async showKarmaShopModal(interaction, karmaType, itemId) {
        try {
            const [period, type] = karmaType.split('_');
            const isReward = type === 'rewards';
            
            const modal = new ModalBuilder()
                .setCustomId(`economy_karma_create_${karmaType}_shop_item_${itemId}`)
                .setTitle(`${isReward ? 'Récompense' : 'Sanction'} - Objet Boutique`);

            const karmaInput = new TextInputBuilder()
                .setCustomId('karma_threshold')
                .setLabel('Seuil de karma requis')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder(isReward ? 'Ex: 10 (karma positif)' : 'Ex: -5 (karma négatif)')
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(karmaInput));

            await interaction.showModal(modal);
        } catch (error) {
            console.error('Erreur showKarmaShopModal:', error);
        }
    },

    // === SHOP MANAGEMENT FUNCTIONS ===

    async showShopTypeSelector(interaction) {
        try {
            const embed = new EmbedBuilder()
                .setTitle('🛒 Ajouter un Objet à la Boutique')
                .setDescription('Sélectionnez le type d\'objet à ajouter :')
                .setColor('#00AAFF');

            const components = [
                this.getNavigationMenu(),
                new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('economy_shop_type_selector')
                            .setPlaceholder('Choisir le type d\'objet')
                            .addOptions([
                                {
                                    label: 'Objet Virtuel',
                                    description: 'Item personnalisé (ex: potion, épée)',
                                    value: 'item',
                                    emoji: '🏆'
                                },
                                {
                                    label: 'Rôle Temporaire',
                                    description: 'Rôle Discord avec durée limitée',
                                    value: 'temp_role',
                                    emoji: '👤'
                                },
                                {
                                    label: 'Rôle Permanent',
                                    description: 'Rôle Discord définitif',
                                    value: 'perm_role',
                                    emoji: '⭐'
                                }
                            ])
                    )
            ];

            await this.respondToInteraction(interaction, {
                embeds: [embed],
                components: components
            });
        } catch (error) {
            console.error('Erreur showShopTypeSelector:', error);
        }
    },

    async showShopItemModal(interaction) {
        try {
            const modal = new ModalBuilder()
                .setCustomId('economy_shop_create_item')
                .setTitle('🏆 Créer un Objet Virtuel');

            const nameInput = new TextInputBuilder()
                .setCustomId('item_name')
                .setLabel('Nom de l\'objet')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Ex: Potion de Vie, Épée Légendaire')
                .setRequired(true);

            const priceInput = new TextInputBuilder()
                .setCustomId('item_price')
                .setLabel('Prix en €')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Ex: 100')
                .setRequired(true);

            const descriptionInput = new TextInputBuilder()
                .setCustomId('item_description')
                .setLabel('Description')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Description de l\'objet (optionnel)')
                .setRequired(false);

            const emojiInput = new TextInputBuilder()
                .setCustomId('item_emoji')
                .setLabel('Emoji (optionnel)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Ex: 🗡️, 🧪, ⚔️')
                .setRequired(false);

            modal.addComponents(
                new ActionRowBuilder().addComponents(nameInput),
                new ActionRowBuilder().addComponents(priceInput),
                new ActionRowBuilder().addComponents(descriptionInput),
                new ActionRowBuilder().addComponents(emojiInput)
            );

            await interaction.showModal(modal);
        } catch (error) {
            console.error('Erreur showShopItemModal:', error);
        }
    },

    async showShopRoleSelector(interaction, itemType) {
        try {
            const isTemp = itemType === 'temp_role';
            
            const embed = new EmbedBuilder()
                .setTitle(`${isTemp ? '👤' : '⭐'} Ajouter un ${isTemp ? 'Rôle Temporaire' : 'Rôle Permanent'}`)
                .setDescription(`Sélectionnez un rôle du serveur pour en faire un objet de boutique ${isTemp ? 'temporaire' : 'permanent'}.`)
                .setColor('#00AAFF');

            const components = [
                this.getNavigationMenu(),
                new ActionRowBuilder()
                    .addComponents(
                        new RoleSelectMenuBuilder()
                            .setCustomId(`economy_shop_role_${itemType}`)
                            .setPlaceholder('Sélectionner un rôle')
                            .setMaxValues(1)
                    )
            ];

            await this.respondToInteraction(interaction, {
                embeds: [embed],
                components: components
            });
        } catch (error) {
            console.error('Erreur showShopRoleSelector:', error);
        }
    },

    async showShopRoleModal(interaction, itemType, roleId) {
        try {
            const isTemp = itemType === 'temp_role';
            const role = interaction.guild.roles.cache.get(roleId);
            
            const modal = new ModalBuilder()
                .setCustomId(`economy_shop_create_${itemType}_${roleId}`)
                .setTitle(`${isTemp ? '👤' : '⭐'} ${isTemp ? 'Rôle Temporaire' : 'Rôle Permanent'}`);

            const priceInput = new TextInputBuilder()
                .setCustomId('role_price')
                .setLabel('Prix en €')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Ex: 500')
                .setRequired(true);

            const descriptionInput = new TextInputBuilder()
                .setCustomId('role_description')
                .setLabel('Description')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder(`Description pour le rôle ${role?.name || 'sélectionné'}`)
                .setRequired(false);

            modal.addComponents(
                new ActionRowBuilder().addComponents(priceInput),
                new ActionRowBuilder().addComponents(descriptionInput)
            );

            if (isTemp) {
                const durationInput = new TextInputBuilder()
                    .setCustomId('role_duration')
                    .setLabel('Durée en heures')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ex: 24 (pour 24 heures)')
                    .setRequired(true);
                    
                modal.addComponents(new ActionRowBuilder().addComponents(durationInput));
            }

            await interaction.showModal(modal);
        } catch (error) {
            console.error('Erreur showShopRoleModal:', error);
        }
    },

    async showShopList(interaction) {
        try {
            const guildId = interaction.guild.id;
            const shopPath = path.join('./data', 'shop.json');
            let shopData = {};
            
            if (fs.existsSync(shopPath)) {
                shopData = JSON.parse(fs.readFileSync(shopPath, 'utf8'));
            }

            const shopItems = shopData[guildId] || [];

            const embed = new EmbedBuilder()
                .setTitle('📋 Liste Complète de la Boutique')
                .setDescription(`**${shopItems.length} objets** configurés`)
                .setColor('#00AAFF');

            if (shopItems.length === 0) {
                embed.setDescription('Aucun objet configuré dans la boutique.');
            } else {
                const chunks = [];
                for (let i = 0; i < shopItems.length; i += 10) {
                    chunks.push(shopItems.slice(i, i + 10));
                }

                chunks.forEach((chunk, index) => {
                    const itemList = chunk.map(item => {
                        let typeIcon = '🏆';
                        let typeText = '';
                        
                        if (item.type === 'temp_role') {
                            typeIcon = '👤';
                            typeText = ` (${Math.floor(item.duration/3600)}h)`;
                        } else if (item.type === 'perm_role') {
                            typeIcon = '⭐';
                            typeText = ' (permanent)';
                        }
                        
                        return `${typeIcon} **${item.name}** - ${item.price}€${typeText}\n*${item.description || 'Aucune description'}*`;
                    }).join('\n\n');
                    
                    embed.addFields({
                        name: index === 0 ? '📦 Objets Disponibles' : '\u200b',
                        value: itemList,
                        inline: false
                    });
                });
            }

            const components = [this.getNavigationMenu()];

            await this.respondToInteraction(interaction, {
                embeds: [embed],
                components: components
            });
        } catch (error) {
            console.error('Erreur showShopList:', error);
        }
    },

    async showShopRemoveSelector(interaction) {
        try {
            const guildId = interaction.guild.id;
            const shopPath = path.join('./data', 'shop.json');
            let shopData = {};
            
            if (fs.existsSync(shopPath)) {
                shopData = JSON.parse(fs.readFileSync(shopPath, 'utf8'));
            }

            const shopItems = shopData[guildId] || [];

            if (shopItems.length === 0) {
                await this.respondToInteraction(interaction, {
                    content: '❌ Aucun objet à supprimer dans la boutique.',
                    ephemeral: true
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle('🗑️ Supprimer un Objet')
                .setDescription('Sélectionnez l\'objet à supprimer de la boutique :')
                .setColor('#FF0000');

            const components = [
                this.getNavigationMenu(),
                new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('economy_shop_remove_selector')
                            .setPlaceholder('Sélectionner un objet à supprimer')
                            .addOptions(
                                shopItems.slice(0, 25).map(item => {
                                    let typeIcon = '🏆';
                                    if (item.type === 'temp_role') typeIcon = '👤';
                                    else if (item.type === 'perm_role') typeIcon = '⭐';
                                    
                                    return {
                                        label: item.name,
                                        description: `Prix: ${item.price}€`,
                                        value: item.id,
                                        emoji: typeIcon
                                    };
                                })
                            )
                    )
            ];

            await this.respondToInteraction(interaction, {
                embeds: [embed],
                components: components
            });
        } catch (error) {
            console.error('Erreur showShopRemoveSelector:', error);
        }
    },

    async removeShopItem(interaction, itemId) {
        try {
            const guildId = interaction.guild.id;
            const shopPath = path.join('./data', 'shop.json');
            let shopData = {};
            
            if (fs.existsSync(shopPath)) {
                shopData = JSON.parse(fs.readFileSync(shopPath, 'utf8'));
            }

            if (!shopData[guildId]) {
                shopData[guildId] = [];
            }

            const itemIndex = shopData[guildId].findIndex(item => item.id === itemId);
            
            if (itemIndex === -1) {
                await this.respondToInteraction(interaction, {
                    content: '❌ Objet non trouvé.',
                    ephemeral: true
                });
                return;
            }

            const removedItem = shopData[guildId][itemIndex];
            shopData[guildId].splice(itemIndex, 1);

            fs.writeFileSync(shopPath, JSON.stringify(shopData, null, 2));

            await this.respondToInteraction(interaction, {
                content: `✅ Objet **${removedItem.name}** supprimé de la boutique.`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Erreur removeShopItem:', error);
            await this.respondToInteraction(interaction, {
                content: '❌ Erreur lors de la suppression.',
                ephemeral: true
            });
        }
    },

    getRewardTypeLabel(rewardType) {
        switch (rewardType) {
            case 'money': return 'Argent';
            case 'temp_role': return 'Rôle Temporaire';
            case 'perm_role': return 'Rôle Permanent';
            case 'shop_item': return 'Objet Boutique';
            default: return 'Inconnu';
        }
    },

    async addKarmaRule(interaction, karmaType, karmaThreshold, amount) {
        try {
            if (isNaN(karmaThreshold) || isNaN(amount)) {
                await interaction.reply({
                    content: '❌ Veuillez entrer des nombres valides.',
                    ephemeral: true
                });
                return;
            }

            const [period, type] = karmaType.split('_');
            const guildId = interaction.guild.id;
            const karmaPath = path.join('./data', 'karma.json');
            let karmaData = {};
            
            if (fs.existsSync(karmaPath)) {
                karmaData = JSON.parse(fs.readFileSync(karmaPath, 'utf8'));
            }

            if (!karmaData[guildId]) {
                karmaData[guildId] = {
                    daily: { rewards: [], sanctions: [] },
                    weekly: { rewards: [], sanctions: [] },
                    monthly: { rewards: [], sanctions: [] }
                };
            }

            if (!karmaData[guildId][period]) {
                karmaData[guildId][period] = { rewards: [], sanctions: [] };
            }

            if (!karmaData[guildId][period][type]) {
                karmaData[guildId][period][type] = [];
            }

            const newRule = {
                karmaThreshold: karmaThreshold,
                amount: amount,
                createdAt: new Date().toISOString()
            };

            karmaData[guildId][period][type].push(newRule);
            
            // Sort rules by karma threshold
            karmaData[guildId][period][type].sort((a, b) => a.karmaThreshold - b.karmaThreshold);

            fs.writeFileSync(karmaPath, JSON.stringify(karmaData, null, 2));

            await interaction.reply({
                content: `✅ Règle ${type === 'rewards' ? 'de récompense' : 'de sanction'} ${period === 'daily' ? 'quotidienne' : 'hebdomadaire'} ajoutée avec succès!\n` +
                         `Karma ${karmaThreshold > 0 ? '+' : ''}${karmaThreshold} → ${amount}€`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Erreur addKarmaRule:', error);
            if (!interaction.replied) {
                await interaction.reply({
                    content: '❌ Erreur lors de l\'ajout de la règle.',
                    ephemeral: true
                });
            }
        }
    },

    async addAdvancedKarmaRule(interaction, karmaType, ruleData) {
        try {
            if (isNaN(ruleData.karmaThreshold)) {
                await interaction.reply({
                    content: '❌ Veuillez entrer un seuil de karma valide.',
                    ephemeral: true
                });
                return;
            }

            const [period, type] = karmaType.split('_');
            const guildId = interaction.guild.id;
            const karmaPath = path.join('./data', 'karma.json');
            let karmaData = {};
            
            if (fs.existsSync(karmaPath)) {
                karmaData = JSON.parse(fs.readFileSync(karmaPath, 'utf8'));
            }

            if (!karmaData[guildId]) {
                karmaData[guildId] = {
                    daily: { rewards: [], sanctions: [] },
                    weekly: { rewards: [], sanctions: [] },
                    monthly: { rewards: [], sanctions: [] }
                };
            }

            if (!karmaData[guildId][period]) {
                karmaData[guildId][period] = { rewards: [], sanctions: [] };
            }

            if (!karmaData[guildId][period][type]) {
                karmaData[guildId][period][type] = [];
            }

            karmaData[guildId][period][type].push(ruleData);
            
            // Sort rules by karma threshold
            karmaData[guildId][period][type].sort((a, b) => a.karmaThreshold - b.karmaThreshold);

            fs.writeFileSync(karmaPath, JSON.stringify(karmaData, null, 2));

            let description = '';
            switch (ruleData.type) {
                case 'money':
                    description = `${ruleData.amount}€`;
                    break;
                case 'temp_role':
                    description = `Rôle <@&${ruleData.roleId}> pendant ${Math.floor(ruleData.duration/3600)}h`;
                    break;
                case 'perm_role':
                    description = `Rôle <@&${ruleData.roleId}> permanent`;
                    break;
                case 'shop_item':
                    description = `Objet: ${ruleData.itemId}`;
                    break;
            }

            await interaction.reply({
                content: `✅ Règle ${type === 'rewards' ? 'de récompense' : 'de sanction'} ${period === 'daily' ? 'quotidienne' : 'hebdomadaire'} ajoutée!\n` +
                         `Karma ${ruleData.karmaThreshold > 0 ? '+' : ''}${ruleData.karmaThreshold} → ${description}`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Erreur addAdvancedKarmaRule:', error);
            if (!interaction.replied) {
                await interaction.reply({
                    content: '❌ Erreur lors de l\'ajout de la règle.',
                    ephemeral: true
                });
            }
        }
    },

    async respondToInteraction(interaction, options) {
        try {
            console.log('Responding to interaction:', interaction.type, 'replied:', interaction.replied, 'deferred:', interaction.deferred);
            
            // Forcer toutes les réponses à être éphémères pour les commandes de config
            if (!options.ephemeral && interaction.isCommand()) {
                options.ephemeral = true;
            }
            
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply(options);
            } else if (interaction.isCommand()) {
                await interaction.reply(options);
            } else if (interaction.isButton() || interaction.isStringSelectMenu()) {
                try {
                    await interaction.update(options);
                } catch (error) {
                    console.error('Erreur update, tentative reply:', error);
                    await interaction.reply({...options, ephemeral: true});
                }
            } else {
                await interaction.reply(options);
            }
        } catch (error) {
            console.error('Erreur respondToInteraction:', error, 'Type:', interaction.type);
            if (!interaction.replied && !interaction.deferred) {
                try {
                    await interaction.reply({
                        content: '❌ Erreur lors de la réponse à l\'interaction.',
                        ephemeral: true
                    });
                } catch (e) {
                    console.error('Impossible de répondre à l\'interaction:', e);
                }
            }
        }
    },

    async createShopItem(interaction) {
        try {
            const name = interaction.fields.getTextInputValue('item_name');
            const price = parseInt(interaction.fields.getTextInputValue('item_price'));
            const description = interaction.fields.getTextInputValue('item_description') || '';
            const emoji = interaction.fields.getTextInputValue('item_emoji') || '🏆';

            if (isNaN(price) || price <= 0) {
                await interaction.reply({
                    content: '❌ Le prix doit être un nombre positif.',
                    ephemeral: true
                });
                return;
            }

            const guildId = interaction.guild.id;
            const shopPath = path.join('./data', 'shop.json');
            let shopData = {};
            
            if (fs.existsSync(shopPath)) {
                shopData = JSON.parse(fs.readFileSync(shopPath, 'utf8'));
            }

            if (!shopData[guildId]) {
                shopData[guildId] = [];
            }

            const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const newItem = {
                id: itemId,
                name: name,
                type: 'item',
                price: price,
                description: description,
                emoji: emoji,
                createdAt: new Date().toISOString(),
                createdBy: interaction.user.id
            };

            shopData[guildId].push(newItem);
            fs.writeFileSync(shopPath, JSON.stringify(shopData, null, 2));

            await interaction.reply({
                content: `✅ Objet **${name}** ajouté à la boutique pour ${price}€`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Erreur createShopItem:', error);
            if (!interaction.replied) {
                await interaction.reply({
                    content: '❌ Erreur lors de la création de l\'objet.',
                    ephemeral: true
                });
            }
        }
    },

    async handleModalSubmit(interaction) {
        try {
            if (interaction.customId.startsWith('economy_karma_')) {
                await this.handleKarmaModal(interaction);
            } else if (interaction.customId.startsWith('economy_shop_create_')) {
                await this.createShopRole(interaction);
            } else if (interaction.customId === 'economy_daily_amount_modal') {
                await this.updateDailyAmount(interaction);
            } else if (interaction.customId === 'economy_message_amount_modal') {
                await this.updateMessageAmount(interaction);
            } else if (interaction.customId === 'economy_message_cooldown_modal') {
                await this.updateMessageCooldown(interaction);
            } else {
                console.log('Unknown modal submission:', interaction.customId);
            }
        } catch (error) {
            console.error('Error in handleModalSubmit:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Erreur lors du traitement du formulaire.',
                    ephemeral: true
                });
            }
        }
    },

    async showDailyAmountModal(interaction) {
        try {
            const modal = new ModalBuilder()
                .setCustomId('economy_daily_amount_modal')
                .setTitle('€ Modifier le Montant Daily');

            const amountInput = new TextInputBuilder()
                .setCustomId('daily_amount')
                .setLabel('Nouveau montant quotidien')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Ex: 150')
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(amountInput));
            await interaction.showModal(modal);
        } catch (error) {
            console.error('Erreur showDailyAmountModal:', error);
        }
    },

    async updateDailyAmount(interaction) {
        try {
            const guildId = interaction.guild.id;
            const newAmount = parseInt(interaction.fields.getTextInputValue('daily_amount'));

            if (isNaN(newAmount) || newAmount < 1) {
                await interaction.reply({
                    content: '❌ Montant invalide. Veuillez entrer un nombre positif.',
                    ephemeral: true
                });
                return;
            }

            const dailyPath = path.join('./data', 'daily.json');
            let dailyConfig = {};
            
            if (fs.existsSync(dailyPath)) {
                dailyConfig = JSON.parse(fs.readFileSync(dailyPath, 'utf8'));
            }

            if (!dailyConfig[guildId]) {
                dailyConfig[guildId] = { amount: 100, enabled: true };
            }

            dailyConfig[guildId].amount = newAmount;
            fs.writeFileSync(dailyPath, JSON.stringify(dailyConfig, null, 2));

            await interaction.reply({
                content: `✅ Montant daily mis à jour : **${newAmount}€** par jour`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Erreur updateDailyAmount:', error);
        }
    },

    async toggleDaily(interaction) {
        try {
            const guildId = interaction.guild.id;
            const dailyPath = path.join('./data', 'daily.json');
            let dailyConfig = {};
            
            if (fs.existsSync(dailyPath)) {
                dailyConfig = JSON.parse(fs.readFileSync(dailyPath, 'utf8'));
            }

            if (!dailyConfig[guildId]) {
                dailyConfig[guildId] = { amount: 100, enabled: true };
            }

            dailyConfig[guildId].enabled = !dailyConfig[guildId].enabled;
            fs.writeFileSync(dailyPath, JSON.stringify(dailyConfig, null, 2));

            await this.respondToInteraction(interaction, {
                content: `✅ Daily ${dailyConfig[guildId].enabled ? '🟢 activé' : '🔴 désactivé'}`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Erreur toggleDaily:', error);
            await this.respondToInteraction(interaction, {
                content: '❌ Erreur lors de la modification du daily.',
                ephemeral: true
            });
        }
    },

    async showDailyConfig(interaction) {
        try {
            const guildId = interaction.guild.id;
            const dailyPath = path.join('./data', 'daily.json');
            let dailyConfig = {};
            
            if (fs.existsSync(dailyPath)) {
                dailyConfig = JSON.parse(fs.readFileSync(dailyPath, 'utf8'));
            }

            const guildDaily = dailyConfig[guildId] || { amount: 100, enabled: true };

            const embed = new EmbedBuilder()
                .setColor('#ffd700')
                .setTitle('🎁 Configuration Daily')
                .setDescription('Configurez la récompense quotidienne pour ce serveur')
                .addFields(
                    {
                        name: '💶 Montant Actuel',
                        value: `${guildDaily.amount}€`,
                        inline: true
                    },
                    {
                        name: '⚡ Statut',
                        value: guildDaily.enabled ? '🟢 Activé' : '🔴 Désactivé',
                        inline: true
                    },
                    {
                        name: '📋 Informations',
                        value: 'Les utilisateurs peuvent réclamer cette récompense une fois par jour avec la commande `/daily`',
                        inline: false
                    }
                );

            const components = [
                this.getNavigationMenu(),
                new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('economy_daily_config')
                            .setPlaceholder('€ Gérer la configuration daily')
                            .addOptions([
                                {
                                    label: 'Modifier le montant',
                                    description: `Actuel: ${guildDaily.amount}€`,
                                    value: 'amount',
                                    emoji: '💰'
                                },
                                {
                                    label: guildDaily.enabled ? 'Désactiver le daily' : 'Activer le daily',
                                    description: `Statut: ${guildDaily.enabled ? 'Activé' : 'Désactivé'}`,
                                    value: 'toggle',
                                    emoji: guildDaily.enabled ? '🔴' : '🟢'
                                }
                            ])
                    )
            ];

            await this.respondToInteraction(interaction, {
                embeds: [embed],
                components: components
            });
        } catch (error) {
            console.error('Erreur showDailyConfig:', error);
        }
    },

    async showMessageRewardsConfig(interaction) {
        try {
            const guildId = interaction.guild.id;
            const messagePath = path.join('./data', 'message_rewards.json');
            let messageConfig = {};
            
            if (fs.existsSync(messagePath)) {
                messageConfig = JSON.parse(fs.readFileSync(messagePath, 'utf8'));
            }

            const guildMessageConfig = messageConfig[guildId] || { enabled: false, amount: 1, cooldown: 60 };

            const embed = new EmbedBuilder()
                .setColor('#00d4aa')
                .setTitle('💬 Configuration Récompenses Messages')
                .setDescription('Configurez les gains automatiques d\'argent quand les membres écrivent des messages')
                .addFields(
                    {
                        name: '⚡ Statut',
                        value: guildMessageConfig.enabled ? '🟢 Activé' : '🔴 Désactivé',
                        inline: true
                    },
                    {
                        name: '💶 Gain par Message',
                        value: `${guildMessageConfig.amount}€`,
                        inline: true
                    },
                    {
                        name: '⏰ Cooldown',
                        value: `${guildMessageConfig.cooldown} seconde(s)`,
                        inline: true
                    },
                    {
                        name: '📋 Comment ça marche',
                        value: 'Quand un membre écrit un message (hors bots), il gagne automatiquement de l\'argent après le cooldown',
                        inline: false
                    }
                );

            const components = [
                this.getNavigationMenu(),
                new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('economy_message_rewards_config')
                            .setPlaceholder('€ Gérer les récompenses de messages')
                            .addOptions([
                                {
                                    label: guildMessageConfig.enabled ? 'Désactiver les récompenses' : 'Activer les récompenses',
                                    description: `Statut: ${guildMessageConfig.enabled ? 'Activé' : 'Désactivé'}`,
                                    value: 'toggle',
                                    emoji: guildMessageConfig.enabled ? '🔴' : '🟢'
                                },
                                {
                                    label: 'Modifier le montant',
                                    description: `Actuel: ${guildMessageConfig.amount}€`,
                                    value: 'amount',
                                    emoji: '💰'
                                },
                                {
                                    label: 'Modifier le cooldown',
                                    description: `Actuel: ${guildMessageConfig.cooldown} seconde(s)`,
                                    value: 'cooldown',
                                    emoji: '⏰'
                                }
                            ])
                    )
            ];

            await this.respondToInteraction(interaction, {
                embeds: [embed],
                components: components
            });
        } catch (error) {
            console.error('Erreur showMessageRewardsConfig:', error);
        }
    },

    async toggleMessageRewards(interaction) {
        try {
            const guildId = interaction.guild.id;
            const messagePath = path.join('./data', 'message_rewards.json');
            let messageConfig = {};
            
            if (fs.existsSync(messagePath)) {
                messageConfig = JSON.parse(fs.readFileSync(messagePath, 'utf8'));
            }

            if (!messageConfig[guildId]) {
                messageConfig[guildId] = { enabled: false, amount: 1, cooldown: 60 };
            }

            messageConfig[guildId].enabled = !messageConfig[guildId].enabled;
            fs.writeFileSync(messagePath, JSON.stringify(messageConfig, null, 2));

            await this.respondToInteraction(interaction, {
                content: `✅ Récompenses messages ${messageConfig[guildId].enabled ? '🟢 activées' : '🔴 désactivées'}`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Erreur toggleMessageRewards:', error);
            await this.respondToInteraction(interaction, {
                content: '❌ Erreur lors de la modification des récompenses.',
                ephemeral: true
            });
        }
    },

    async showMessageAmountModal(interaction) {
        try {
            const modal = new ModalBuilder()
                .setCustomId('economy_message_amount_modal')
                .setTitle('€ Modifier le Montant par Message');

            const amountInput = new TextInputBuilder()
                .setCustomId('message_amount')
                .setLabel('Gain par message (en euros)')
                .setStyle(TextInputStyle.Short)
                .setMinLength(1)
                .setMaxLength(10)
                .setPlaceholder('1')
                .setRequired(true);

            const firstRow = new ActionRowBuilder().addComponents(amountInput);
            modal.addComponents(firstRow);

            await interaction.showModal(modal);
        } catch (error) {
            console.error('Erreur showMessageAmountModal:', error);
            await this.respondToInteraction(interaction, {
                content: '❌ Erreur lors de l\'ouverture du modal.',
                ephemeral: true
            });
        }
    },

    async showMessageCooldownModal(interaction) {
        try {
            const modal = new ModalBuilder()
                .setCustomId('economy_message_cooldown_modal')
                .setTitle('⏰ Modifier le Cooldown Messages');

            const cooldownInput = new TextInputBuilder()
                .setCustomId('message_cooldown')
                .setLabel('Cooldown entre récompenses (en secondes)')
                .setStyle(TextInputStyle.Short)
                .setMinLength(1)
                .setMaxLength(10)
                .setPlaceholder('60')
                .setRequired(true);

            const firstRow = new ActionRowBuilder().addComponents(cooldownInput);
            modal.addComponents(firstRow);

            await interaction.showModal(modal);
        } catch (error) {
            console.error('Erreur showMessageCooldownModal:', error);
            await this.respondToInteraction(interaction, {
                content: '❌ Erreur lors de l\'ouverture du modal.',
                ephemeral: true
            });
        }
    },

    async updateMessageAmount(interaction) {
        try {
            const newAmount = parseInt(interaction.fields.getTextInputValue('message_amount'));
            
            if (isNaN(newAmount) || newAmount < 0) {
                await interaction.reply({
                    content: '❌ Le montant doit être un nombre positif ou zéro.',
                    ephemeral: true
                });
                return;
            }

            const guildId = interaction.guild.id;
            const messagePath = path.join('./data', 'message_rewards.json');
            let messageConfig = {};
            
            if (fs.existsSync(messagePath)) {
                messageConfig = JSON.parse(fs.readFileSync(messagePath, 'utf8'));
            }

            if (!messageConfig[guildId]) {
                messageConfig[guildId] = { enabled: false, amount: 1, cooldown: 60 };
            }

            messageConfig[guildId].amount = newAmount;
            fs.writeFileSync(messagePath, JSON.stringify(messageConfig, null, 2));

            await interaction.reply({
                content: `✅ Montant par message mis à jour : **${newAmount}€**`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Erreur updateMessageAmount:', error);
        }
    },

    async updateMessageCooldown(interaction) {
        try {
            const newCooldown = parseInt(interaction.fields.getTextInputValue('message_cooldown'));
            
            if (isNaN(newCooldown) || newCooldown < 0) {
                await interaction.reply({
                    content: '❌ Le cooldown doit être un nombre positif ou zéro (en secondes).',
                    ephemeral: true
                });
                return;
            }

            const guildId = interaction.guild.id;
            const messagePath = path.join('./data', 'message_rewards.json');
            let messageConfig = {};
            
            if (fs.existsSync(messagePath)) {
                messageConfig = JSON.parse(fs.readFileSync(messagePath, 'utf8'));
            }

            if (!messageConfig[guildId]) {
                messageConfig[guildId] = { enabled: false, amount: 1, cooldown: 60 };
            }

            messageConfig[guildId].cooldown = newCooldown;
            fs.writeFileSync(messagePath, JSON.stringify(messageConfig, null, 2));

            await interaction.reply({
                content: `✅ Cooldown messages mis à jour : **${newCooldown}** seconde(s)`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Erreur updateMessageCooldown:', error);
        }
    },

    async createShopRole(interaction) {
        try {
            const customId = interaction.customId;
            const parts = customId.split('_');
            // For temp_role: economy_shop_create_temp_role_ROLEID
            // For perm_role: economy_shop_create_perm_role_ROLEID
            const itemType = parts[3] + '_' + parts[4]; // temp_role or perm_role
            const roleId = parts[5]; // The actual role ID
            
            console.log('Modal customId:', customId);
            console.log('Parsed parts:', parts);
            console.log('ItemType:', itemType, 'RoleId:', roleId);

            const price = parseInt(interaction.fields.getTextInputValue('role_price'));
            const description = interaction.fields.getTextInputValue('role_description') || '';
            
            let duration = null;
            if (itemType === 'temp_role') {
                duration = parseInt(interaction.fields.getTextInputValue('role_duration')) * 3600; // Convert to seconds
                if (isNaN(duration) || duration <= 0) {
                    await interaction.reply({
                        content: '❌ La durée doit être un nombre positif d\'heures.',
                        ephemeral: true
                    });
                    return;
                }
            }

            if (isNaN(price) || price <= 0) {
                await interaction.reply({
                    content: '❌ Le prix doit être un nombre positif.',
                    ephemeral: true
                });
                return;
            }

            console.log('Looking for role ID:', roleId, 'in guild:', interaction.guild.id);
            const role = interaction.guild.roles.cache.get(roleId);
            if (!role) {
                console.error('Role not found in cache. Available roles:', Array.from(interaction.guild.roles.cache.keys()));
                await interaction.reply({
                    content: `❌ Rôle introuvable (ID: ${roleId}). Vérifiez que le rôle existe toujours.`,
                    ephemeral: true
                });
                return;
            }
            console.log('Role found:', role.name);

            const guildId = interaction.guild.id;
            const shopPath = path.join('./data', 'shop.json');
            let shopData = {};
            
            if (fs.existsSync(shopPath)) {
                shopData = JSON.parse(fs.readFileSync(shopPath, 'utf8'));
            }

            if (!shopData[guildId]) {
                shopData[guildId] = [];
            }

            // Check if role already exists in shop
            const existingRole = shopData[guildId].find(item => 
                (item.type === 'temp_role' || item.type === 'perm_role') && item.roleId === roleId
            );

            if (existingRole) {
                await interaction.reply({
                    content: `❌ Le rôle **${role.name}** est déjà dans la boutique.`,
                    ephemeral: true
                });
                return;
            }

            const itemId = `role_${itemType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const newItem = {
                id: itemId,
                name: role.name,
                type: itemType,
                price: price,
                description: description || `${itemType === 'temp_role' ? 'Rôle temporaire' : 'Rôle permanent'} - ${role.name}`,
                roleId: roleId,
                createdAt: new Date().toISOString(),
                createdBy: interaction.user.id
            };

            if (duration) {
                newItem.duration = duration;
            }

            shopData[guildId].push(newItem);
            fs.writeFileSync(shopPath, JSON.stringify(shopData, null, 2));

            const durationText = itemType === 'temp_role' ? ` (${Math.floor(duration/3600)}h)` : ' (permanent)';
            
            await interaction.reply({
                content: `✅ Rôle **${role.name}** ajouté à la boutique pour ${price}€${durationText}`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Erreur createShopRole:', error);
            if (!interaction.replied) {
                await interaction.reply({
                    content: '❌ Erreur lors de la création du rôle boutique.',
                    ephemeral: true
                });
            }
        }
    }
};
