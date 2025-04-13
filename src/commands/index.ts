import { type AutocompleteInteraction, type ChatInputCommandInteraction, type ClientUser, type ContextMenuCommandInteraction, REST, type RESTPostAPIChatInputApplicationCommandsJSONBody, type RESTPostAPIContextMenuApplicationCommandsJSONBody, Routes } from "discord.js";
import commandObjects from "~/commands/commands";
import { guilds } from "~/index";
import { guildsList } from "~/lib/allowed";
import { errorEmbed } from "~/lib/embeds";
import { logger } from "~/lib/log";
import secrets from "~/secrets";
import { CommandScope, type ContextMenuCommandObject, type SlashCommandObject } from "./types";

const log = logger().namespace("commands/index.ts").seal();

const commands = new Map<string, SlashCommandObject | ContextMenuCommandObject>([...commandObjects].map((command) => [command.builder.name, command]));

export async function registerCommands(clientUser: ClientUser) {
    try {
        const rest = new REST().setToken(secrets.discordToken);

        const [globalCommands, guildCommands] = [...commands.values()].reduce(
            (acc, command) => {
                acc[command.scope === CommandScope.Guild ? 1 : 0].push(command.builder.toJSON());
                return acc;
            },
            [[], []] as Array<RESTPostAPIChatInputApplicationCommandsJSONBody | RESTPostAPIContextMenuApplicationCommandsJSONBody>[],
        );

        globalCommands &&
            (await rest.put(Routes.applicationCommands(clientUser.id), {
                body: globalCommands,
            }));

        for (const guild of guilds) {
            guildCommands && (await rest.put(Routes.applicationGuildCommands(clientUser.id, guild.id), { body: guildCommands }));
        }

        log.success(`Registered ${globalCommands.length + guildCommands.length} commands!`);
    } catch (err) {
        log.error(`Failed to register commands: ${err}`);
    }
}

export async function executeCommand(interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction) {
    const command = commands.get(interaction.commandName);
    if (!command) return;
    if (!interaction.guild) return;
    if (interaction.guildId !== secrets.testGuild && !(await checkGuild(interaction))) return;

    try {
        await command.run(<ChatInputCommandInteraction & ContextMenuCommandInteraction>interaction);
    } catch (err) {
        log.alert(`Failed to execute command: ${err}`);
        await interaction.reply({
            embeds: [errorEmbed.setDescription("Failed to execute command. Owner has been notified.")],
        });
    }
}

export async function autocomplete(interaction: AutocompleteInteraction) {
    const command = commands.get(interaction.commandName) as SlashCommandObject;
    if (!command || !command.autocomplete) return;

    try {
        await interaction.respond(await command.autocomplete(interaction));
    } catch (err) {
        log.error(`Failed to autocomplete: ${err}`);
    }
}

async function checkGuild(interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction) {
    for (const guild of guildsList) {
        if (guild.guildId === interaction.guildId) return true;
    }

    await interaction.reply({
        embeds: [errorEmbed.setDescription("This guild is not allowed to use the bot.")],
    });

    return false;
}
