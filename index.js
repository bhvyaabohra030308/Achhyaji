const {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    Events
} = require("discord.js");
const express = require("express");

let fetch;
try {
    fetch = require("node-fetch");
} catch {
    const { execSync } = require("child_process");
    execSync("npm install node-fetch", { stdio: "inherit" });
    fetch = require("node-fetch");
}

const TOKEN = process.env.TOKEN || process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const app = express();
app.get("/", (req, res) => res.send("Bot is Running"));
app.listen(3000, () => console.log("✅ Web Server running on port 3000"));
setInterval(() => fetch("http://localhost:3000").catch(() => {}), 240000);

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const embedStates = new Map();

const commands = [
    new SlashCommandBuilder().setName("help").setDescription("📖 Show help panel"),
    new SlashCommandBuilder().setName("ping").setDescription("🏓 Check bot latency"),
    new SlashCommandBuilder()
        .setName("giveaway")
        .setDescription("🎉 Create a giveaway")
        .addStringOption(o => o.setName("duration").setDescription("e.g., 1h").setRequired(true))
        .addIntegerOption(o => o.setName("winners").setDescription("Number of winners").setRequired(true))
        .addStringOption(o => o.setName("prize").setDescription("Prize").setRequired(true)),
    new SlashCommandBuilder().setName("createembed").setDescription("🛠️ Create custom embed"),
    new SlashCommandBuilder().setName("calc").setDescription("🧮 Calculate").addStringOption(o => o.setName("expression").setDescription("Math").setRequired(true))
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);
(async () => {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log("✅ Slash commands registered.");
})();

client.once(Events.ClientReady, () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    const statuses = [{ name: "/giveaway | +giveaway" }, { name: "/calc | +calc" }, { name: "Legendary Giveaways" }];
    let i = 0;
    setInterval(() => {
        client.user.setActivity(statuses[i]);
        i = (i + 1) % statuses.length;
    }, 10000);
});

client.on(Events.InteractionCreate, handleInteraction);
client.on(Events.MessageCreate, handleMessage);

async function handleInteraction(interaction) {
    if (interaction.isChatInputCommand()) {
        switch (interaction.commandName) {
            case "ping":
                await interaction.reply({ content: `🏓 Pong! Latency: **${client.ws.ping}ms**`, ephemeral: true });
                break;
            case "calc":
                try {
                    const expr = interaction.options.getString("expression");
                    const result = Function(`return (${expr})`)();
                    await interaction.reply({ content: `🧮 Result: **${result}**`, ephemeral: true });
                } catch {
                    await interaction.reply({ content: "⚠️ Invalid expression.", ephemeral: true });
                }
                break;
            case "help":
                await sendHelp(interaction);
                break;
            case "giveaway":
                await createGiveaway(interaction);
                break;
            case "createembed":
                await startEmbedBuilder(interaction);
                break;
        }
    }
    if (interaction.isButton()) handleButton(interaction);
    if (interaction.isStringSelectMenu() && interaction.customId === "help_select") updateHelpSelect(interaction);
}

async function handleMessage(message) {
    if (!message.content.startsWith("+") || message.author.bot) return;
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift()?.toLowerCase();

    if (command === "ping") message.reply(`🏓 Pong! Latency: **${client.ws.ping}ms**`);
    if (command === "calc") {
        try {
            const result = Function(`return (${args.join(" ")})`)();
            message.reply(`🧮 Result: **${result}**`);
        } catch {
            message.reply("⚠️ Invalid expression.");
        }
    }
    if (command === "help") sendHelp(message);
}

async function sendHelp(ctx) {
    const helpEmbed = new EmbedBuilder()
        .setColor("#00ff00")
        .setTitle("❓ Help Panel")
        .setDescription("View all command categories below!")
        .addFields(
            { name: "🎉 Giveaway", value: "`/giveaway`" },
            { name: "🛠️ Embed", value: "`/createembed`" },
            { name: "📊 Utilities", value: "`/ping` `/calc`" },
            { name: "🔑 Prefix", value: "`+ping` `+calc`" }
        );

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel("Invite").setStyle(ButtonStyle.Link).setURL(`https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&permissions=8&scope=bot%20applications.commands`),
        new ButtonBuilder().setLabel("Support").setStyle(ButtonStyle.Link).setURL("https://discord.gg/yourserver")
    );

    const selectMenu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId("help_select")
            .setPlaceholder("Choose a command category")
            .addOptions([
                { label: "Giveaway", value: "giveaway" },
                { label: "Embed", value: "embed" },
                { label: "Utilities", value: "utilities" },
                { label: "Prefix", value: "prefix" }
            ])
    );

    ctx.reply({ embeds: [helpEmbed], components: [row, selectMenu] });
}

async function updateHelpSelect(interaction) {
    const category = interaction.values[0];
    const embed = new EmbedBuilder().setColor("#00ff00").setTitle("❓ Help Panel");

    const contentMap = {
        giveaway: "🎉 Giveaway: `/giveaway`",
        embed: "🛠️ Embed: `/createembed`",
        utilities: "📊 Utilities: `/ping` `/calc`",
        prefix: "🔑 Prefix: `+ping` `+calc`"
    };

    embed.setDescription(contentMap[category] || "Unknown category.");
    await interaction.update({ embeds: [embed] });
}

async function createGiveaway(interaction) {
    const duration = interaction.options.getString("duration");
    const winners = interaction.options.getInteger("winners");
    const prize = interaction.options.getString("prize");

    await interaction.reply({ content: `✅ Giveaway for **${prize}** created!`, ephemeral: true });

    const embed = new EmbedBuilder()
        .setTitle("🎁 LEGENDARY GIVEAWAY")
        .setDescription(`🎉 **Prize:** ${prize}\n⏳ **Duration:** ${duration}\n🏆 **Winners:** ${winners}`)
        .setColor("#00ff00")
        .setThumbnail("https://raw.githubusercontent.com/bhvyaabohra030308/Achhyaji/refs/heads/main/image.png");

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("join_giveaway").setLabel("🎉 Join").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("giveaway_info").setLabel("ℹ️ Info").setStyle(ButtonStyle.Secondary)
    );

    await interaction.channel.send({ embeds: [embed], components: [row] });
}

async function startEmbedBuilder(interaction) {
    const embed = new EmbedBuilder().setDescription("Embed preview");
    embedStates.set(interaction.user.id, { embed });

    await interaction.reply({ content: "✅ Embed panel initialized.", ephemeral: true });
    await interaction.channel.send({ embeds: [embed], components: getMainMenu() });
}

function getMainMenu() {
    return [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("edit_title").setLabel("📄 Title").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("edit_description").setLabel("📝 Description").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("edit_color").setLabel("🎨 Color").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("edit_image").setLabel("🖼️ Image").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("edit_thumbnail").setLabel("📎 Thumbnail").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("preview_confirm").setLabel("✅ Confirm").setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId("cancel").setLabel("❌ Cancel").setStyle(ButtonStyle.Danger)
        )
    ];
}

async function handleButton(interaction) {
    const userState = embedStates.get(interaction.user.id);
    if (!userState) return;
    const { embed } = userState;

    const promptMap = {
        edit_title: "✏️ Enter new title:",
        edit_description: "💬 Enter new description:",
        edit_color: "🎨 Enter hex color:",
        edit_image: "🖼️ Enter image URL:",
        edit_thumbnail: "📎 Enter thumbnail URL:"
    };

    if (promptMap[interaction.customId]) {
        await interaction.reply({ content: promptMap[interaction.customId], ephemeral: true });
        const collected = await interaction.channel.awaitMessages({ filter: m => m.author.id === interaction.user.id, max: 1, time: 30000 });

        if (collected.first()) {
            const content = collected.first().content.trim();
            if (content.toLowerCase() !== "skip") {
                if (interaction.customId === "edit_color" && !/^#[0-9A-F]{6}$/i.test(content)) {
                    return interaction.followUp({ content: "❌ Invalid hex color.", ephemeral: true });
                }

                switch (interaction.customId) {
                    case "edit_title": embed.setTitle(content); break;
                    case "edit_description": embed.setDescription(content); break;
                    case "edit_color": embed.setColor(content); break;
                    case "edit_image": embed.setImage(content); break;
                    case "edit_thumbnail": embed.setThumbnail(content); break;
                }

                await interaction.followUp({ content: "✅ Embed updated!", ephemeral: true });
            } else {
                await interaction.followUp({ content: "⏭️ Skipped.", ephemeral: true });
            }
        } else {
            await interaction.followUp({ content: "⚠️ No input received.", ephemeral: true });
        }
    }

    if (interaction.customId === "preview_confirm") {
        await interaction.channel.send({ embeds: [embed] });
        embedStates.delete(interaction.user.id);
        await interaction.message.delete().catch(() => {});
        await interaction.reply({ content: "✅ Embed confirmed and posted.", ephemeral: true });
    }

    if (interaction.customId === "cancel") {
        embedStates.delete(interaction.user.id);
        await interaction.reply({ content: "🚫 Embed creation cancelled.", ephemeral: true });
    }
}

client.login(TOKEN);
