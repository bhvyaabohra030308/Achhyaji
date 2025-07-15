// ✅ Embed Builder Bot Core — Prefix Command + Open Port Version
const { Client, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const express = require('express');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const token = process.env.DISCORD_TOKEN || globalThis.DISCORD_TOKEN;
const prefix = ".";
const embedStates = new Map();

client.once('ready', () => console.log(`✅ Logged in as ${client.user.tag}`));

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'createembed') {
        const embed = new EmbedBuilder();
        embedStates.set(message.author.id, { embed, fields: [], buttons: [] });

        await message.reply({
            content: '🎨 **Embed Builder Initialized**\nUse the buttons below to customize your embed. You can skip any options.',
            embeds: [embed],
            components: getMainMenu()
        });
    }
});

client.on('interactionCreate', async interaction => {
    if (interaction.isButton()) {
        handleButton(interaction);
    }
});

function getMainMenu() {
    return [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('edit_title').setLabel('📄 Title').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('edit_description').setLabel('📝 Description').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('edit_color').setLabel('🌈 Color').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('edit_image').setLabel('🖼️ Image').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('edit_thumbnail').setLabel('📎 Thumbnail').setStyle(ButtonStyle.Secondary)
        ),
        new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('preview_confirm').setLabel('✅ Preview / Confirm').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('cancel').setLabel('❌ Cancel').setStyle(ButtonStyle.Danger)
        )
    ];
}

async function handleButton(interaction) {
    const userState = embedStates.get(interaction.user.id);
    if (!userState) return;
    const { embed } = userState;

    const promptMap = {
        'edit_title': '✏️ Please type the new title or type `skip`:',
        'edit_description': '💬 Please type the new description or type `skip`:',
        'edit_color': '🎨 Please type the hex color code (e.g., `#ff0000`) or type `skip`:',
        'edit_image': '🖼️ Please type the image URL or type `skip`:',
        'edit_thumbnail': '📎 Please type the thumbnail URL or type `skip`:'
    };

    if (promptMap[interaction.customId]) {
        await askInChat(interaction, promptMap[interaction.customId]);
        const collected = await interaction.channel.awaitMessages({ filter: m => m.author.id === interaction.user.id, max: 1, time: 30000 }).catch(() => null);
        if (collected?.first()) {
            const content = collected.first().content.trim();
            if (content.toLowerCase() !== 'skip') {
                switch (interaction.customId) {
                    case 'edit_title': embed.setTitle(content); break;
                    case 'edit_description': embed.setDescription(content); break;
                    case 'edit_color': embed.setColor(content); break;
                    case 'edit_image': embed.setImage(content); break;
                    case 'edit_thumbnail': embed.setThumbnail(content); break;
                }
                await interaction.followUp({ content: '✅ Embed updated!', ephemeral: true });
            } else {
                await interaction.followUp({ content: '⏭️ Skipped this option.', ephemeral: true });
            }
        } else {
            await interaction.followUp({ content: '⚠️ No input received.', ephemeral: true });
        }
        return;
    }

    if (interaction.customId === 'preview_confirm') {
        await interaction.reply({ content: '📤 **Your Embed Preview:**', embeds: [embed], ephemeral: true });
    }

    if (interaction.customId === 'cancel') {
        embedStates.delete(interaction.user.id);
        await interaction.reply({ content: '🚫 **Embed creation cancelled.**', ephemeral: true });
    }
}

async function askInChat(interaction, question) {
    await interaction.reply({ content: question, ephemeral: true });
}

client.login(token);

// ✅ Open Port for Hosting Platforms
const app = express();
app.get('/', (req, res) => res.send('Bot is Running'));
app.listen(3000, () => console.log('✅ Web Server running on port 3000'));
