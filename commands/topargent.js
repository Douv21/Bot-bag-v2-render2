const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const economyManager = require('../utils/economyManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('topargent')
        .setDescription('🏆 Affiche le classement des membres les plus riches du serveur'),

    async execute(interaction) {
        try {
            await interaction.deferReply();
            console.log('Topargent command started');

            const guildId = interaction.guild.id;
            
            // Utiliser l'approche de l'ancien code mais améliorée
            const fs = require('fs');
            const path = require('path');
            const usersPath = path.join('./data', 'users.json');
            
            let memberBalances = [];
            let usersData = {};
            
            // Charger les données utilisateurs existantes
            if (fs.existsSync(usersPath)) {
                usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
            }
            
            // Utiliser seulement le cache pour éviter les timeouts
            const guild = interaction.guild;
            console.log('Using cached members only for speed');
            
            const cachedMembers = guild.members.cache.filter(member => !member.user.bot);
            console.log(`Found ${cachedMembers.size} cached members`);
            
            // Créer un Set pour éviter les doublons
            const processedUsers = new Set();
            
            // D'abord, ajouter tous les utilisateurs de la base de données
            for (const [userKey, userData] of Object.entries(usersData)) {
                const [userGuildId, userId] = userKey.split('_');
                if (userGuildId === guildId) {
                    const member = cachedMembers.get(userId);
                    if (member) {
                        // Membre trouvé dans le cache
                        memberBalances.push({
                            id: userId,
                            username: member.user.username,
                            displayName: member.displayName,
                            balance: userData.balance || 0
                        });
                    } else {
                        // Membre pas en cache mais dans la DB - essayer de récupérer le nom via Discord API
                        try {
                            const user = await guild.client.users.fetch(userId);
                            memberBalances.push({
                                id: userId,
                                username: user.username,
                                displayName: user.displayName || user.username,
                                balance: userData.balance || 0
                            });
                        } catch (error) {
                            // Si impossible de récupérer, utiliser un nom générique
                            memberBalances.push({
                                id: userId,
                                username: `Utilisateur ${userId.slice(-4)}`,
                                displayName: `Membre Absent`,
                                balance: userData.balance || 0
                            });
                        }
                    }
                    processedUsers.add(userId);
                }
            }
            
            // Ensuite, ajouter les membres en cache qui n'ont pas encore d'argent
            for (const [memberId, member] of cachedMembers) {
                if (!processedUsers.has(memberId)) {
                    memberBalances.push({
                        id: memberId,
                        username: member.user.username,
                        displayName: member.displayName,
                        balance: 0
                    });
                    processedUsers.add(memberId);
                }
            }
            
            console.log(`Total members found: ${memberBalances.length}`);
            console.log('Member balances:', memberBalances.map(m => `${m.displayName}: ${m.balance}€`));
            
            // Trier par solde décroissant
            memberBalances.sort((a, b) => b.balance - a.balance);
            
            // Prendre les 5 premiers
            const topMembers = memberBalances.slice(0, 5);
            console.log(`Showing top ${topMembers.length} members`);

            let balanceText = '';
            if (topMembers.length === 0) {
                balanceText = 'Aucun membre trouvé';
            } else {
                for (let i = 0; i < topMembers.length; i++) {
                    const user = topMembers[i];
                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
                    balanceText += `${medal} <@${user.id}> - **${user.balance}€**\n`;
                }
            }

            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('€ Top 5 Richesse du Serveur')
                .setDescription(balanceText)
                .setFooter({ text: `${topMembers.length} membres classés` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
            console.log('Topargent command completed successfully');

        } catch (error) {
            console.error('Erreur topargent:', error);
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: '❌ Une erreur s\'est produite lors de l\'affichage du classement.',
                        ephemeral: true
                    });
                } else {
                    await interaction.editReply({
                        content: '❌ Une erreur s\'est produite lors de l\'affichage du classement.'
                    });
                }
            } catch (replyError) {
                console.error('Failed to send error message:', replyError);
            }
        }
    }
};