import {
	type ApplicationCommand,
	type Collection,
	EmbedBuilder,
	type GuildResolvable,
	REST,
	Routes,
	SlashCommandBuilder,
} from "discord.js";
import { ownerCommand } from "..";
import secrets from "../../secrets";
import { CommandScope, type SlashCommandObject } from "../types";

const rest = new REST({ version: "10" }).setToken(secrets.discordToken);

export default {
	builder: new SlashCommandBuilder()
		.setName("cmd")
		.setDescription("View or delete commands.")
		.addSubcommand((subcommand) =>
			subcommand.setName("view").setDescription("View commands."),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("delete")
				.setDescription("Delete commands.")
				.addStringOption((option) =>
					option
						.setName("scope")
						.setDescription("Guild, Global or Both.")
						.setRequired(true)
						.addChoices(
							{ name: "Guild", value: "GUILD" },
							{ name: "Global", value: "GLOBAL" },
							{ name: "Both", value: "BOTH" },
						),
				),
		),

	scope: CommandScope.Global,

	run: async (interaction) => {
		const embed = new EmbedBuilder().setColor("#00ff3c");
		if (!ownerCommand(interaction))
			return interaction.reply("You are not the owner of this bot.");
		if (!interaction.guild)
			return interaction.reply("This command can only be used in a server.");
		const guildCommands = await interaction.guild.commands.fetch();
		const globalCommands =
			await interaction.client.application.commands.fetch();

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
				const longestCommand = Math.max(
					...Array.from(commands.values()).map(
						(command) => command.name.length,
					),
				);
				for (const [id, command] of commands) {
					string += `/${command.name}${Array(
						longestCommand - command.name.length,
					)
						.fill(" ")
						.join("")}   ${id}\n`;
				}
				return string;
			};

			embed.setTitle(
				`${interaction.client.user.username}'s registered slash commands:`,
			);
			embed.setDescription(
				`**═══════ Guild scope for ${interaction.guild?.name}: ═══════**\`\`\`py\n${getCommandsList(guildCommands)}\`\`\`\n
                **═════════════ Global scope: ═════════════**\`\`\`py\n${getCommandsList(globalCommands)}\`\`\``,
			);
			embed.setColor("#00c8ff");
		};

		const yeet = async (scope: string) => {
			if (scope === "guild" && interaction.guild) {
				rest.put(
					Routes.applicationGuildCommands(
						interaction.client.user.id,
						interaction.guild.id,
					),
					{
						body: [],
					},
				);
				embed.setDescription(
					"Succesfully yeeted all **guild** scoped slash commands.",
				);
				return;
			}

			if (scope === "global") {
				rest.put(Routes.applicationCommands(interaction.client.user.id), {
					body: [],
				});
				embed.setDescription(
					"Succesfully yeeted all **global** scoped slash commands.",
				);
				return;
			}
			if (interaction.guild)
				rest.put(
					Routes.applicationGuildCommands(
						interaction.client.user.id,
						interaction.guild.id,
					),
					{
						body: [],
					},
				);

			rest.put(Routes.applicationCommands(interaction.client.user.id), {
				body: [],
			});
			embed.setDescription(
				"Succesfully yeeted all **guild** & **global** scoped slash commands.",
			);
		};

		const subcommand = interaction.options.getSubcommand();
		const args = interaction.options.getString("scope");
		if (!args) return;
		console.log(args);

		switch (subcommand) {
			case "list":
				await list();
				break;
			case "yeet":
				await yeet(args);
				break;
		}
		interaction.reply({
			embeds: [embed],
		});
	},
} as SlashCommandObject;
