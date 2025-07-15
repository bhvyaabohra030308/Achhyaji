// ✅ Embed Builder Bot Core — Slash Command + Guild Registration + Open Port
const { Client, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, REST, Routes } = require('discord.js');
const express = require('express');
const fetch = require('node-fetch');

const client = new Client({ intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
] });

const token = process.env.DISCORD_TOKEN || globalThis.DISCORD_TOKEN;
const { CLIENT_ID, GUILD_ID } = process.env;
const embedStates = new Map();

client.once('ready', async () => {
    const statuses = [
        { name: 'QuickSwap Markets', type: 1, url: 'https://quickswap.exchange' },
        { name: 'Funny Cats 🐱', type: 1, url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        { name: 'Memes & Laughs 😂', type: 1, url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        { name: 'Crypto Charts 📈', type: 1, url: 'https://quickswap.exchange' },
        { name: 'Building Embeds 🛠️', type: 1, url: 'https://quickswap.exchange' },
        { name: 'Trading Secrets 🤫', type: 1, url: 'https://quickswap.exchange' }
    ];
    let i = 0;
    setInterval(() => {
        client.user.setPresence({
            activities: [statuses[i]],
            status: 'online'
        });
        i = (i + 1) % statuses.length;
    }, 4000); // Rotate every 4 seconds // Rotate every 15 seconds
    console.log(`✅ Logged in as ${client.user.tag}`);
    try {
        await registerSlashCommand();
    } catch (error) {
        console.error('❌ Slash command registration failed:', error);
    }
});

client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand() && interaction.commandName === 'createembed') {
        const embed = new EmbedBuilder().setDescription("⠀");
        embedStates.set(interaction.user.id, { embed, fields: [], buttons: [] });
        await interaction.channel.send({
            content: '🎨 **Embed Builder Initialized**\nUse the buttons below to customize your embed. You can skip any options.',
            embeds: [embed],
            components: getMainMenu()
        });
        await interaction.reply({ content: '✅ Embed panel dropped in chat!', ephemeral: true });
    }

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
        'edit_title': '✏️ Please type the new title or type `skip`: ',
        'edit_description': '💬 Please type the new description or type `skip`: ',
        'edit_color': '🎨 Please type the hex color code (e.g., `#ff0000`) or type `skip`: ',
        'edit_image': '🖼️ Please type the image URL or type `skip`: ',
        'edit_thumbnail': '📎 Please type the thumbnail URL or type `skip`: '
    };

    if (promptMap[interaction.customId]) {
        await interaction.channel.send(promptMap[interaction.customId]);
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
                await interaction.channel.send('✅ Embed updated!');
            } else {
                await interaction.channel.send('⏭️ Skipped this option.');
            }
        } else {
            await interaction.channel.send('⚠️ No input received.');
        }
        await interaction.deferUpdate().catch(() => {});
        return;
    }

    if (interaction.customId === 'preview_confirm') {
        await interaction.channel.send({ content: '✅ **Final Embed:**', embeds: [embed] });
        embedStates.delete(interaction.user.id);
        await interaction.message.delete().catch(() => {});
        await interaction.deferUpdate().catch(() => {});
        return;
    }

    if (interaction.customId === 'cancel') {
        embedStates.delete(interaction.user.id);
        await interaction.channel.send('🚫 **Embed creation cancelled.**');
        await interaction.deferUpdate().catch(() => {});
    }
}

async function registerSlashCommand() {
    const rest = new REST({ version: '10' }).setToken(token);
    await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: [
            {
                name: 'createembed',
                description: 'Create a custom embed panel.'
            }
        ] }
    );
    console.log('✅ Slash command registered to the guild immediately.');
}

client.login(token);

// ✅ Keepalive Ping Interval
setInterval(() => {
    fetch('http://localhost:3000').catch(() => {});
}, 4 * 60 * 1000); // Pings every 4 minutes

// ✅ Open Port for Hosting Platforms
const app = express();
app.get('/', (req, res) => res.send('Bot is Running'));
app.listen(3000, () => console.log('✅ Web Server running on port 3000'));
