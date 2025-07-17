const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const economyManager = require('../utils/economyManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ajoutargent')
        .setDescription('👑 Ajouter de l\'argent à un membre (Admin seulement)')
        .addUserOption(option =>
            option.setName('membre')
                .setDescription('Le membre à qui ajouter de l\'argent')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('montant')
                .setDescription('Montant à ajouter')
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
            
            // Add money
            userStats.user.balance += amount;
            
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
                content: `✅ **${amount}** € ajoutées à ${targetUser.displayName}\n` +
                         `€ Nouveau solde: **${userStats.user.balance}** €`,
                flags: 64
            });

        } catch (error) {
            console.error('Erreur ajoutargent:', error);
            await interaction.reply({
                content: '❌ Une erreur s\'est produite lors de l\'ajout d\'argent.',
                flags: 64
            });
        }
    }
};