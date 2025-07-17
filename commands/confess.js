const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const config = require('../config.json');
const logger = require('../utils/logger');
const rateLimit = require('../utils/rateLimit');
const https = require('https');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('confess')
        .setDescription('Soumettre une confession anonyme')
        .addStringOption(option =>
            option.setName('text')
                .setDescription('Votre texte de confession')
                .setRequired(false))
        .addAttachmentOption(option =>
            option.setName('image')
                .setDescription('Image à inclure avec votre confession')
                .setRequired(false)),

    async execute(interaction) {
        try {
            // Check rate limit
            const rateLimitResult = rateLimit.checkRateLimit(interaction.user.id);
            if (!rateLimitResult.allowed) {
                const timeLeft = Math.ceil(rateLimitResult.timeLeft / 1000);
                return await interaction.reply({
                    content: `⏰ Vous envoyez des confessions trop rapidement ! Veuillez attendre ${timeLeft} secondes avant de soumettre une autre confession.`,
                    ephemeral: true
                });
            }

            const textContent = interaction.options.getString('text');
            const imageAttachment = interaction.options.getAttachment('image');

            // Validate that at least one input is provided (if required by config)
            if (config.requireContent && !textContent && !imageAttachment) {
                return await interaction.reply({
                    content: '❌ Veuillez fournir du texte, une image, ou les deux pour votre confession.',
                    ephemeral: true
                });
            }

            // Validate text length
            if (textContent && textContent.length > config.maxTextLength) {
                return await interaction.reply({
                    content: `❌ Your confession text is too long! Maximum length is ${config.maxTextLength} characters.`,
                    ephemeral: true
                });
            }

            // Validate image if provided
            if (imageAttachment) {
                if (!config.allowedImageTypes.includes(imageAttachment.contentType)) {
                    return await interaction.reply({
                        content: '❌ Invalid image type! Please use PNG, JPG, JPEG, GIF, or WebP.',
                        ephemeral: true
                    });
                }

                if (imageAttachment.size > config.maxImageSize) {
                    return await interaction.reply({
                        content: '❌ Image file is too large! Maximum size is 8MB.',
                        ephemeral: true
                    });
                }
            }

            // Defer reply to give time for processing (ephemeral)
            await interaction.deferReply({ ephemeral: true });

            // Determine target channel from config
            if (config.confessionChannels.length === 0) {
                return await interaction.editReply({
                    content: '❌ Aucun canal de confession configuré! Contactez un administrateur.',
                });
            }
            
            // Try to find the first available channel
            let confessionChannel;
            for (const channelId of config.confessionChannels) {
                const channel = interaction.guild.channels.cache.get(channelId);
                if (channel && channel.permissionsFor(interaction.guild.members.me).has('SendMessages')) {
                    confessionChannel = channel;
                    break;
                }
            }
            
            if (!confessionChannel) {
                return await interaction.editReply({
                    content: '❌ Aucun canal de confession accessible trouvé! Contactez un administrateur.',
                });
            }

            // Create confession embed
            const confessionEmbed = new EmbedBuilder()
                .setColor('#7289da')
                .setTitle('📝 Confession Anonyme')
                .setTimestamp()
                .setFooter({ text: 'Système de Confession Anonyme' });

            if (textContent) {
                confessionEmbed.setDescription(textContent);
            } else if (!imageAttachment) {
                confessionEmbed.setDescription('*Confession sans texte*');
            }

            // Prepare message content
            const messageContent = { embeds: [confessionEmbed] };

            // Handle image attachment
            let imageBuffer = null;
            let imageFileName = null;
            
            if (imageAttachment) {
                try {
                    // Download the image
                    imageBuffer = await downloadImage(imageAttachment.url);
                    imageFileName = imageAttachment.name;
                    
                    // Add image as attachment
                    const attachment = new AttachmentBuilder(imageBuffer, { name: imageFileName });
                    messageContent.files = [attachment];
                    confessionEmbed.setImage(`attachment://${imageFileName}`);
                } catch (error) {
                    console.error('Error downloading image:', error);
                    return await interaction.editReply({
                        content: '❌ Failed to process the image. Please try again.',
                    });
                }
            }

            // Send confession to channel
            const confessionMessage = await confessionChannel.send(messageContent);

            // Create auto-thread if enabled for this channel
            try {
                await this.createAutoThread(confessionMessage, config);
            } catch (threadError) {
                console.error('Erreur création auto-thread:', threadError);
                // Continue even if thread creation fails
            }

            // Log the confession for admins
            const logEntry = {
                id: confessionMessage.id,
                timestamp: new Date().toISOString(),
                author: {
                    id: interaction.user.id,
                    username: interaction.user.username,
                    displayName: interaction.user.displayName || interaction.user.username
                },
                guild: {
                    id: interaction.guild.id,
                    name: interaction.guild.name
                },
                content: {
                    text: textContent || null,
                    hasImage: !!imageAttachment,
                    imageInfo: imageAttachment ? {
                        name: imageAttachment.name,
                        size: imageAttachment.size,
                        contentType: imageAttachment.contentType
                    } : null
                },
                messageUrl: `https://discord.com/channels/${interaction.guild.id}/${confessionChannel.id}/${confessionMessage.id}`
            };

            logger.logConfession(logEntry);

            // Send log to admin channel if configured
            if (config.logChannelId) {
                const logChannel = interaction.guild.channels.cache.get(config.logChannelId);
                if (logChannel && logChannel.permissionsFor(interaction.guild.members.me).has('SendMessages')) {
                    try {
                        const logEmbed = new EmbedBuilder()
                            .setColor('#ff6b6b')
                            .setTitle('📋 Nouvelle Confession - Log Admin')
                            .setDescription(`Une confession anonyme a été postée`)
                            .addFields(
                                { name: '👤 Auteur', value: `${interaction.user.username} (${interaction.user.id})`, inline: true },
                                { name: '📝 Canal', value: `${confessionChannel}`, inline: true },
                                { name: '🕒 Heure', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                                { name: '💬 Contenu', value: textContent ? (textContent.length > 200 ? textContent.substring(0, 200) + '...' : textContent) : '*Pas de texte*', inline: false }
                            )
                            .setFooter({ text: `ID: ${confessionMessage.id}` })
                            .setTimestamp();

                        if (imageAttachment) {
                            logEmbed.addFields({ name: '🖼️ Image', value: `Fichier: ${imageAttachment.name}\nTaille: ${(imageAttachment.size / 1024).toFixed(1)} KB`, inline: true });
                            logEmbed.setImage(imageAttachment.url);
                        }

                        await logChannel.send({ embeds: [logEmbed] });
                    } catch (error) {
                        console.error('Erreur envoi log admin:', error);
                    }
                }
            }

            // Update rate limit
            rateLimit.updateRateLimit(interaction.user.id);

            // Private confirmation (ephemeral - visible only to user)
            await interaction.editReply({
                content: `✅ Votre confession a été soumise anonymement.`
            });

        } catch (error) {
            console.error('Error in confess command:', error);
            
            const errorMessage = '❌ An error occurred while processing your confession. Please try again.';
            
            if (interaction.deferred) {
                await interaction.editReply({ content: errorMessage });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    },

    async createAutoThread(message, config) {
        try {
            // Check if auto-thread is enabled for this channel
            if (!config.autoThreadSettings || !config.autoThreadSettings.enabled) {
                return;
            }

            if (!config.autoThreadSettings.channels || config.autoThreadSettings.channels.length === 0) {
                return;
            }

            if (!config.autoThreadSettings.channels.includes(message.channel.id)) {
                return;
            }

            // Check if bot has permissions to create threads
            const botPermissions = message.guild.members.me.permissionsIn(message.channel);
            
            if (!botPermissions.has('CreatePublicThreads')) {
                console.error('Bot manque la permission CreatePublicThreads');
                return;
            }

            // Get thread count for naming
            const threadCount = await this.getThreadCount(message.channel);
            const threadName = config.autoThreadSettings.threadName.replace('{count}', threadCount + 1);

            // Create thread
            const thread = await message.startThread({
                name: threadName,
                autoArchiveDuration: config.autoThreadSettings.archiveAfter || 60,
                reason: 'Auto-thread pour confession'
            });

            // Set slow mode if configured
            if (config.autoThreadSettings.slowMode > 0) {
                await thread.setRateLimitPerUser(config.autoThreadSettings.slowMode);
            }

            console.log(`Auto-thread créé: ${threadName} pour confession ${message.id}`);
        } catch (error) {
            console.error('Erreur création auto-thread:', error);
        }
    },

    async getThreadCount(channel) {
        try {
            const activeThreads = await channel.threads.fetchActive();
            const archivedThreads = await channel.threads.fetchArchived();
            return activeThreads.threads.size + archivedThreads.threads.size;
        } catch (error) {
            console.error('Erreur comptage threads:', error);
            return Math.floor(Math.random() * 100) + 1; // Fallback random number
        }
    }
};

// Helper function to download image
function downloadImage(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download image: ${response.statusCode}`));
                return;
            }

            const chunks = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => resolve(Buffer.concat(chunks)));
            response.on('error', reject);
        }).on('error', reject);
    });
}
