const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const economyManager = require('../utils/economyManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ajoutkarma')
        .setDescription('👑 Ajouter du karma à un membre (Admin seulement)')
        .addUserOption(option =>
            option.setName('membre')
                .setDescription('Le membre à qui ajouter du karma')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type de karma à ajouter')
                .setRequired(true)
                .addChoices(
                    { name: '😇 Bon Karma', value: 'good' },
                    { name: '😈 Mauvais Karma', value: 'bad' }
                ))
        .addIntegerOption(option =>
            option.setName('montant')
                .setDescription('Montant de karma à ajouter')
                .setRequired(true)
                .setMinValue(1))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            // Check admin permissions
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                await interaction.reply({
                    content: '❌ Seuls les administrateurs peuvent utiliser cette commande.',
                    ephemeral: true
                });
                return;
            }

            const targetUser = interaction.options.getUser('membre');
            const karmaType = interaction.options.getString('type');
            const amount = interaction.options.getInteger('montant');
            const guildId = interaction.guild.id;

            // Get or create user
            const userStats = await economyManager.getUserStats(targetUser.id, guildId);
            
            // Add karma
            if (karmaType === 'good') {
                userStats.user.karma_good += amount;
            } else {
                userStats.user.karma_bad += amount;
            }
            
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

            const karmaEmoji = karmaType === 'good' ? '😇' : '😈';
            const karmaName = karmaType === 'good' ? 'bon karma' : 'mauvais karma';
            const newKarmaValue = karmaType === 'good' ? userStats.user.karma_good : userStats.user.karma_bad;

            await interaction.reply({
                content: `✅ **${amount}** ${karmaName} ${karmaEmoji} ajouté à ${targetUser.displayName}\n` +
                         `⚖️ Nouveau ${karmaName}: **${newKarmaValue}**\n` +
                         `📊 Karma net: **${userStats.user.karma_good - userStats.user.karma_bad}**`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Erreur ajoutkarma:', error);
            await interaction.reply({
                content: '❌ Une erreur s\'est produite lors de l\'ajout de karma.',
                ephemeral: true
            });
        }
    }
};