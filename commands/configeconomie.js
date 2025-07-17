const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    PermissionFlagsBits
} = require('discord.js');
const fs = require('fs');
const path = require('path');

// ✅ Helper pour répondre avec flags:64 (équivalent ephemeral)
async function respond(interaction, options = {}) {
    try {
        if (interaction.replied || interaction.deferred) {
            return await interaction.editReply(options);
        }
        return await interaction.reply({
            ...options,
            flags: 64
        });
    } catch (error) {
        console.error('Erreur respond helper:', error);
    }
}

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
                return await respond(interaction, {
                    content: '❌ Vous devez être administrateur ou avoir un rôle staff pour utiliser cette commande.'
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
            await respond(interaction, {
                content: '❌ Erreur lors de l\'exécution de la commande.'
            });
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
            await respond(interaction, {
                content: '❌ Erreur lors du traitement de l\'interaction.'
            });
        }
    },

    async handleSelectMenuInteraction(interaction) {
        try {
            const customId = interaction.customId;
            const value = interaction.values[0];

            await interaction.deferUpdate();

            if (customId === 'economy_config_menu') {
                switch (value) {
                    case 'main': await this.showMainEconomyConfig(interaction); break;
                    case 'actions': await this.showActionsConfig(interaction); break;
                    case 'shop': await this.showShopConfig(interaction); break;
                    case 'karma': await this.showKarmaConfig(interaction); break;
                    case 'daily': await this.showDailyConfig(interaction); break;
                    case 'messages': await this.showMessageRewardsConfig(interaction); break;
                }
            }
        } catch (error) {
            console.error('Erreur handleSelectMenuInteraction:', error);
            await respond(interaction, { content: '❌ Erreur lors du traitement de la sélection.' });
        }
    },

    async handleButtonInteraction(interaction) {
        try {
            const action = interaction.customId;
            switch (action) {
                case 'economy_config_actions': await this.showActionsConfig(interaction); break;
                case 'economy_config_shop': await this.showShopConfig(interaction); break;
                case 'economy_config_karma': await this.showKarmaConfig(interaction); break;
                case 'economy_config_messages': await this.showMessageRewardsConfig(interaction); break;
                case 'economy_config_back': await this.showMainEconomyConfig(interaction); break;
                default: console.log('Bouton inconnu:', action); break;
            }
        } catch (error) {
            console.error('Erreur handleButtonInteraction:', error);
            await respond(interaction, { content: '❌ Erreur lors du traitement du bouton.' });
        }
    },

    async showMainEconomyConfig(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#9932cc')
            .setTitle('⚙️ Configuration Économie')
            .setDescription('Configurez le système complet.\n\n**Utilisation :**\n• Utilisez les boutons ci-dessous\n• Ou `/configeconomie actions`')
            .addFields(
                { name: '💼 Actions Économiques', value: 'Gérez les actions disponibles', inline: true },
                { name: '🛒 Boutique', value: 'Configurez la boutique', inline: true },
                { name: '📊 Karma', value: 'Sanctions et récompenses automatiques', inline: true },
                { name: '💬 Messages', value: 'Récompenses automatiques pour messages', inline: true }
            );

        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('economy_config_menu')
                    .setPlaceholder('📋 Sélectionnez une section à configurer')
                    .addOptions([
                        { label: 'Actions Économiques', value: 'actions', emoji: '💼' },
                        { label: 'Boutique', value: 'shop', emoji: '🛒' },
                        { label: 'Système Karma', value: 'karma', emoji: '📊' },
                        { label: 'Configuration Daily', value: 'daily', emoji: '🎁' },
                        { label: 'Récompenses Messages', value: 'messages', emoji: '💬' }
                    ])
            );

        await respond(interaction, { embeds: [embed], components: [row] });
    },

    async showActionsConfig(interaction) {
        const guildId = interaction.guild.id;
        const actionsPath = path.join('./data', 'actions.json');
        let actionsData = fs.existsSync(actionsPath) ? JSON.parse(fs.readFileSync(actionsPath, 'utf8')) : {};
        const guildActions = Object.values(actionsData).filter(a => a.guildId === guildId);

        const actionsText = guildActions.map(action => {
            const typeEmoji = action.actionType === 'good' ? '😇' : '😈';
            const statusEmoji = action.enabled !== false ? '🟢' : '🔴';
            return `${statusEmoji} ${typeEmoji} **${action.name}** - ${action.baseReward}€ (${Math.floor(action.cooldown/60)}min)`;
        }).join('\n') || 'Aucune action configurée';

        const embed = new EmbedBuilder()
            .setColor('#9932cc')
            .setTitle('💼 Gestion des Actions Économiques')
            .setDescription(actionsText);

        await respond(interaction, { embeds: [embed] });
    },

    async showShopConfig(interaction) {
        const guildId = interaction.guild.id;
        const shopPath = path.join('./data', 'shop.json');
        let shopData = fs.existsSync(shopPath) ? JSON.parse(fs.readFileSync(shopPath, 'utf8')) : {};
        const shopItems = shopData[guildId] || [];

        const embed = new EmbedBuilder()
            .setTitle('🛒 Configuration de la Boutique')
            .setDescription(`**${shopItems.length} objets** configurés dans la boutique`)
            .setColor('#00AAFF');

        if (shopItems.length > 0) {
            embed.addFields({
                name: '📦 Objets Disponibles',
                value: shopItems.slice(0, 10).map(item => `${item.name} - ${item.price}€`).join('\n')
            });
        }

        await respond(interaction, { embeds: [embed] });
    }
};
