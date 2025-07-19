const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { loadConfig, saveConfig } = require('../utils/saveData.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autothread')
    .setDescription('🔄 Gère les paramètres des threads automatiques')
    .addSubcommand(sub =>
      sub.setName('addchannel')
        .setDescription('Ajoute un salon à la liste auto-thread')
        .addChannelOption(opt =>
          opt.setName('channel')
            .setDescription('Salon texte à ajouter')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('removechannel')
        .setDescription('Retire un salon de la liste auto-thread')
        .addChannelOption(opt =>
          opt.setName('channel')
            .setDescription('Salon à retirer')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('settings')
        .setDescription('Affiche les salons configurés')
    )
    .addSubcommand(sub =>
      sub.setName('createthread')
        .setDescription('Crée un thread manuellement ici')
        .addStringOption(opt =>
          opt.setName('nom')
            .setDescription('Nom du thread à créer')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId;
    const config = loadConfig();

    if (!config[guildId]) config[guildId] = [];

    if (sub === 'addchannel') {
      const channel = interaction.options.getChannel('channel');
      if (!config[guildId].includes(channel.id)) {
        config[guildId].push(channel.id);
        saveConfig(config);
      }

      await interaction.reply({
        content: `✅ Salon <#${channel.id}> ajouté à la configuration.`,
        flags: 64
      });
    }

    if (sub === 'removechannel') {
      const channel = interaction.options.getChannel('channel');
      config[guildId] = config[guildId].filter(id => id !== channel.id);
      saveConfig(config);

      await interaction.reply({
        content: `❌ Salon <#${channel.id}> retiré de la configuration.`,
        flags: 64
      });
    }

    if (sub === 'settings') {
      const list = config[guildId];
      const display = list.length > 0
        ? list.map(id => `• <#${id}>`).join('\n')
        : '⚠️ Aucun salon configuré.';

      await interaction.reply({
        content: `📋 Salons configurés :\n${display}`,
        flags: 64
      });
    }

    if (sub === 'createthread') {
      const name = interaction.options.getString('nom');

      try {
        const thread = await interaction.channel.threads.create({
          name,
          autoArchiveDuration: 60,
          reason: 'Créé par /autothread'
        });

        await interaction.reply({
          content: `🧵 Thread **${thread.name}** créé avec succès !`,
          flags: 64
        });
      } catch (err) {
        console.error(err);
        await interaction.reply({
          content: `❌ Impossible de créer le thread. Vérifie les permissions.`,
          flags: 64
        });
      }
    }
  }
};
