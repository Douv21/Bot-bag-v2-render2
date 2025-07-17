const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const economyManager = require('../utils/economyManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('donner')
        .setDescription('😇 Donner de l\'argent à un membre (bonne action)')
        .addUserOption(option =>
            option.setName('membre')
                .setDescription('Membre à qui donner de l\'argent')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('montant')
                .setDescription('Montant à donner')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(1000)),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const userId = interaction.user.id;
            const guildId = interaction.guild.id;
            const targetUser = interaction.options.getUser('membre');
            const amount = interaction.options.getInteger('montant');

            // Vérifications de base
            if (targetUser.id === userId) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Impossible')
                    .setDescription('Vous ne pouvez pas vous donner de l\'argent à vous-même !');
                return await interaction.editReply({ embeds: [embed] });
            }

            if (targetUser.bot) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Impossible')
                    .setDescription('Vous ne pouvez pas donner de l\'argent à un bot !');
                return await interaction.editReply({ embeds: [embed] });
            }

            // Vérifier le cooldown
            const cooldownCheck = await economyManager.checkCooldown(userId, guildId, 'donate');
            if (!cooldownCheck.canExecute) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('⏰ Cooldown Actif')
                    .setDescription(`Vous devez attendre encore **${Math.ceil(cooldownCheck.remainingTime / 60)} minutes** avant de pouvoir faire un don à nouveau.`);

                return await interaction.editReply({ embeds: [embed] });
            }

            // Obtenir les stats des utilisateurs
            const userStats = await economyManager.getUserStats(userId, guildId);
            const targetStats = await economyManager.getUserStats(targetUser.id, guildId);

            // Vérifier que l'utilisateur a assez d'argent
            if (userStats.user.balance < amount) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('💸 Solde Insuffisant')
                    .setDescription(`Vous n'avez que **${userStats.user.balance}€**. Vous ne pouvez pas donner **${amount}€**.`);
                return await interaction.editReply({ embeds: [embed] });
            }

            // Effectuer le transfert
            userStats.user.balance -= amount;
            targetStats.user.balance += amount;

            // Appliquer les bonus de karma (bonne action)
            userStats.user.karma_good += 2; // Bonus pour la générosité
            if (userStats.user.karma_bad > 0) {
                userStats.user.karma_bad -= 1;
            }

            // Sauvegarder les données
            const fs = require('fs');
            const path = require('path');
            const usersPath = path.join('./data', 'users.json');
            let usersData = {};
            
            if (fs.existsSync(usersPath)) {
                usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
            }

            const userKey = `${guildId}_${userId}`;
            const targetKey = `${guildId}_${targetUser.id}`;
            
            usersData[userKey] = userStats.user;
            usersData[targetKey] = targetStats.user;
            
            fs.writeFileSync(usersPath, JSON.stringify(usersData, null, 2));

            // Définir le cooldown (30 minutes)
            await economyManager.setCooldown(userId, guildId, 'donate', 1800);

            const embed = new EmbedBuilder()
                .setColor('#00ff7f')
                .setTitle('💝 Don Effectué !')
                .setDescription(`Vous avez généreusement donné **${amount}€** à ${targetUser.displayName} !`)
                .addFields(
                    {
                        name: '🎯 Bénéficiaire',
                        value: targetUser.displayName,
                        inline: true
                    },
                    {
                        name: '💶 Montant Donné',
                        value: `${amount}€`,
                        inline: true
                    },
                    {
                        name: '💶 Votre Nouveau Solde',
                        value: `${userStats.user.balance}€`,
                        inline: true
                    },
                    {
                        name: '📊 Votre Karma',
                        value: `😇 ${userStats.user.karma_good} | 😈 ${userStats.user.karma_bad}`,
                        inline: false
                    }
                )
                .setFooter({ text: 'Cooldown: 30 minutes | +2😇 -1😈 | Merci pour votre générosité !' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur commande donate:', error);
            await interaction.editReply({
                content: '❌ Une erreur s\'est produite lors du don.'
            });
        }
    }
};