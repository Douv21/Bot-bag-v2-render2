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
                    flags: 64
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
                    flags: 64
                });
            }
        }
    },

    async handleInteraction(interaction) {
        try {
            // Vérifier les permissions pour toutes les interactions
            const staffCommand = interaction.client.commands.get('staff');
            if (!staffCommand || !staffCommand.hasStaffPermission(interaction.member, interaction.guild.id)) {
                return await interaction.reply({
                    content: '❌ Vous devez être administrateur ou avoir un rôle staff pour utiliser cette commande.',
                    flags: 64
                });
            }

            if (interaction.isButton()) {
                await this.handleButtonInteraction(interaction);
            } else if (interaction.isStringSelectMenu()) {
                await this.handleSelectMenuInteraction(interaction);
            } else if (interaction.isModalSubmit()) {
                await this.handleModalSubmit(interaction);
            } else if (interaction.isRoleSelectMenu()) {
                await this.handleRoleSelectMenuInteraction(interaction);
            }
        } catch (error) {
            console.error('Erreur handleInteraction configeconomie:', error);
            await this.safeReply(interaction, '❌ Erreur lors du traitement de l\'interaction.');
        }
    },

    async handleSelectMenuInteraction(interaction) {
        try {
            const customId = interaction.customId;
            const value = interaction.values[0];
            
            console.log('Select menu interaction:', customId, 'value:', value);
            
            // Gérer différemment selon le type d'interaction
            if (customId === 'economy_config_menu') {
                // Defer pour les changements de page
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
                        await this.safeEditReply(interaction, '❌ Option non reconnue.');
                        break;
                }
            } else if (customId === 'economy_action_config') {
                await interaction.deferUpdate();
                await this.showActionDetails(interaction, value);
            } else if (customId === 'economy_action_settings') {
                await this.handleActionSetting(interaction, value);
            } else if (customId === 'economy_karma_config') {
                await interaction.deferUpdate();
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
                switch (value) {
                    case 'amount':
                        await this.showDailyAmountModal(interaction);
                        break;
                    case 'toggle':
                        await this.toggleDaily(interaction);
                        break;
                }
            } else if (customId === 'economy_message_rewards_config') {
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
                    await interaction.deferUpdate();
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
            } else {
                console.log('CustomId non géré:', customId);
                await this.safeReply(interaction, '❌ Cette interaction n\'est pas reconnue.');
            }
        } catch (error) {
            console.error('Erreur handleSelectMenuInteraction:', error);
            await this.safeReply(interaction, '❌ Erreur lors du traitement de la sélection.');
        }
    },

    async handleButtonInteraction(interaction) {
        try {
            const action = interaction.customId;

            switch (action) {
                case 'economy_config_actions':
                    await interaction.deferUpdate();
                    await this.showActionsConfig(interaction);
                    break;
                case 'economy_config_shop':
                    await interaction.deferUpdate();
                    await this.showShopConfig(interaction);
                    break;
                case 'economy_config_karma':
                    await interaction.deferUpdate();
                    await this.showKarmaConfig(interaction);
                    break;
                case 'economy_config_messages':
                    await interaction.deferUpdate();
                    await this.showMessageRewardsConfig(interaction);
                    break;
                case 'economy_config_back':
                    await interaction.deferUpdate();
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
                        await this.safeReply(interaction, '❌ Action de bouton non reconnue.');
                    }
                    break;
            }
        } catch (error) {
            console.error('Erreur handleButtonInteraction:', error);
            await this.safeReply(interaction, '❌ Erreur lors du traitement du bouton.');
        }
    },

    async handleRoleSelectMenuInteraction(interaction) {
        try {
            const customId = interaction.customId;
            const roleId = interaction.values[0];
            
            if (customId.startsWith('economy_shop_role_')) {
                const itemType = customId.replace('economy_shop_role_', '');
                await this.showShopRoleModal(interaction, itemType, roleId);
            } else {
                console.log('Role select menu non géré:', customId);
                await this.safeReply(interaction, '❌ Sélection de rôle non reconnue.');
            }
        } catch (error) {
            console.error('Erreur handleRoleSelectMenuInteraction:', error);
            await this.safeReply(interaction, '❌ Erreur lors du traitement de la sélection de rôle.');
        }
    },

    // Méthodes utilitaires pour gérer les réponses de manière sûre
    async safeReply(interaction, content) {
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content, flags: 64 });
            } else if (interaction.deferred) {
                await interaction.editReply({ content });
            } else {
                await interaction.followUp({ content, flags: 64 });
            }
        } catch (error) {
            console.error('Erreur safeReply:', error);
        }
    },

    async safeEditReply(interaction, content) {
        try {
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content });
            } else {
                await interaction.reply({ content, flags: 64 });
            }
        } catch (error) {
            console.error('Erreur safeEditReply:', error);
        }
    },

    async respondToInteraction(interaction, options) {
        try {
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply(options);
            } else {
                await interaction.reply({ ...options, flags: 64 });
            }
        } catch (error) {
            console.error('Erreur respondToInteraction:', error);
        }
    },

    getNavigationMenu() {
        return new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('economy_config_menu')
                    .setPlaceholder('🧭 Naviguer dans les sections')
                    .addOptions([
                        {
                            label: 'Menu Principal',
                            description: 'Retourner au menu principal',
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
    },

    async showMainEconomyConfig(interaction) {
        try {
            const embed = new EmbedBuilder()
                .setColor('#9932cc')
                .setTitle('⚙️ Configuration Économie')
                .setDescription('Configurez le système d\'économie complet avec karma\n\n**Utilisation :**\n• Utilisez le menu déroulant ci-dessous\n• Ou `/configeconomie actions` pour accéder directement à une section')
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

            const row = this.getNavigationMenu();

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
            con