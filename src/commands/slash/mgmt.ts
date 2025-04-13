import datetimeDifference from "datetime-difference";
import { type ApplicationCommand, type ChatInputCommandInteraction, type Collection, type CommandInteractionOptionResolver, EmbedBuilder, type GuildResolvable, REST, Routes, SlashCommandBuilder } from "discord.js";
import { asc, eq, sql } from "drizzle-orm";
import { guildsSchema, modsSchema, namesSchema } from "~/db/schema";
import { botStart, client, db } from "~/index";
import { ownerCommand, pullAllowed } from "~/lib/allowed";
import { errorEmbed, successEmbed } from "~/lib/embeds";
import { logger } from "~/lib/log";
import secrets from "~/secrets";
import { CommandScope, type SlashCommandObject } from "../types";

const rest = new REST({ version: "10" }).setToken(secrets.discordToken);

export default {
    builder: new SlashCommandBuilder()
        .setName("mgmt")
        .setDescription("Management commands.")
        .addSubcommand((subcommand) => subcommand.setName("ping").setDescription("Check latency and stuff."))
        .addSubcommand((subcommand) =>
            subcommand
                .setName("sql")
                .setDescription("SQL Command.")
                .addStringOption((option) => option.setName("command").setDescription("Command to run.").setRequired(true)),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("mod")
                .setDescription("Add a user to the mod list.")
                .addUserOption((option) => option.setName("user").setDescription("User to add.").setRequired(true)),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("guild")
                .setDescription("Add a guild to the list.")
                .addStringOption((option) => option.setName("id").setDescription("Guild ID, defaults to guild where command was executed.").setRequired(false)),
        )
        .addSubcommandGroup((subcommand) =>
            subcommand
                .setName("cmd")
                .setDescription("View or delete commands.")
                .addSubcommand((subcommand) => subcommand.setName("view").setDescription("View commands."))
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("delete")
                        .setDescription("Delete commands.")
                        .addStringOption((option) => option.setName("scope").setDescription("Guild, Global or Both.").setRequired(true).addChoices({ name: "Guild", value: "GUILD" }, { name: "Global", value: "GLOBAL" }, { name: "Both", value: "BOTH" })),
                ),
        ),
    scope: CommandScope.Global,
    run: async (interaction) => {
        logger().namespace("mgmt.ts").debug(`Command: ${interaction.commandName} (${interaction.user.tag})`);
        logger().namespace("mgmt.ts").debug(`Subcommand: ${interaction.options.getSubcommand()}`);
        switch (interaction.options.getSubcommand()) {
            case "ping":
                await ping(interaction);
                break;
            case "sql":
                if (!(await ownerCommand(interaction))) return;
                await sqlCommand(interaction);
                break;
            case "mod":
                if (!(await ownerCommand(interaction))) return;
                await mod(interaction);
                break;
            case "guild":
                if (!(await ownerCommand(interaction))) return;
                await guild(interaction);
                break;
            case "view":
                if (!(await ownerCommand(interaction))) return;
                await cmd(interaction, "view");
                break;
            case "delete":
                if (!(await ownerCommand(interaction))) return;
                await cmd(interaction, "delete");
                break;
            default:
                await interaction.reply({
                    content: "Unknown subcommand.",
                });

                return;
        }
    },
} as SlashCommandObject;

const ping = async (interaction: ChatInputCommandInteraction) => {
    const start = new Date();
    await interaction.reply({ content: "<:tf:1352618473720647700>" });
    const dbStart = performance.now();
    await db.select().from(namesSchema).limit(100).orderBy(asc(namesSchema.rowNumber));
    const dbEnd = performance.now();
    const diff = datetimeDifference(start, botStart);

    await interaction.editReply({
        content: `\`\`\`yml\nenv: ${secrets.environment}\nclient: ${Math.abs(interaction.createdTimestamp - start.getTime())}ms\ndb 100 recs: ${(dbEnd - dbStart).toFixed(3)}ms\nuptime: "${JSON.stringify(diff).replace(/[{}"]/gi, "").replaceAll(",", ", ").replaceAll(":", ": ")}"\`\`\``,
    });
    return;
};

const sqlCommand = async (interaction: ChatInputCommandInteraction) => {
    const command = (<CommandInteractionOptionResolver>interaction.options).getString("command");

    if (!command) return;
    if (!ownerCommand(interaction)) return;

    try {
        const result = await db.execute(sql.raw(command));

        await interaction.reply({
            embeds: [successEmbed.setDescription(`Executed command: \`${command}\``)],
            content: `\`\`\`ts\n${JSON.stringify(result).slice(0, 1950)}\`\`\``,
        });
        return;
    } catch (e) {
        await interaction.reply({
            embeds: [errorEmbed.setDescription(`${e}`)],
        });
        return;
    }
};

const mod = async (interaction: ChatInputCommandInteraction) => {
    const user = (<CommandInteractionOptionResolver>interaction.options).getUser("user");

    if (!user) return;
    if (!ownerCommand(interaction)) return;

    await db.insert(modsSchema).values({
        userId: user.id,
        displayName: user.displayName,
    });

    await interaction.reply({
        embeds: [successEmbed.setDescription(`${user} is now a list moderator.`)],
    });

    await pullAllowed();
    return;
};

const guild = async (interaction: ChatInputCommandInteraction) => {
    const guild = (<CommandInteractionOptionResolver>interaction.options).getString("id") ?? interaction.guildId;

    if (!ownerCommand(interaction)) return;
    if (!client.guilds.cache.has(guild ?? interaction.guildId ?? "") || !guild) {
        return interaction.reply({
            embeds: [errorEmbed.setDescription("Guild not found.")],
        });
    }

    const found = await db.select().from(guildsSchema).where(eq(guildsSchema.guildId, guild));

    if (found.length !== 0) {
        return interaction.reply({
            embeds: [errorEmbed.setDescription("Guild is already in the list.")],
        });
    }

    const guildName = client.guilds.cache.get(guild)?.name ?? "Unknown";
    await db.insert(guildsSchema).values({
        guildId: guild,
        guildName,
    });

    await interaction.reply({
        embeds: [successEmbed.setDescription(`Guild \`${guildName}\` added.`)],
    });

    await pullAllowed();
    return;
};

const cmd = async (interaction: ChatInputCommandInteraction, option: string) => {
    const embed = new EmbedBuilder().setColor("#00ff3c");
    if (!interaction.guild) return await interaction.reply("This command can only be used in a server.");
    const guildCommands = await interaction.guild.commands.fetch();
    const globalCommands = await interaction.client.application.commands.fetch();
    const list = async () => {
        const getCommandsList = (
            commands: Collection<
                string,
                ApplicationCommand<{
                    guild?: GuildResolvable;
                }>
            >,
        ) => {
            let string = "";
            const longestCommand = Math.max(...Array.from(commands.values()).map((command) => command.name.length));
            for (const [id, command] of commands) {
                string += `/${command.name}${Array(longestCommand - command.name.length)
                    .fill(" ")
                    .join("")}   ${id}\n`;
            }
            return string;
        };

        embed.setTitle(`${interaction.client.user.username}'s registered slash commands:`);
        embed.setDescription(`\`\`\`py\n# Guild scope for ${interaction.guild?.name}\n${getCommandsList(guildCommands)}\n# Global scope\n${getCommandsList(globalCommands)}\`\`\``);
        embed.setColor("#00c8ff");
    };

    const yeet = async (scope: string) => {
        if (scope === "guild" && interaction.guild) {
            rest.put(Routes.applicationGuildCommands(interaction.client.user.id, interaction.guild.id), {
                body: [],
            });
            embed.setDescription("Succesfully yeeted all **guild** scoped slash commands.");
            return;
        }

        if (scope === "global") {
            rest.put(Routes.applicationCommands(interaction.client.user.id), {
                body: [],
            });
            embed.setDescription("Succesfully yeeted all **global** scoped slash commands.");
            return;
        }
        if (interaction.guild)
            rest.put(Routes.applicationGuildCommands(interaction.client.user.id, interaction.guild.id), {
                body: [],
            });

        rest.put(Routes.applicationCommands(interaction.client.user.id), {
            body: [],
        });
        embed.setDescription("Succesfully yeeted all **guild** & **global** scoped slash commands.");
    };

    const args = interaction.options.getString("scope");
    switch (option) {
        case "view":
            await list();
            break;
        case "delete":
            if (!args) return;
            await yeet(args);
            break;
    }
    await interaction.reply({
        embeds: [embed],
    });
    return;
};
