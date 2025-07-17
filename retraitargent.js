const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const economyManager = require('../utils/economyManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('retraitargent')
        .setDescription('👑 Retirer de l\'argent à un membre (Admin seulement)')
        .addUserOption(option =>
            option.setName('membre')
                .setDescription('Le membre à qui retirer de l\'argent')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('montant')
                .setDescription('Montant à retirer')
                .setRequired(true)
                .setMinValue(1))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            // Check admin permissions
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                await interaction.reply({
                    content: '❌ Seuls les administrateurs peuvent utiliser cette commande.',
                    flags: 64
                });
                return;
            }

            const targetUser = interaction.options.getUser('membre');
            const amount = interaction.options.getInteger('montant');
            const guildId = interaction.guild.id;

            // Get or create user
            const userStats = await economyManager.getUserStats(targetUser.id, guildId);
            
            // Check if user has enough money
            if (userStats.user.balance < amount) {
                await interaction.reply({
                    content: `❌ ${targetUser.displayName} n'a que **${userStats.user.balance}** €.\n` +
                             `Impossible de retirer **${amount}** €.`,
                    flags: 64
                });
                return;
            }
            
            // Remove money
            userStats.user.balance -= amount;
            
            // Save to file
            const fs = require('fs');
            const path = require('path');
            const usersPath = path.join('./data', 'users.json');
            let usersData = {};
            
            if (fs.existsSync(usersPath)) {
                usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
            }

            const userKey = `${guildId}_${targetUser.id}`;
            usersData[userKey] = userStats.user;
            fs.writeFileSync(usersPath, JSON.stringify(usersData, null, 2));

            await interaction.reply({
                content: `✅ **${amount}** € retirées à ${targetUser.displayName}\n` +
                         `€ Nouveau solde: **${userStats.user.balance}** €`,
                flags: 64
            });

        } catch (error) {
            console.error('Erreur retraitargent:', error);
            await interaction.reply({
                content: '❌ Une erreur s\'est produite lors du retrait d\'argent.',
                flags: 64
            });
        }
    }
};