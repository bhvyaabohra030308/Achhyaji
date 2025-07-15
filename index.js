// ✅ Embed Builder Bot Core — Slash Command + Open Port Version
const { Client, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, REST, Routes } = require('discord.js');
const express = require('express');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const token = process.env.DISCORD_TOKEN || globalThis.DISCORD_TOKEN;
const embedStates = new Map();

client.once('ready', async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    await registerSlashCommand();
});

client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand() && interaction.commandName === 'createembed') {
        const embed = new EmbedBuilder();
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
        'edit_title': '✏️ Please type the new title or type `skip`:',
        'edit_description': '💬 Please type the new description or type `skip`:',
        'edit_color': '🎨 Please type the hex color code (e.g., `#ff0000`) or type `skip`:',
        'edit_image': '🖼️ Please type the image URL or type `skip`:',
        'edit_thumbnail': '📎 Please type the thumbnail URL or type `skip`:'
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
        return;
    }

    if (interaction.customId === 'preview_confirm') {
        await interaction.channel.send({ content: '📤 **Your Embed Preview:**', embeds: [embed] });
        await interaction.deferUpdate();
    }

    if (interaction.customId === 'cancel') {
        embedStates.delete(interaction.user.id);
        await interaction.channel.send('🚫 **Embed creation cancelled.**');
        await interaction.deferUpdate();
    }
}

async function registerSlashCommand() {
    const { CLIENT_ID } = process.env;
    const rest = new REST({ version: '10' }).setToken(token);
    await rest.put(
        Routes.applicationCommands(CLIENT_ID),
        { body: [{ name: 'createembed', description: 'Create a custom embed panel.' }] }
    );
    console.log('✅ Slash command registered.');
}

client.login(token);

// ✅ Open Port for Hosting Platforms
const app = express();
app.get('/', (req, res) => res.send('Bot is Running'));
app.listen(3000, () => console.log('✅ Web Server running on port 3000'));
