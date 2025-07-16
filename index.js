// index.js — Final Advanced Giveaway + Embed Builder Bot

const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, Events, StringSelectMenuBuilder } = require('discord.js');
const express = require("express");
const app = express();

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
    new SlashCommandBuilder().setName('help').setDescription('📖 Show help panel').toJSON(),
    new SlashCommandBuilder().setName('ping').setDescription('🏓 Check bot latency').toJSON(),
    new SlashCommandBuilder().setName('calc').setDescription('🧮 Calculate math expression').addStringOption(option => option.setName('expression').setDescription('Math expression').setRequired(true)).toJSON(),
    new SlashCommandBuilder().setName('createembed').setDescription('🛠️ Start embed builder').toJSON()
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
    let index = 0;
    const statuses = [
        { name: '/giveaway | +giveaway', type: 0 },
        { name: '/calc | +calc', type: 0 },
        { name: 'Legendary Giveaways', type: 0 }
    ];
    setInterval(() => {
        client.user.setActivity(statuses[index]);
        index = (index + 1) % statuses.length;
    }, 10000);
});

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) handleSlashCommands(interaction);
    if (interaction.isButton()) handleButton(interaction);
    if (interaction.isStringSelectMenu() && interaction.customId === 'help_select') handleHelpMenu(interaction);
});

client.on(Events.MessageCreate, async message => {
    if (!message.content.startsWith('+') || message.author.bot) return;
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    if (command === 'calc') handlePrefixCalc(message, args);
    if (command === 'ping') handlePrefixPing(message);
    if (command === 'createembed') handlePrefixCreateEmbed(message);
    if (command === 'help') handlePrefixHelp(message);
});

function handleSlashCommands(interaction) {
    if (interaction.commandName === 'calc') handleSlashCalc(interaction);
    if (interaction.commandName === 'ping') handleSlashPing(interaction);
    if (interaction.commandName === 'createembed') handleSlashCreateEmbed(interaction);
    if (interaction.commandName === 'help') handleSlashHelp(interaction);
}

function handleSlashCalc(interaction) {
    try {
        const expression = interaction.options.getString('expression');
        const result = Function(`return (${expression})`)();
        interaction.reply({ content: `🧮 Result: **${result}**`, ephemeral: true });
    } catch {
        interaction.reply({ content: '⚠️ Invalid expression.', ephemeral: true });
    }
}

function handleSlashPing(interaction) {
    interaction.reply({ content: `🏓 Pong! Latency: **${client.ws.ping}ms**`, ephemeral: true });
}

function handleSlashCreateEmbed(interaction) {
    const embed = new EmbedBuilder().setDescription("Embed preview");
    embedStates.set(interaction.user.id, { embed });
    interaction.reply({ content: '✅ Embed panel initialized.', ephemeral: true });
    interaction.channel.send({ embeds: [embed], components: getMainMenu() });
}

function handleSlashHelp(interaction) {
    const helpEmbed = getHelpEmbed(interaction.guild);
    const row = getHelpButtons();
    const selectMenu = getHelpSelectMenu();
    interaction.reply({ embeds: [helpEmbed], components: [row, selectMenu] });
}

function handlePrefixCalc(message, args) {
    try {
        const result = Function(`return (${args.join(' ')})`)();
        message.reply({ embeds: [new EmbedBuilder().setColor('#00ff00').setDescription(`🧮 Result: **${result}**`)] });
    } catch {
        message.reply({ embeds: [new EmbedBuilder().setColor('#00ff00').setDescription('⚠️ Invalid expression.')] });
    }
}

function handlePrefixPing(message) {
    message.reply({ embeds: [new EmbedBuilder().setColor('#00ff00').setDescription(`🏓 Pong! Latency: **${client.ws.ping}ms**`)] });
}

function handlePrefixCreateEmbed(message) {
    const embed = new EmbedBuilder().setDescription("Embed preview");
    embedStates.set(message.author.id, { embed });
    message.channel.send({ embeds: [embed], components: getMainMenu() });
}

function handlePrefixHelp(message) {
    const helpEmbed = getHelpEmbed(message.guild);
    const row = getHelpButtons();
    const selectMenu = getHelpSelectMenu();
    message.reply({ embeds: [helpEmbed], components: [row, selectMenu] });
}

function getHelpEmbed(guild) {
    return new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('❓ Help Panel')
        .addFields(
            { name: '🎉 Giveaway', value: '`/giveaway` + prefix equivalents' },
            { name: '🛠️ Embed', value: '`/createembed` + prefix equivalents' },
            { name: '📊 Utilities', value: '`/ping` `/calc` + prefix equivalents' }
        )
        .setFooter({ text: `${guild?.name || 'Server'}`, iconURL: client.user.displayAvatarURL() });
}

function getHelpButtons() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('Invite').setStyle(ButtonStyle.Link).setURL('https://discord.com/api/oauth2/authorize?client_id=' + CLIENT_ID + '&permissions=8&scope=bot%20applications.commands'),
        new ButtonBuilder().setLabel('Support Server').setStyle(ButtonStyle.Link).setURL('https://discord.gg/yourserver')
    );
}

function getHelpSelectMenu() {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('help_select')
            .setPlaceholder('Choose a command category')
            .addOptions(
                { label: 'Giveaway', description: 'Giveaway related commands', value: 'giveaway' },
                { label: 'Embed', description: 'Embed builder commands', value: 'embed' },
                { label: 'Utilities', description: 'Ping, Calc commands', value: 'utilities' }
            )
    );
}

function handleHelpMenu(interaction) {
    const category = interaction.values[0];
    const helpEmbed = new EmbedBuilder().setColor('#00ff00').setTitle('❓ Help Panel');
    if (category === 'giveaway') helpEmbed.setDescription('🎉 Giveaway commands listed here.');
    if (category === 'embed') helpEmbed.setDescription('🛠️ Embed commands listed here.');
    if (category === 'utilities') helpEmbed.setDescription('📊 Utilities commands listed here.');
    interaction.update({ embeds: [helpEmbed] });
}

function getMainMenu() {
    return [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('edit_title').setLabel('📄 Title').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('edit_description').setLabel('📝 Description').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('edit_color').setLabel('🌈 Color').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('edit_image').setLabel('🖼️ Image').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('edit_thumbnail').setLabel('📎 Thumbnail').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('preview_confirm').setLabel('✅ Confirm').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('cancel').setLabel('❌ Cancel').setStyle(ButtonStyle.Danger)
        )
    ];
}

async function handleButton(interaction) {
    const userState = embedStates.get(interaction.user.id);
    if (!userState) return;
    const { embed } = userState;
    const promptMap = {
        'edit_title': '✏️ Enter new title or type `skip`',
        'edit_description': '💬 Enter new description or type `skip`',
        'edit_color': '🎨 Enter hex color or type `skip`',
        'edit_image': '🖼️ Enter image URL or type `skip`',
        'edit_thumbnail': '📎 Enter thumbnail URL or type `skip`
    };
    if (promptMap[interaction.customId]) {
        await interaction.reply({ content: promptMap[interaction.customId], ephemeral: true });
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
                await interaction.followUp({ content: '⏭️ Skipped.', ephemeral: true });
            }
        } else {
            await interaction.followUp({ content: '⚠️ No input received.', ephemeral: true });
        }
        return;
    }
    if (interaction.customId === 'preview_confirm') {
        await interaction.channel.send({ embeds: [embed] });
        embedStates.delete(interaction.user.id);
        await interaction.message.delete().catch(() => {});
        await interaction.reply({ content: '✅ Embed confirmed and posted.', ephemeral: true });
        return;
    }
    if (interaction.customId === 'cancel') {
        embedStates.delete(interaction.user.id);
        await interaction.reply({ content: '🚫 Embed creation cancelled.', ephemeral: true });
    }
}

client.login(TOKEN);
