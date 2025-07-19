const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('configeconomie_fix')
        .setDescription('Commande de correction rapide pour la configuration économie'),
    async execute(interaction) {
        // Ici, tu mets le code qui doit s’exécuter quand la commande est appelée
        await interaction.reply('La commande de correction configeconomie_fix a été exécutée !');
    }
};
