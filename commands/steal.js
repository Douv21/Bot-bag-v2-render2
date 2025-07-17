const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const economyManager = require('../utils/economyManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('voler')
        .setDescription('😈 Tenter de voler de l\'argent (mauvaise action)')
        .addUserOption(option =>
            option.setName('cible')
                .setDescription('Membre à voler (optionnel - sinon cible aléatoire)')
                .setRequired(false)),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const userId = interaction.user.id;
            const guildId = interaction.guild.id;
            const targetUser = interaction.options.getUser('cible');

            // Vérifier le cooldown
            const cooldownCheck = await economyManager.checkCooldown(userId, guildId, 'steal');
            if (!cooldownCheck.canExecute) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('⏰ Cooldown Actif')
                    .setDescription(`Vous devez attendre encore **${Math.ceil(cooldownCheck.remainingTime / 60)} minutes** avant de pouvoir voler à nouveau.`);

                return await interaction.editReply({ embeds: [embed] });
            }

            // Obtenir les stats de l'utilisateur
            const userStats = await economyManager.getUserStats(userId, guildId);
            
            // Déterminer la cible
            let victim = null;
            let victimStats = null;
            
            if (targetUser) {
                // Vérifications pour la cible spécifiée
                if (targetUser.id === userId) {
                    const embed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('❌ Impossible')
                        .setDescription('Vous ne pouvez pas vous voler vous-même !');
                    return await interaction.editReply({ embeds: [embed] });
                }
                
                if (targetUser.bot) {
                    const embed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('❌ Impossible')
                        .setDescription('Vous ne pouvez pas voler un bot !');
                    return await interaction.editReply({ embeds: [embed] });
                }
                
                victim = targetUser;
                victimStats = await economyManager.getUserStats(targetUser.id, guildId);
                
                if (victimStats.user.balance < 10) {
                    const embed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('💸 Cible Trop Pauvre')
                        .setDescription(`${targetUser.displayName} n'a que **${victimStats.user.balance}€**. Il faut au moins 10€ pour être volé.`);
                    return await interaction.editReply({ embeds: [embed] });
                }
            } else {
                // Sélection aléatoire d'un membre avec de l'argent
                const fs = require('fs');
                const path = require('path');
                const usersPath = path.join('./data', 'users.json');
                
                if (fs.existsSync(usersPath)) {
                    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
                    const potentialVictims = [];
                    
                    // Chercher tous les utilisateurs du serveur avec assez d'argent
                    for (const [userKey, userData] of Object.entries(usersData)) {
                        const [userGuildId, userUserId] = userKey.split('_');
                        if (userGuildId === guildId && userUserId !== userId && userData.balance >= 10) {
                            potentialVictims.push({ id: userUserId, balance: userData.balance });
                        }
                    }
                    
                    if (potentialVictims.length === 0) {
                        const embed = new EmbedBuilder()
                            .setColor('#ff0000')
                            .setTitle('💸 Aucune Cible')
                            .setDescription('Aucun membre du serveur n\'a assez d\'argent pour être volé (minimum 10€).');
                        return await interaction.editReply({ embeds: [embed] });
                    }
                    
                    // Sélectionner une victime aléatoire
                    const randomVictim = potentialVictims[Math.floor(Math.random() * potentialVictims.length)];
                    try {
                        victim = await interaction.guild.members.fetch(randomVictim.id);
                        if (victim) {
                            victim = victim.user;
                            victimStats = await economyManager.getUserStats(victim.id, guildId);
                        }
                    } catch (error) {
                        console.error('Erreur récupération membre aléatoire:', error);
                    }
                }
                
                if (!victim) {
                    const embed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('💸 Aucune Cible')
                        .setDescription('Impossible de trouver une cible valide sur le serveur.');
                    return await interaction.editReply({ embeds: [embed] });
                }
            }

            // Calculer le succès/échec (70% de réussite)
            const success = Math.random() < 0.7;
            
            let amount = 0;
            let description = '';
            
            if (success) {
                // Vol réussi - prendre 10-30% de l'argent de la victime
                const percentage = Math.random() * 0.2 + 0.1; // 10-30%
                amount = Math.floor(victimStats.user.balance * percentage);
                amount = Math.max(5, Math.min(amount, 100)); // Entre 5 et 100€
                
                // Transférer l'argent
                userStats.user.balance += amount;
                victimStats.user.balance -= amount;
                
                description = `Vous avez volé **${amount}€** à ${victim.displayName} sans vous faire prendre !`;
            } else {
                // Vol échoué - perdre 20-50€
                amount = Math.floor(Math.random() * 31) + 20; // 20-50€
                amount = Math.min(amount, userStats.user.balance); // Ne pas dépasser le solde
                
                userStats.user.balance -= amount;
                description = `Vous vous êtes fait prendre en volant ${victim.displayName} ! Vous perdez **${amount}€** d'amende.`;
            }

            // Appliquer les changements de karma
            userStats.user.karma_bad += 1;
            if (userStats.user.karma_good > 0) {
                userStats.user.karma_good -= 1;
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
            const victimKey = `${guildId}_${victim.id}`;
            
            usersData[userKey] = userStats.user;
            usersData[victimKey] = victimStats.user;
            
            fs.writeFileSync(usersPath, JSON.stringify(usersData, null, 2));

            // Définir le cooldown
            await economyManager.setCooldown(userId, guildId, 'steal', 5400); // 1h30

            const embed = new EmbedBuilder()
                .setColor(success ? '#ff6600' : '#ff0000')
                .setTitle(success ? '😈 Vol Réussi !' : '🚨 Vol Échoué !')
                .setDescription(description)
                .addFields(
                    {
                        name: '🎯 Cible',
                        value: victim.displayName,
                        inline: true
                    },
                    {
                        name: '💶 Résultat',
                        value: success ? `+${amount}€` : `-${amount}€`,
                        inline: true
                    },
                    {
                        name: '💶 Nouveau Solde',
                        value: `${userStats.user.balance}€`,
                        inline: true
                    },
                    {
                        name: '📊 Karma',
                        value: `😇 ${userStats.user.karma_good} | 😈 ${userStats.user.karma_bad}`,
                        inline: false
                    }
                )
                .setFooter({ text: 'Cooldown: 1h30 | 70% de chance de réussite' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur commande steal:', error);
            await interaction.editReply({
                content: '❌ Une erreur s\'est produite lors du vol.'
            });
        }
    }
};