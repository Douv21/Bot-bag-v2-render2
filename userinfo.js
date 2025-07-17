const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const HolographicCardGenerator = require('../utils/cardGenerator');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Afficher les informations détaillées d\'un utilisateur')
        .addUserOption(option => 
            option.setName('membre')
                .setDescription('Le membre à analyser (vous par défaut)')
                .setRequired(false)),

    async execute(interaction) {
        try {
            // Vérifier si l'interaction est déjà répondue
            if (interaction.replied || interaction.deferred) {
                console.log('Interaction déjà traitée, abandon');
                return;
            }
            
            // Defer pour avoir le temps de générer la carte
            await interaction.deferReply();
            
            const targetUser = interaction.options.getUser('membre') || interaction.user;
            const member = await interaction.guild.members.fetch(targetUser.id);
            
            // Récupérer les données rapidement
            const userData = await this.getUserData(targetUser.id, interaction.guild.id);
            const userStats = this.getUserStats(targetUser.id, interaction.guild.id);
            
            // Calculer les valeurs karma avec la méthode unifiée (même que solde.js)
            const totalKarmaGood = Math.max(userData.karma_good || 0, userData.karmaGood || 0);
            const totalKarmaBad = Math.max(userData.karma_bad || 0, userData.karmaBad || 0);
            const karmaTotal = totalKarmaGood - totalKarmaBad;
            
            // Calculer le niveau de karma (même logique que solde.js)
            let karmaLevel = 'Neutre';
            let karmaEmoji = '⚖️';
            
            if (karmaTotal > 50) {
                karmaLevel = 'Saint';
                karmaEmoji = '😇';
            } else if (karmaTotal > 20) {
                karmaLevel = 'Très Bon';
                karmaEmoji = '😊';
            } else if (karmaTotal > 5) {
                karmaLevel = 'Bon';
                karmaEmoji = '🙂';
            } else if (karmaTotal < -50) {
                karmaLevel = 'Diabolique';
                karmaEmoji = '😈';
            } else if (karmaTotal < -20) {
                karmaLevel = 'Très Mauvais';
                karmaEmoji = '😠';
            } else if (karmaTotal < -5) {
                karmaLevel = 'Mauvais';
                karmaEmoji = '😒';
            }
            
            // Générer la carte SVG holographique
            const cardGenerator = new HolographicCardGenerator();
            const svg = cardGenerator.generateHolographicCard(targetUser, userData, userStats, member, karmaTotal);
            
            // Sauvegarder et convertir en PNG
            const filename = `holographic_card_${targetUser.id}.svg`;
            const filepath = await cardGenerator.saveCard(svg, filename);
            
            // Créer l'embed avec l'image
            const isPNG = filepath.endsWith('.png');
            const attachment = new AttachmentBuilder(filepath, { 
                name: isPNG ? 'holographic_card.png' : 'holographic_card.svg' 
            });
            
            const embed = new EmbedBuilder()
                .setTitle('🔮 Interface Holographique')
                .setDescription(`**Carte futuriste générée pour ${targetUser.username}**\nStyle HUD avec données économie actuelles`)
                .setColor(0x00ccff)
                .setImage(`attachment://${isPNG ? 'holographic_card.png' : 'holographic_card.svg'}`)
                .addFields(
                    { name: '💰 Balance', value: `**${userData.balance || 0}€**`, inline: true },
                    { name: '📊 Karma Total', value: `**${karmaTotal}** (${karmaLevel})`, inline: true },
                    { name: '💬 Messages', value: `${userStats.messageCount || 0}`, inline: true },
                    { name: '😇 Karma Bon', value: `${totalKarmaGood}`, inline: true },
                    { name: '😈 Karma Mauvais', value: `${totalKarmaBad}`, inline: true },
                    { name: '🏆 Rang', value: `Level ${karmaLevel}`, inline: true }
                )
                .setFooter({ text: 'Interface holographique • Système HUD futuriste' })
                .setTimestamp();
            
            await interaction.editReply({
                embeds: [embed],
                files: [attachment]
            });
            
            // Nettoyer le fichier temporaire après 30 secondes
            setTimeout(() => {
                try {
                    if (fs.existsSync(filepath)) {
                        fs.unlinkSync(filepath);
                    }
                } catch (e) {
                    console.log('Fichier temporaire déjà supprimé');
                }
            }, 30000);
            
        } catch (error) {
            console.error('Erreur userinfo:', error);
            
            // Gestion d'erreur robuste sans double reply
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: '❌ Erreur lors de la génération de la carte holographique.',
                        flags: 64
                    });
                } else if (interaction.deferred && !interaction.replied) {
                    await interaction.editReply({
                        content: '❌ Erreur lors de la génération de la carte holographique.'
                    });
                }
                // Si déjà replied, on ne fait rien pour éviter les erreurs
            } catch (fallbackError) {
                console.error('Erreur de fallback (ignorée):', fallbackError);
            }
        }
    },

    createQuickCard(user) {
        // Carte futuriste simple qui s'affiche instantanément
        return `\`\`\`
╔════════════════════════════════════╗
║    🔮 HOLOGRAPHIC USER INTERFACE   ║
║                                    ║
║  ◉ USER: ${user.username.toUpperCase().padEnd(20)} ◉     ║
║  ▶ ID: ${user.id.substring(0,10)}...        ║
║                                    ║
║  ▣ STATUS: [████████████] ONLINE   ║
║  ▣ ACCESS: [████████████] GRANTED  ║
║                                    ║
║  ⚡ SYSTEM SCAN COMPLETE ⚡        ║
║  📊 DATA MATRIX LOADED              ║
║                                    ║
║  Use /economie for full stats      ║
╚════════════════════════════════════╝
\`\`\`

🔹 **Interface utilisateur activée**
🔹 Utilisez \`/economie\` pour voir vos statistiques complètes
🔹 Utilisez \`/solde\` pour voir votre argent`;
    },

    async executeOld(interaction) {
        try {
            const targetUser = interaction.options.getUser('membre') || interaction.user;
            const member = await interaction.guild.members.fetch(targetUser.id);
            
            // Récupérer les données utilisateur rapidement
            const userData = await this.getUserData(targetUser.id, interaction.guild.id);
            const userStats = this.getUserStats(targetUser.id, interaction.guild.id);
            
            // Calculer les informations
            const karmaTotal = (userData.karmaGood || 0) - (userData.karmaBad || 0);
            const discriminator = targetUser.discriminator === '0' ? '0000' : targetUser.discriminator;
            
            // Créer la carte holographique futuriste
            const cardText = this.createHolographicCard(targetUser, userData, userStats, member, karmaTotal, discriminator);
            
            // Éditer avec la carte
            await interaction.editReply({ 
                content: cardText
            });

        } catch (error) {
            console.error('Erreur userinfo:', error);
            
            try {
                if (interaction.replied) {
                    await interaction.editReply({
                        content: '❌ Une erreur est survenue lors de la récupération des informations utilisateur.',
                        embeds: []
                    });
                } else {
                    await interaction.reply({
                        content: '❌ Une erreur est survenue lors de la récupération des informations utilisateur.',
                        flags: 64
                    });
                }
            } catch (followUpError) {
                console.error('Erreur lors de la gestion d\'erreur:', followUpError);
            }
        }
    },

    async getUserData(userId, guildId) {
        try {
            // Charger directement depuis le fichier utilisateurs de l'économie
            const usersPath = path.join(__dirname, '../data/users.json');
            let users = {};
            
            if (fs.existsSync(usersPath)) {
                try {
                    users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
                } catch (error) {
                    console.error('Erreur lecture users.json:', error);
                }
            }
            
            // Récupérer les données utilisateur de l'économie
            const userKey = `${guildId}_${userId}`;
            const userData = users[userKey] || { balance: 0, karmaGood: 0, karmaBad: 0 };
            
            console.log(`Données utilisateur ${userId}:`, userData);
            
            // Utiliser les champs unifiés
            const totalKarmaGood = Math.max(userData.karmaGood || 0, userData.karma_good || 0);
            const totalKarmaBad = Math.max(userData.karmaBad || 0, userData.karma_bad || 0);
            
            return {
                balance: userData.balance || 0,
                karmaGood: totalKarmaGood,
                karmaBad: totalKarmaBad
            };
        } catch (error) {
            console.error('Erreur getUserData:', error);
            return {
                balance: 0,
                karmaGood: 0,
                karmaBad: 0
            };
        }
    },

    getUserStats(userId, guildId) {
        const statsPath = path.join(__dirname, '../data/user_stats.json');
        
        let stats = {};
        if (fs.existsSync(statsPath)) {
            try {
                stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
            } catch (error) {
                console.error('Erreur lecture stats:', error);
                stats = {};
            }
        }

        // Le format correct est stats[guildId][userId]
        const userStats = stats[guildId] && stats[guildId][userId] ? stats[guildId][userId] : { messageCount: 0 };
        
        console.log(`Stats utilisateur ${userId}:`, userStats);
        return userStats;
    },

    incrementMessageCount(userId, guildId) {
        const statsPath = path.join(__dirname, '../data/user_stats.json');
        
        if (!fs.existsSync(path.dirname(statsPath))) {
            fs.mkdirSync(path.dirname(statsPath), { recursive: true });
        }

        let stats = {};
        if (fs.existsSync(statsPath)) {
            try {
                stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
            } catch (error) {
                stats = {};
            }
        }

        if (!stats[guildId]) {
            stats[guildId] = {};
        }

        if (!stats[guildId][userId]) {
            stats[guildId][userId] = {
                messageCount: 0,
                lastMessage: null
            };
        }

        stats[guildId][userId].messageCount++;
        stats[guildId][userId].lastMessage = Date.now();

        try {
            fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
        } catch (error) {
            console.error('Erreur sauvegarde stats:', error);
        }

        return stats[guildId][userId];
    },

    calculateLevel(xp) {
        // Formule simple : 1000 XP par niveau
        return Math.floor(xp / 1000) + 1;
    },

    getKarmaLevel(karmaTotal) {
        if (karmaTotal >= 100) return '👼 Saint';
        if (karmaTotal >= 50) return '😊 Bon';
        if (karmaTotal >= -50) return '😐 Neutre';
        if (karmaTotal >= -100) return '😠 Mauvais';
        return '👹 Diabolique';
    },

    createHolographicCard(user, userData, userStats, member, karmaTotal, discriminator) {
        const inscriptionDate = new Date(user.createdTimestamp).toLocaleDateString('fr-FR');
        const arriveeDate = new Date(member.joinedTimestamp).toLocaleDateString('fr-FR');
        
        // Carte holographique futuriste avec design blue-tech
        return `\`\`\`
┌═══════════════════════════════════┐
│  ▓▓▓ HOLOGRAPHIC BADGE ▓▓▓        │
│                                   │
│ ◆ ${user.username.toUpperCase().padEnd(20)} ◆    │
│ ▸ #${discriminator}                         │
│                                   │
│ ▣ STATUS: ONLINE                  │
│                                   │
│ ▣ REGISTRATION                    │
│   ${inscriptionDate}                       │
│                                   │
│ ▣ SERVER JOIN                     │
│   ${arriveeDate}                       │
│                                   │
│ ▣ MESSAGES: ${userStats.messageCount.toLocaleString().padStart(8)}          │
│ ▣ CREDITS:  ${userData.balance.toLocaleString().padStart(8)}€         │
│                                   │
│ ▣ KARMA MATRIX: ${karmaTotal.toString().padStart(4)}              │
│   ▸ GOOD: ${(userData.karmaGood || 0).toString().padStart(3)} | BAD: ${(userData.karmaBad || 0).toString().padStart(3)}   │
│                                   │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
└═══════════════════════════════════┘
\`\`\``;
    }
};