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
                    flags: 64
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
                        flags: 64
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
                    flags: 64
                });
            }
        }
    },

    // ... reste du code identique (méthodes showMainEconomyConfig, showActionsConfig, etc.)
};
