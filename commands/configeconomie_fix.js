// Fix rapide pour la méthode respondToInteraction
function getFixedRespondMethod() {
    return `
    async showActionsConfig(interaction) {
        try {
            const embed = new EmbedBuilder()
                .setColor('#4CAF50')
                .setTitle('💼 Configuration Actions Économiques')
                .setDescription('Configurez les paramètres de chaque action économique\\n\\n' +
                    '**Actions disponibles :**\\n' +
                    '• 👷 **Travail** - Action positive (gains + karma bon)\\n' +
                    '• 🎣 **Pêche** - Action positive (gains + karma bon)\\n' +
                    '• 💰 **Don** - Action très positive (karma bon élevé)\\n' +
                    '• 🦹 **Vol** - Action négative (gains + karma mauvais)\\n' +
                    '• 🔪 **Crime** - Action très négative (gains élevés + karma mauvais)\\n' +
                    '• 🎲 **Pari** - Action neutre (50% gains/pertes)')
                .addFields([
                    {
                        name: '⚙️ Paramètres Configurables',
                        value: '• 💰 Récompenses/Gains\\n• ⏰ Cooldowns\\n• ⚖️ Impact Karma',
                        inline: false
                    }
                ]);

            const components = [
                this.getNavigationMenu(),
                new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('economy_action_config')
                            .setPlaceholder('🎯 Sélectionner une action à configurer')
                            .addOptions([
                                {
                                    label: 'Travail',
                                    description: 'Configurer les paramètres du travail',
                                    value: 'work',
                                    emoji: '👷'
                                },
                                {
                                    label: 'Pêche',
                                    description: 'Configurer les paramètres de la pêche',
                                    value: 'fish',
                                    emoji: '🎣'
                                },
                                {
                                    label: 'Vol',
                                    description: 'Configurer les paramètres du vol',
                                    value: 'steal',
                                    emoji: '🦹'
                                },
                                {
                                    label: 'Crime',
                                    description: 'Configurer les paramètres du crime',
                                    value: 'crime',
                                    emoji: '🔪'
                                },
                                {
                                    label: 'Pari',
                                    description: 'Configurer les paramètres du pari',
                                    value: 'gamble',
                                    emoji: '🎲'
                                },
                                {
                                    label: 'Don',
                                    description: 'Configurer les paramètres du don',
                                    value: 'donate',
                                    emoji: '💰'
                                }
                            ])
                    )
            ];

            if (interaction.deferred) {
                await interaction.editReply({
                    embeds: [embed],
                    components: components
                });
            } else {
                await interaction.reply({
                    embeds: [embed],
                    components: components,
                    flags: 64
                });
            }
        } catch (error) {
            console.error('Erreur showActionsConfig:', error);
        }
    }`;
}

module.exports = { getFixedRespondMethod };