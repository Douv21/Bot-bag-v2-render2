const { SlashCommandBuilder, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autothread')
    .setDescription('🔄 Gère les paramètres de threads automatiques')
    .addSubcommand(sub =>
      sub.setName('addchannel')
        .setDescription('Ajoute un channel à la liste auto-thread')
        .addChannelOption(opt =>
          opt
            .setName('channel')
            .setDescription('Channel à surveiller')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('removechannel')
        .setDescription('Retire un channel de la liste auto-thread')
        .addChannelOption(opt =>
          opt
            .setName('channel')
            .setDescription('Channel à retirer')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('settings')
        .setDescription('Affiche les channels configurés')
    )
    .addSubcommand(sub =>
      sub.setName('createthread')
        .setDescription('Crée un thread manuellement dans ce salon')
        .addStringOption(opt =>
          opt
            .setName('nom')
            .setDescription('Nom du thread à créer')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    if (subcommand === 'addchannel') {
      const channel = interaction.options.getChannel('channel');

      // 🔐 TODO: enregistrer ce channel dans ta base / config
      // Exemple fictif : db[guildId].push(channel.id)

      await interaction.reply({
        content: `✅ Le channel <#${channel.id}> a été ajouté à la liste.`,
        flags: 64
      });
    }

    if (subcommand === 'removechannel') {
      const channel = interaction.options.getChannel('channel');

      // 🧹 TODO: retirer ce channel de ta config

      await interaction.reply({
        content: `❌ Le channel <#${channel.id}> a été retiré de la liste.`,
        flags: 64
      });
    }

    if (subcommand === 'settings') {
      // 📋 TODO: récupérer la liste des channels configurés
      // Exemple fictif : const liste = db[guildId] || [];

      const liste = []; // remplace par ta vraie logique
      const description = liste.length
        ? liste.map(id => `<#${id}>`).join('\n')
        : '⚠️ Aucun channel configuré pour les auto-threads.';

      await interaction.reply({
        content: `🛠️ Channels configurés :\n${description}`,
        flags: 64
      });
    }

    if (subcommand === 'createthread') {
      const threadName = interaction.options.getString('nom');

      try {
        const thread = await interaction.channel.threads.create({
          name: threadName,
          autoArchiveDuration: 60,
          reason: `Créé par /autothread createthread`,
        });

        await interaction.reply({
          content: `🧵 Thread **${thread.name}** créé dans <#${interaction.channel.id}>`,
          flags: 64
        });
      } catch (error) {
        console.error('Erreur création thread :', error);
        await interaction.reply({
          content: '❌ Impossible de créer le thread. Vérifie les permissions.',
          flags: 64
        });
      }
    }
  }
};
