const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const economyManager = require('../utils/economyManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('boutique')
        .setDescription('🛒 Accédez à la boutique virtuelle du serveur'),

    async execute(interaction) {
        try {
            await this.showShop(interaction);
        } catch (error) {
            console.error('Erreur commande boutique:', error);
            await interaction.reply({
                content: '❌ Une erreur s\'est produite lors de l\'affichage de la boutique.',
                ephemeral: true
            });
        }
    },

    async handleButtonInteraction(interaction) {
        const action = interaction.customId.replace('economy_', '');
        
        if (action === 'shop') {
            await this.showShop(interaction);
        }
    },

    async handleSelectMenuInteraction(interaction) {
        try {
            if (interaction.customId === 'economy_shop_purchase') {
                const itemId = interaction.values[0];
                await this.purchaseItem(interaction, itemId);
            }
        } catch (error) {
            console.error('Erreur handleSelectMenuInteraction:', error);
        }
    },

    async purchaseItem(interaction, itemId) {
        try {
            await interaction.deferReply();

            const guildId = interaction.guild.id;
            const userId = interaction.user.id;

            // Load shop data
            const fs = require('fs');
            const path = require('path');
            const shopPath = path.join('./data', 'shop.json');
            let shopData = {};
            
            if (fs.existsSync(shopPath)) {
                shopData = JSON.parse(fs.readFileSync(shopPath, 'utf8'));
            }

            const guildShop = shopData[guildId] || [];
            const item = guildShop.find(i => i.id === itemId);

            if (!item) {
                await interaction.editReply({
                    content: '❌ Objet introuvable dans la boutique.'
                });
                return;
            }

            // Get user stats
            const userStats = await economyManager.getUserStats(userId, guildId);
            const user = userStats.user;

            if (user.balance < item.price) {
                await interaction.editReply({
                    content: `❌ Solde insuffisant ! Il vous faut ${item.price}€ mais vous n'avez que ${user.balance}€.`
                });
                return;
            }

            // Deduct money using economyManager's consistent format
            const userData = economyManager.loadUsers();
            const userKey = `${guildId}_${userId}`;
            
            if (!userData[userKey]) {
                userData[userKey] = { 
                    id: userId,
                    guildId: guildId,
                    balance: 0, 
                    karma_good: 0, 
                    karma_bad: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
            }

            userData[userKey].balance -= item.price;
            userData[userKey].updatedAt = new Date().toISOString();
            economyManager.saveUsers(userData);
            
            console.log(`Deducted ${item.price} from user ${userId}. New balance: ${userData[userKey].balance}`);

            // Handle role items
            if (item.type === 'temp_role' || item.type === 'perm_role') {
                const role = interaction.guild.roles.cache.get(item.roleId);
                if (role) {
                    try {
                        await interaction.member.roles.add(role);
                        
                        // For temporary roles, set a timer
                        if (item.type === 'temp_role' && item.duration) {
                            setTimeout(async () => {
                                try {
                                    const member = await interaction.guild.members.fetch(userId);
                                    if (member && member.roles.cache.has(item.roleId)) {
                                        await member.roles.remove(role);
                                    }
                                } catch (error) {
                                    console.error('Erreur suppression rôle temporaire:', error);
                                }
                            }, item.duration * 1000);
                        }
                    } catch (error) {
                        console.error('Erreur ajout rôle:', error);
                        // Refund money
                        userData[userKey].balance += item.price;
                        userData[userKey].updatedAt = new Date().toISOString();
                        economyManager.saveUsers(userData);
                        
                        await interaction.editReply({
                            content: '❌ Impossible d\'attribuer le rôle. Remboursement effectué.'
                        });
                        return;
                    }
                }
            }

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Achat Réussi !')
                .setDescription(`Vous avez acheté **${item.name}** pour ${item.price}€`)
                .addFields({
                    name: '€ Nouveau Solde',
                    value: `${userData[userKey].balance} €`,
                    inline: true
                });

            if (item.type === 'temp_role') {
                const hours = Math.floor(item.duration / 3600);
                embed.addFields({
                    name: '⏰ Durée',
                    value: `${hours} heures`,
                    inline: true
                });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur purchaseItem:', error);
            await interaction.editReply({
                content: '❌ Erreur lors de l\'achat.'
            });
        }
    },




    async showShop(interaction) {
        try {
            if (!interaction.deferred && !interaction.replied) {
                await interaction.deferReply({ ephemeral: true });
            }

            const guildId = interaction.guild.id;
            const userId = interaction.user.id;

            // Get user stats for balance check
            const userStats = await economyManager.getUserStats(userId, guildId);

            // Load shop data
            const fs = require('fs');
            const path = require('path');
            const shopPath = path.join('./data', 'shop.json');
            let shopData = {};
            
            if (fs.existsSync(shopPath)) {
                shopData = JSON.parse(fs.readFileSync(shopPath, 'utf8'));
            }

            const guildShop = shopData[guildId] || [];

            const embed = new EmbedBuilder()
                .setColor('#00AAFF')
                .setTitle('🛒 Boutique Virtuelle')
                .setDescription(`€ Votre solde: **${userStats.user.balance}** €`);

            if (guildShop.length === 0) {
                embed.addFields({
                    name: '📦 Boutique Vide',
                    value: 'Aucun objet disponible. Les administrateurs peuvent ajouter des objets via `/configéconomie`.',
                    inline: false
                });
            } else {
                let itemList = '';
                let tempRoleList = '';
                let permRoleList = '';

                for (const item of guildShop) {
                    const affordable = userStats.user.balance >= item.price ? '✅' : '❌';
                    const line = `${affordable} **${item.name}** - ${item.price}€\n${item.description}\n\n`;

                    if (item.type === 'item') {
                        itemList += line;
                    } else if (item.type === 'temp_role') {
                        const hours = Math.floor(item.duration / 3600);
                        tempRoleList += `${affordable} **${item.name}** (${hours}h) - ${item.price}€\n${item.description}\n\n`;
                    } else if (item.type === 'perm_role') {
                        permRoleList += line;
                    }
                }

                if (itemList) {
                    embed.addFields({
                        name: '🏆 Objets Virtuels',
                        value: itemList,
                        inline: false
                    });
                }

                if (tempRoleList) {
                    embed.addFields({
                        name: '👤 Rôles Temporaires',
                        value: tempRoleList,
                        inline: false
                    });
                }

                if (permRoleList) {
                    embed.addFields({
                        name: '⭐ Rôles Permanents',
                        value: permRoleList,
                        inline: false
                    });
                }

                embed.setFooter({ text: 'Utilisez les boutons ci-dessous pour acheter des objets' });
            }

            // Create purchase buttons if items exist
            const components = [];
            if (guildShop.length > 0) {
                const purchaseOptions = guildShop.map(item => ({
                    label: `${item.name} (${item.price}€)`,
                    description: item.description.length > 50 ? item.description.substring(0, 50) + '...' : item.description,
                    value: item.id,
                    emoji: item.emoji || (item.type === 'item' ? '🏆' : item.type === 'temp_role' ? '👤' : '⭐')
                }));

                components.push(
                    new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId('economy_shop_purchase')
                                .setPlaceholder('💳 Acheter un objet')
                                .addOptions(purchaseOptions.slice(0, 25)) // Discord limit
                        )
                );
            }

            await interaction.editReply({ 
                embeds: [embed],
                components: components
            });

        } catch (error) {
            console.error('Erreur showShop:', error);
            await interaction.editReply({
                content: '❌ Une erreur s\'est produite lors de l\'affichage de la boutique.'
            });
        }
    }
};