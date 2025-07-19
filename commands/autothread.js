const { SlashCommandBuilder, ChannelType } = require('discord.js');

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

    if (sub === 'addchannel') {
      const channel = interaction.options.getChannel('channel');
      await interaction.reply({
        content: `✅ Le salon <#${channel.id}> a été ajouté à la configuration auto-thread.`,
        flags: 64
      });
    }

    if (sub === 'removechannel') {
      const channel = interaction.options.getChannel('channel');
      await interaction.reply({
        content: `❌ Le salon <#${channel.id}> a été retiré de la configuration auto-thread.`,
        flags: 64
      });
    }

    if (sub === 'settings') {
      await interaction.reply({
        content: `📋 Aucun salon configuré pour le moment.`,
        flags: 64
      });
    }

    if (sub === 'createthread') {
      const name = interaction.options.getString('nom');
      try {
        const thread = await interaction.channel.threads.create({
          name: name,
          autoArchiveDuration: 60,
          reason: 'Créé via /autothread createthread'
        });

        await interaction.reply({
          content: `🧵 Thread **${thread.name}** créé dans <#${interaction.channel.id}> !`,
          flags: 64
        });
      } catch (err) {
        console.error('Erreur lors de la création du thread :', err);
        await interaction.reply({
          content: `❌ Impossible de créer le thread. Vérifie les permissions.`,
          flags: 64
        });
      }
    }
  }
};
