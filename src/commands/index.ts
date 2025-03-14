import {
	type AutocompleteInteraction,
	type ChatInputCommandInteraction,
	type ClientUser,
	type ContextMenuCommandInteraction,
	REST,
	type RESTPostAPIChatInputApplicationCommandsJSONBody,
	type RESTPostAPIContextMenuApplicationCommandsJSONBody,
	Routes,
	User,
} from "discord.js";
import { guilds } from "..";
import { checkFor } from "../lib/checkFor";
import secrets from "../secrets";
import commandObjects from "./list";
import {
	CommandScope,
	type ContextMenuCommandObject,
	type SlashCommandObject,
} from "./types";

const commands = new Map<string, SlashCommandObject | ContextMenuCommandObject>(
	[...commandObjects].map((command) => [command.builder.name, command]),
);

export async function registerCommands(clientUser: ClientUser) {
	try {
		const rest = new REST().setToken(secrets.discordToken);

		const [globalCommands, guildCommands] = [...commands.values()].reduce(
			(acc, command) => {
				acc[command.scope === CommandScope.Guild ? 1 : 0].push(
					command.builder.toJSON(),
				);
				return acc;
			},
			[[], []] as Array<
				| RESTPostAPIChatInputApplicationCommandsJSONBody
				| RESTPostAPIContextMenuApplicationCommandsJSONBody
			>[],
		);

		globalCommands &&
			(await rest.put(Routes.applicationCommands(clientUser.id), {
				body: globalCommands,
			}));

		for (const guild of guilds) {
			guildCommands &&
				(await rest.put(
					Routes.applicationGuildCommands(clientUser.id, guild.id),
					{ body: guildCommands },
				));
		}

		console.log(
			`║ 💬 Registered ${globalCommands.length + guildCommands.length} commands!`,
		);
	} catch (err) {
		console.error(`Failed to register commands: ${err}`);
	}
}

export async function executeCommand(
	interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction,
) {
	const command = commands.get(interaction.commandName);
	if (!command) return;
	if (!interaction.guild) return;
	if (!(await checkFor(interaction.guild, "owner"))) {
		await interaction.reply({
			content: "❌ Owner of the bot must be in the server to use this command.",
		});
		return;
	}
	try {
		await command.run(
			<ChatInputCommandInteraction & ContextMenuCommandInteraction>interaction,
		);
	} catch (err) {
		console.error(`Failed to execute command: ${err}`);
		await interaction.reply({
			content: "An error occurred while executing this command.",
		});
	}
}

export async function autocomplete(interaction: AutocompleteInteraction) {
	const command = commands.get(interaction.commandName) as SlashCommandObject;
	if (!command || !command.autocomplete) return;

	try {
		await interaction.respond(
			await command.autocomplete(interaction.options.getSubcommand()),
		);
	} catch (err) {
		console.error(`Failed to autocomplete: ${err}`);
	}
}

export function ownerCommand(interaction: ChatInputCommandInteraction) {
	if (interaction.user.id !== secrets.ownerId) {
		interaction.reply({
			content: "❌ You are not the owner of the bot.",
		});
		return false;
	}
	return true;
}
