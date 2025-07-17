const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('staff')
        .setDescription('🛡️ Configurer les rôles staff autorisés à utiliser les commandes de configuration')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            // Vérifier les permissions admin
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                await interaction.reply({
                    content: '❌ Seuls les administrateurs peuvent utiliser cette commande.',
                    ephemeral: true
                });
                return;
            }

            await this.showStaffConfig(interaction);
        } catch (error) {
            console.error('Erreur staff command:', error);
            await interaction.reply({
                content: '❌ Une erreur s\'est produite lors de l\'affichage de la configuration staff.',
                ephemeral: true
            });
        }
    },

    async handleButtonInteraction(interaction) {
        try {
            const action = interaction.customId.replace('staff_', '');
            
            if (action === 'add_role') {
                await this.showAddRoleSelector(interaction);
            } else if (action === 'remove_role') {
                await this.showRemoveRoleSelector(interaction);
            } else if (action === 'refresh') {
                await this.showStaffConfig(interaction);
            }
        } catch (error) {
            console.error('Erreur handleButtonInteraction:', error);
        }
    },

    async handleSelectMenuInteraction(interaction) {
        try {
            if (interaction.customId === 'staff_add_role') {
                const roleIds = interaction.values;
                await this.addStaffRole(interaction, roleIds);
            } else if (interaction.customId === 'staff_remove_role') {
                const roleIds = interaction.values;
                await this.removeStaffRole(interaction, roleIds);
            }
        } catch (error) {
            console.error('Erreur handleSelectMenuInteraction:', error);
        }
    },

    async showStaffConfig(interaction) {
        try {
            const guildId = interaction.guild.id;
            const staffConfig = this.getStaffConfig(guildId);
            
            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🛡️ Configuration Rôles Staff')
                .setDescription('Gérez les rôles autorisés à utiliser les commandes de configuration du bot')
                .addFields(
                    {
                        name: '📋 Rôles Staff Actuels',
                        value: this.formatStaffRoles(interaction.guild, staffConfig),
                        inline: false
                    },
                    {
                        name: '🔧 Commandes Concernées',
                        value: '`/config` • `/configeconomie` • `/autothread` • `/staff`',
                        inline: false
                    },
                    {
                        name: '⚠️ Important',
                        value: 'Les administrateurs ont toujours accès, même sans rôle staff configuré.',
                        inline: false
                    }
                );

            const components = [
                new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('staff_main_menu')
                            .setPlaceholder('🛡️ Choisir une action')
                            .addOptions([
                                {
                                    label: 'Ajouter un rôle staff',
                                    description: 'Ajouter un rôle aux autorisations staff',
                                    value: 'add_role',
                                    emoji: '➕'
                                },
                                {
                                    label: 'Retirer un rôle staff',
                                    description: 'Retirer un rôle des autorisations staff',
                                    value: 'remove_role',
                                    emoji: '➖'
                                },
                                {
                                    label: 'Actualiser',
                                    description: 'Actualiser la configuration',
                                    value: 'refresh',
                                    emoji: '🔄'
                                }
                            ])
                    )
            ];

            const options = {
                embeds: [embed],
                components: components,
                ephemeral: true
            };

            if (interaction.replied || interaction.deferred) {
                await interaction.editReply(options);
            } else {
                await interaction.reply(options);
            }
        } catch (error) {
            console.error('Erreur showStaffConfig:', error);
        }
    },

    async showAddRoleSelector(interaction) {
        try {
            const guildId = interaction.guild.id;
            const staffConfig = this.getStaffConfig(guildId);
            
            // Récupérer tous les rôles sauf @everyone et les rôles déjà configurés
            const availableRoles = interaction.guild.roles.cache
                .filter(role => 
                    role.id !== interaction.guild.id && // Exclure @everyone
                    !staffConfig.roles.includes(role.id) && // Exclure les rôles déjà configurés
                    !role.managed // Exclure les rôles gérés par des bots
                )
                .sort((a, b) => b.position - a.position)
                .first(25); // Limite Discord pour les select menus

            if (availableRoles.length === 0) {
                await interaction.reply({
                    content: '❌ Aucun rôle disponible à ajouter. Tous les rôles sont déjà configurés ou gérés par des bots.',
                    ephemeral: true
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setColor('#00d4aa')
                .setTitle('➕ Ajouter un Rôle Staff')
                .setDescription('Sélectionnez un rôle à ajouter aux autorisations staff');

            const components = [
                new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('staff_add_role')
                            .setPlaceholder('🛡️ Sélectionner un ou plusieurs rôles à ajouter')
                            .setMinValues(1)
                            .setMaxValues(Math.min(availableRoles.length, 25))
                            .addOptions(
                                availableRoles.map(role => ({
                                    label: role.name,
                                    description: `${role.members.size} membres`,
                                    value: role.id,
                                    emoji: '🛡️'
                                }))
                            )
                    )
            ];

            await interaction.update({
                embeds: [embed],
                components: components
            });
        } catch (error) {
            console.error('Erreur showAddRoleSelector:', error);
        }
    },

    async showRemoveRoleSelector(interaction) {
        try {
            const guildId = interaction.guild.id;
            const staffConfig = this.getStaffConfig(guildId);
            
            if (staffConfig.roles.length === 0) {
                await interaction.reply({
                    content: '❌ Aucun rôle staff configuré à retirer.',
                    ephemeral: true
                });
                return;
            }

            const staffRoles = staffConfig.roles
                .map(roleId => interaction.guild.roles.cache.get(roleId))
                .filter(role => role) // Enlever les rôles supprimés
                .sort((a, b) => b.position - a.position);

            const embed = new EmbedBuilder()
                .setColor('#ff6b6b')
                .setTitle('➖ Retirer un Rôle Staff')
                .setDescription('Sélectionnez un rôle à retirer des autorisations staff');

            const components = [
                new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('staff_remove_role')
                            .setPlaceholder('🛡️ Sélectionner un ou plusieurs rôles à retirer')
                            .setMinValues(1)
                            .setMaxValues(Math.min(staffRoles.length, 25))
                            .addOptions(
                                staffRoles.map(role => ({
                                    label: role.name,
                                    description: `${role.members.size} membres`,
                                    value: role.id,
                                    emoji: '🗑️'
                                }))
                            )
                    )
            ];

            await interaction.update({
                embeds: [embed],
                components: components
            });
        } catch (error) {
            console.error('Erreur showRemoveRoleSelector:', error);
        }
    },

    async addStaffRole(interaction, roleIds) {
        try {
            const guildId = interaction.guild.id;
            const staffConfig = this.getStaffConfig(guildId);
            
            const addedRoles = [];
            const alreadyExisting = [];
            
            // Traiter chaque rôle sélectionné
            for (const roleId of roleIds) {
                const role = interaction.guild.roles.cache.get(roleId);
                if (!role) continue;
                
                if (staffConfig.roles.includes(roleId)) {
                    alreadyExisting.push(role.name);
                } else {
                    staffConfig.roles.push(roleId);
                    addedRoles.push(role.name);
                }
            }
            
            this.saveStaffConfig(guildId, staffConfig);

            let message = '';
            if (addedRoles.length > 0) {
                message += `✅ Rôles ajoutés aux rôles staff : **${addedRoles.join(', ')}**\n`;
            }
            if (alreadyExisting.length > 0) {
                message += `⚠️ Rôles déjà configurés : **${alreadyExisting.join(', ')}**`;
            }

            await interaction.reply({
                content: message || '❌ Aucun rôle valide sélectionné.',
                ephemeral: true
            });

            // Actualiser la configuration après un court délai
            setTimeout(() => {
                this.showStaffConfig(interaction);
            }, 1000);
        } catch (error) {
            console.error('Erreur addStaffRole:', error);
        }
    },

    async removeStaffRole(interaction, roleIds) {
        try {
            const guildId = interaction.guild.id;
            const staffConfig = this.getStaffConfig(guildId);
            
            const removedRoles = [];
            const notFound = [];
            
            // Traiter chaque rôle sélectionné
            for (const roleId of roleIds) {
                const role = interaction.guild.roles.cache.get(roleId);
                const roleIndex = staffConfig.roles.indexOf(roleId);
                
                if (roleIndex === -1) {
                    notFound.push(role ? role.name : `Rôle ${roleId.slice(-4)}`);
                } else {
                    staffConfig.roles.splice(roleIndex, 1);
                    removedRoles.push(role ? role.name : `Rôle ${roleId.slice(-4)}`);
                }
            }
            
            this.saveStaffConfig(guildId, staffConfig);

            let message = '';
            if (removedRoles.length > 0) {
                message += `✅ Rôles retirés des rôles staff : **${removedRoles.join(', ')}**\n`;
            }
            if (notFound.length > 0) {
                message += `⚠️ Rôles non configurés : **${notFound.join(', ')}**`;
            }

            await interaction.reply({
                content: message || '❌ Aucun rôle valide sélectionné.',
                ephemeral: true
            });

            // Actualiser la configuration après un court délai
            setTimeout(() => {
                this.showStaffConfig(interaction);
            }, 1000);
        } catch (error) {
            console.error('Erreur removeStaffRole:', error);
        }
    },

    getStaffConfig(guildId) {
        const staffPath = path.join('./data', 'staff_config.json');
        let staffConfig = {};
        
        if (fs.existsSync(staffPath)) {
            staffConfig = JSON.parse(fs.readFileSync(staffPath, 'utf8'));
        }

        return staffConfig[guildId] || { roles: [] };
    },

    saveStaffConfig(guildId, config) {
        const staffPath = path.join('./data', 'staff_config.json');
        let staffConfig = {};
        
        if (fs.existsSync(staffPath)) {
            staffConfig = JSON.parse(fs.readFileSync(staffPath, 'utf8'));
        }

        staffConfig[guildId] = config;
        fs.writeFileSync(staffPath, JSON.stringify(staffConfig, null, 2));
    },

    formatStaffRoles(guild, staffConfig) {
        if (staffConfig.roles.length === 0) {
            return '❌ Aucun rôle staff configuré';
        }

        const rolesList = staffConfig.roles
            .map(roleId => {
                const role = guild.roles.cache.get(roleId);
                return role ? `🛡️ ${role.name} (${role.members.size} membres)` : `❌ Rôle supprimé (${roleId.slice(-4)})`;
            })
            .join('\n');

        return rolesList;
    },

    // Fonction utilitaire pour vérifier les permissions staff
    hasStaffPermission(member, guildId) {
        // Les administrateurs ont toujours accès
        if (member.permissions.has(PermissionFlagsBits.Administrator)) {
            return true;
        }

        const staffConfig = this.getStaffConfig(guildId);
        
        // Vérifier si l'utilisateur a un rôle staff
        return staffConfig.roles.some(roleId => member.roles.cache.has(roleId));
    }
};