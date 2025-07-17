const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const economyManager = require('../utils/economyManager');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('🎁 Réclamez votre récompense quotidienne'),

    async execute(interaction) {
        try {
            const userId = interaction.user.id;
            const guildId = interaction.guild.id;

            // Load daily config
            const dailyPath = path.join('./data', 'daily.json');
            let dailyConfig = {};
            if (fs.existsSync(dailyPath)) {
                dailyConfig = JSON.parse(fs.readFileSync(dailyPath, 'utf8'));
            }

            const guildDaily = dailyConfig[guildId] || { amount: 100, enabled: true };

            if (!guildDaily.enabled) {
                await interaction.reply({
                    content: '❌ La récompense quotidienne est désactivée sur ce serveur.',
                    ephemeral: true
                });
                return;
            }

            // Load user cooldowns
            const cooldownPath = path.join('./data', 'daily_cooldowns.json');
            let cooldowns = {};
            if (fs.existsSync(cooldownPath)) {
                cooldowns = JSON.parse(fs.readFileSync(cooldownPath, 'utf8'));
            }

            if (!cooldowns[guildId]) cooldowns[guildId] = {};

            const now = new Date();
            const today = now.toDateString();
            const lastClaim = cooldowns[guildId][userId];

            // Check if already claimed today
            if (lastClaim && new Date(lastClaim).toDateString() === today) {
                const tomorrow = new Date(now);
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(0, 0, 0, 0);
                
                const timeLeft = Math.ceil((tomorrow - now) / 1000 / 3600);
                
                await interaction.reply({
                    content: `⏰ Vous avez déjà réclamé votre récompense quotidienne ! Revenez dans **${timeLeft}h**.`,
                    ephemeral: true
                });
                return;
            }

            // Give daily reward
            const userData = economyManager.loadUsers();
            if (!userData[guildId]) userData[guildId] = {};
            if (!userData[guildId][userId]) {
                userData[guildId][userId] = { balance: 0, karma_good: 0, karma_bad: 0 };
            }

            userData[guildId][userId].balance += guildDaily.amount;
            economyManager.saveUsers(userData);

            // Update cooldown
            cooldowns[guildId][userId] = now.toISOString();
            fs.writeFileSync(cooldownPath, JSON.stringify(cooldowns, null, 2));

            // Calculate streak
            let streak = 1;
            if (lastClaim) {
                const lastClaimDate = new Date(lastClaim);
                const yesterday = new Date(now);
                yesterday.setDate(yesterday.getDate() - 1);
                
                if (lastClaimDate.toDateString() === yesterday.toDateString()) {
                    const streakPath = path.join('./data', 'daily_streaks.json');
                    let streaks = {};
                    if (fs.existsSync(streakPath)) {
                        streaks = JSON.parse(fs.readFileSync(streakPath, 'utf8'));
                    }
                    
                    if (!streaks[guildId]) streaks[guildId] = {};
                    streak = (streaks[guildId][userId] || 0) + 1;
                    streaks[guildId][userId] = streak;
                    fs.writeFileSync(streakPath, JSON.stringify(streaks, null, 2));
                }
            }

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('🎁 Récompense Quotidienne Réclamée !')
                .setDescription(`Vous avez reçu **${guildDaily.amount}€** !`)
                .addFields(
                    {
                        name: '💶 Nouveau Solde',
                        value: `${userData[guildId][userId].balance}€`,
                        inline: true
                    },
                    {
                        name: '🔥 Série',
                        value: `${streak} jour${streak > 1 ? 's' : ''} consécutif${streak > 1 ? 's' : ''}`,
                        inline: true
                    }
                )
                .setFooter({ text: 'Revenez demain pour continuer votre série !' })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur commande daily:', error);
            await interaction.reply({
                content: '❌ Une erreur s\'est produite lors de la réclamation de votre récompense.',
                ephemeral: true
            });
        }
    }
};