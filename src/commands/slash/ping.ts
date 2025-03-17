import {
	type CommandInteractionOptionResolver,
	SlashCommandBuilder,
} from "discord.js";
import { CommandScope, type SlashCommandObject } from "~/commands/types";

export default {
	builder: new SlashCommandBuilder()
		.setName("ping")
		.setDescription("Check latency and stuff."),

	scope: CommandScope.Global,

	run: async (interaction) => {
		interaction.reply({
			content: "> To be added!",
		});
	},
} as SlashCommandObject;
