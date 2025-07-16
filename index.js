// index.js — Combined Advanced Giveaway Bot + Embed Builder Bot

const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, Events } = require('discord.js');
const express = require("express");
let fetch;
try {
    fetch = require('node-fetch');
} catch (err) {
    console.log('Installing node-fetch automatically...');
    const { execSync } = require('child_process');
    try {
        execSync('npm install node-fetch', { stdio: 'inherit' });
        fetch = require('node-fetch');
    } catch (installErr) {
        console.error('❌ Failed to install node-fetch automatically:', installErr);
        process.exit(1);
    }
}

const app = express();
const TOKEN = process.env.TOKEN || process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const embedStates = new Map();

app.get('/', (req, res) => res.send("Bot is Running"));
app.listen(3000, () => console.log("✅ Web Server running on port 3000"));

setInterval(() => {
    fetch('http://localhost:3000').catch(() => {});
}, 4 * 60 * 1000);

const commands = [
    new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Start a giveaway')
        .addStringOption(option => option.setName('duration').setDescription('Example: 1h, 30m').setRequired(true))
        .addIntegerOption(option => option.setName('winners').setDescription('Number of winners').setRequired(true))
        .addStringOption(option => option.setName('prize').setDescription('Giveaway prize').setRequired(true))
        .toJSON(),
    new SlashCommandBuilder()
        .setName('createembed')
        .setDescription('Create a custom embed panel.')
        .toJSON()
];

const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
    try {
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
        console.log("✅ Slash commands registered successfully.");
    } catch (error) {
        console.error(error);
    }
})();

client.on(Events.ClientReady, () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'giveaway') {
            const duration = interaction.options.getString('duration');
            const winners = interaction.options.getInteger('winners');
            const prize = interaction.options.getString('prize');

            await interaction.reply({ content: `✅ Giveaway for **${prize}** has been created.`, ephemeral: true });

            const embed = new EmbedBuilder()
                .setTitle('🎁 **LEGENDARY GIVEAWAY EVENT!** 🎁')
                .setDescription(`✨ **Prize:** ${prize}
⏳ **Duration:** ${duration}
🏆 **Number of Winners:** ${winners}

💡 *Click the button below to participate and stand a chance to win!*`)
                .setColor('#00ff00')
                .setThumbnail('https://raw.githubusercontent.com/bhvyaabohra030308/Achhyaji/refs/heads/main/image.png')
                .setFooter({ text: `🔔 Hosted by: ${interaction.guild.name} | Powered by Best Giveaway Bot`, iconURL: client.user.displayAvatarURL() });

            const joinButton = new ButtonBuilder().setCustomId('join_giveaway').setLabel('🎉 Join Giveaway').setStyle(ButtonStyle.Success);
            const infoButton = new ButtonBuilder().setCustomId('giveaway_info').setLabel('ℹ️ Info').setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder().addComponents(joinButton, infoButton);

            await interaction.channel.send({ embeds: [embed], components: [row] });
        }

        if (interaction.commandName === 'createembed') {
            const embed = new EmbedBuilder().setDescription("⠀");
            embedStates.set(interaction.user.id, { embed, fields: [], buttons: [] });
            await interaction.channel.send({
                content: '🎨 **Embed Builder Initialized**\nUse the buttons below to customize your embed. You can skip any options.',
                embeds: [embed],
                components: getMainMenu()
            });
            await interaction.reply({ content: '✅ Embed panel dropped in chat!', ephemeral: true });
        }
    }

    if (interaction.isButton()) handleButton(interaction);
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
        await interaction.channel.send({ embeds: [embed] });
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

client.login(TOKEN);
