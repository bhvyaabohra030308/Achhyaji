// index.js — Refined Advanced Giveaway Bot + Embed Builder Bot with Cleaner UX

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
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const embedStates = new Map();

app.get('/', (req, res) => res.send("Bot is Running"));
app.listen(3000, () => console.log("✅ Web Server running on port 3000"));

setInterval(() => {
    fetch('http://localhost:3000').catch(() => {});
}, 4 * 60 * 1000);

const commands = [
    new SlashCommandBuilder().setName('help').setDescription('📖 Show help panel').toJSON(),
    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('🏓 Check bot latency')
        .toJSON(),
    new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('🎉 Create a giveaway with duration, winners, and prize!')
        .addStringOption(option => option.setName('duration').setDescription('Duration (e.g., 1h, 30m)').setRequired(true))
        .addIntegerOption(option => option.setName('winners').setDescription('Number of winners').setRequired(true))
        .addStringOption(option => option.setName('prize').setDescription('The prize for the giveaway').setRequired(true))
        .toJSON(),
    new SlashCommandBuilder()
        .setName('endgiveaway')
        .setDescription('❌ End an active giveaway')
        .addStringOption(option => option.setName('message_id').setDescription('Message ID of the giveaway to end').setRequired(true))
        .toJSON(),
    new SlashCommandBuilder()
        .setName('reroll')
        .setDescription('🔄 Reroll winners for a finished giveaway')
        .addStringOption(option => option.setName('message_id').setDescription('Message ID of the giveaway to reroll').setRequired(true))
        .toJSON(),
    new SlashCommandBuilder()
        .setName('createembed')
        .setDescription('🛠️ Start a custom embed creation panel.')
        .toJSON(),
    new SlashCommandBuilder()
        .setName('listgiveaways')
        .setDescription('📜 List all active giveaways')
        .toJSON(),
    new SlashCommandBuilder()
        .setName('giveawayhelp')
        .setDescription('❓ Get help about giveaway commands')
        .toJSON(),
    new SlashCommandBuilder()
        .setName('calc')
        .setDescription('🧮 Calculate any math expression')
        .addStringOption(option => option.setName('expression').setDescription('Math expression to calculate').setRequired(true))
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
    const statuses = [
        { name: '/giveaway | +giveaway', type: 0 },
        { name: '/calc | +calc', type: 0 },
        { name: 'Legendary Giveaways', type: 0 }
    ];
    let index = 0;
    setInterval(() => {
        client.user.setActivity(statuses[index]);
        index = (index + 1) % statuses.length;
    }, 10000);
    console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
    
        handleSlashCommands(interaction);
    }
});

client.on(Events.MessageCreate, async message => {
    if (!message.content.startsWith('+') || message.author.bot) return;
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'calc') {
        try {
            const expression = args.join(' ');
            const result = Function(`return (${expression})`)();
            await message.reply({
    embeds: [
        new EmbedBuilder()
            .setColor('#00ff00')
            .setDescription(args.join(' ') || '✅ Done.')
            .setColor('#00ff00')
            .setFooter({ text: message.guild?.name || 'Server', iconURL: client.user.displayAvatarURL() })
    ]
});
        } catch {
            await message.reply({
    embeds: [
        new EmbedBuilder()
            .setColor('#00ff00')
            .setDescription(args.join(' ') || '✅ Done.')
            .setColor('#00ff00')
            .setFooter({ text: `${message.guild?.name || 'Server'} • Powered by Best Giveaway Bot`, iconURL: client.user.displayAvatarURL() })
    ]
});
        }
    }
    if (command === 'ping') {
        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor('#00ff00')
                    .setDescription(`🏓 Pong! Latency: **${client.ws.ping}ms**`)
                    .setFooter({ text: message.guild?.name || 'Server', iconURL: client.user.displayAvatarURL() })
            ]
        });
    }
    if (command === 'giveaway') {
        const duration = args[0];
        const winners = parseInt(args[1]);
        const prize = args.slice(2).join(' ');
        if (!duration || !winners || !prize) return message.reply({
    embeds: [
        new EmbedBuilder()
            .setColor('#00ff00')
            .setDescription(args.join(' ') || '✅ Done.')
            .setColor('#00ff00')
            .setFooter({ text: `${message.guild?.name || 'Server'} • Powered by Best Giveaway Bot`, iconURL: client.user.displayAvatarURL() })
    ]
});
        message.reply({
    embeds: [
        new EmbedBuilder()
            .setColor('#00ff00')
            .setDescription(args.join(' ') || '✅ Done.')
            .setColor('#00ff00')
            .setFooter({ text: `${message.guild?.name || 'Server'} • Powered by Best Giveaway Bot`, iconURL: client.user.displayAvatarURL() })
    ]
});
    }
    if (command === 'endgiveaway') {
        const messageId = args[0];
        if (!messageId) return message.reply({
    embeds: [
        new EmbedBuilder()
            .setColor('#00ff00')
            .setDescription(args.join(' ') || '✅ Done.')
            .setColor('#00ff00')
            .setFooter({ text: `${message.guild?.name || 'Server'} • Powered by Best Giveaway Bot`, iconURL: client.user.displayAvatarURL() })
    ]
});
        message.reply({
    embeds: [
        new EmbedBuilder()
            .setColor('#00ff00')
            .setDescription(args.join(' ') || '✅ Done.')
            .setColor('#00ff00')
            .setFooter({ text: `${message.guild?.name || 'Server'} • Powered by Best Giveaway Bot`, iconURL: client.user.displayAvatarURL() })
    ]
});
    }
    if (command === 'reroll') {
        const messageId = args[0];
        if (!messageId) return message.reply({
    embeds: [
        new EmbedBuilder()
            .setColor('#00ff00')
            .setDescription(args.join(' ') || '✅ Done.')
            .setColor('#00ff00')
            .setFooter({ text: `${message.guild?.name || 'Server'} • Powered by Best Giveaway Bot`, iconURL: client.user.displayAvatarURL() })
    ]
});
        message.reply({
    embeds: [
        new EmbedBuilder()
            .setColor('#00ff00')
            .setDescription(args.join(' ') || '✅ Done.')
            .setColor('#00ff00')
            .setFooter({ text: `${message.guild?.name || 'Server'} • Powered by Best Giveaway Bot`, iconURL: client.user.displayAvatarURL() })
    ]
});
    }
    if (command === 'createembed') {
        message.reply({
    embeds: [
        new EmbedBuilder()
            .setColor('#00ff00')
            .setDescription(args.join(' ') || '✅ Done.')
            .setColor('#00ff00')
            .setFooter({ text: `${message.guild?.name || 'Server'} • Powered by Best Giveaway Bot`, iconURL: client.user.displayAvatarURL() })
    ]
});
    }
    if (command === 'listgiveaways') {
        message.reply({
    embeds: [
        new EmbedBuilder()
            .setColor('#00ff00')
            .setDescription(args.join(' ') || '✅ Done.')
            .setColor('#00ff00')
            .setFooter({ text: `${message.guild?.name || 'Server'} • Powered by Best Giveaway Bot`, iconURL: client.user.displayAvatarURL() })
    ]
});
    }
    if (command === 'giveawayhelp' || command === 'help') {
        const helpEmbed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('❓ Help Panel')
            .setDescription('View all command categories below!')
            .addFields(
                { name: '🎉 Giveaway', value: '`/giveaway` `/endgiveaway` `/reroll` `/listgiveaways`' },
                { name: '🛠️ Embed', value: '`/createembed`' },
                { name: '📊 Utilities', value: '`/ping` `/calc`' },
                { name: '🔑 Prefix', value: '`+giveaway` `+endgiveaway` `+reroll` `+listgiveaways` `+ping` `+calc` `+createembed`' }
            )
            .setFooter({ text: `${message.guild?.name}`, iconURL: client.user.displayAvatarURL() });
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setLabel('Invite').setStyle(ButtonStyle.Link).setURL('https://discord.com/api/oauth2/authorize?client_id=' + CLIENT_ID + '&permissions=8&scope=bot%20applications.commands'),
            new ButtonBuilder().setLabel('Support Server').setStyle(ButtonStyle.Link).setURL('https://discord.gg/yourserver')
        );
        const selectMenu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('help_select')
                .setPlaceholder('Choose a command category')
                .addOptions([
                    { label: 'Giveaway', description: 'Giveaway related commands', value: 'giveaway' },
                    { label: 'Embed', description: 'Embed builder commands', value: 'embed' },
                    { label: 'Utilities', description: 'Ping, Calc commands', value: 'utilities' },
                    { label: 'Prefix Commands', description: 'All + prefix commands', value: 'prefix' }
                ])
        );
        message.reply({ embeds: [helpEmbed], components: [row] });
    } • Powered by Best Giveaway Bot`, iconURL: client.user.displayAvatarURL() })
    ]
});
    }
});

function handleSlashCommands(interaction) {
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'calc') {
            try {
                const expression = interaction.options.getString('expression');
                const result = Function(`return (${expression})`)();
                await interaction.reply({ content: `🧮 Result: **${result}**`, ephemeral: true });
            } catch {
                await interaction.reply({ content: '⚠️ Invalid expression.', ephemeral: true });
            }
            return;
        }
        if (interaction.commandName === 'giveaway') {
            const duration = interaction.options.getString('duration');
            const winners = interaction.options.getInteger('winners');
            const prize = interaction.options.getString('prize');

            await interaction.reply({ content: `✅ Giveaway for **${prize}** has been created.`, ephemeral: true });

            const embed = new EmbedBuilder()
                .setTitle('🎁 LEGENDARY GIVEAWAY')
                .setDescription(`🎉 **Prize:** ${prize}\n⏳ **Duration:** ${duration}\n🏆 **Winners:** ${winners}\n\nClick the button below to participate.`)
                .setColor('#00ff00')
                .setThumbnail('https://raw.githubusercontent.com/bhvyaabohra030308/Achhyaji/refs/heads/main/image.png')
                .setFooter({ text: `${interaction.guild.name} • Powered by Best Giveaway Bot`, iconURL: client.user.displayAvatarURL() });

            const joinButton = new ButtonBuilder().setCustomId('join_giveaway').setLabel('🎉 Join').setStyle(ButtonStyle.Success);
            const infoButton = new ButtonBuilder().setCustomId('giveaway_info').setLabel('ℹ️ Info').setStyle(ButtonStyle.Secondary);

            await interaction.channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(joinButton, infoButton)] });
        }

        if (interaction.commandName === 'ping') {
            await interaction.reply({ content: `🏓 Pong! Latency: **${client.ws.ping}ms**`, ephemeral: true });
            return;
        }
        if (interaction.commandName === 'help') {
            const helpEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('❓ Help Panel')
                .setDescription('View all command categories below!')
                .addFields(
                    { name: '🎉 Giveaway', value: '`/giveaway` `/endgiveaway` `/reroll` `/listgiveaways`' },
                    { name: '🛠️ Embed', value: '`/createembed`' },
                    { name: '📊 Utilities', value: '`/ping` `/calc`' },
                    { name: '🔑 Prefix', value: '`+giveaway` `+endgiveaway` `+reroll` `+listgiveaways` `+ping` `+calc` `+createembed`' }
                )
                .setFooter({ text: `${interaction.guild.name}`, iconURL: client.user.displayAvatarURL() });
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setLabel('Invite').setStyle(ButtonStyle.Link).setURL('https://discord.com/api/oauth2/authorize?client_id=' + CLIENT_ID + '&permissions=8&scope=bot%20applications.commands'),
                new ButtonBuilder().setLabel('Support Server').setStyle(ButtonStyle.Link).setURL('https://discord.gg/yourserver')
            );
            await interaction.reply({ embeds: [helpEmbed], components: [row, selectMenu], ephemeral: false });
            return;
        }
        if (interaction.commandName === 'createembed') {
            const embed = new EmbedBuilder().setDescription("Embed preview");
            embedStates.set(interaction.user.id, { embed });
            await interaction.reply({ content: '✅ Embed panel initialized. Customize your embed now.', ephemeral: true });
            await interaction.channel.send({
                embeds: [embed],
                components: getMainMenu()
            });
        }
    }

    if (interaction.isButton()) handleButton(interaction);
    if (interaction.isStringSelectMenu() && interaction.customId === 'help_select') {
        const category = interaction.values[0];
        const helpEmbed = new EmbedBuilder().setColor('#00ff00').setTitle('❓ Help Panel');
        if (category === 'giveaway') helpEmbed.setDescription('🎉 Giveaway: `/giveaway` `/endgiveaway` `/reroll` `/listgiveaways`');
        if (category === 'embed') helpEmbed.setDescription('🛠️ Embed: `/createembed`');
        if (category === 'utilities') helpEmbed.setDescription('📊 Utilities: `/ping` `/calc`');
        if (category === 'prefix') helpEmbed.setDescription('🔑 Prefix: `+giveaway` `+endgiveaway` `+reroll` `+listgiveaways` `+ping` `+calc` `+createembed`');
        await interaction.update({ embeds: [helpEmbed] });
    }
});

function getMainMenu() {
    return [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('edit_title').setLabel('📄 Title').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('edit_description').setLabel('📝 Description').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('edit_color').setLabel('🎨 Color').setStyle(ButtonStyle.Secondary),
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
        'edit_color': '🎨 Enter hex color (e.g., `#ff0000`) or type `skip`',
        'edit_image': '🖼️ Enter image URL or type `skip`',
        'edit_thumbnail': '📎 Enter thumbnail URL or type `skip`'
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
