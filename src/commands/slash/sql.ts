import {
	type CommandInteractionOptionResolver,
	SlashCommandBuilder,
} from "discord.js";
import { max, sql } from "drizzle-orm";
import { ownerCommand } from "..";
import { db } from "../..";
import { names } from "../../db/schema";
import { CommandScope, type SlashCommandObject } from "../types";

export default {
	builder: new SlashCommandBuilder()
		.setName("sql")
		.setDescription("SQL Command.")
		.addStringOption((option) =>
			option
				.setName("command")
				.setDescription("Command to run.")
				.setRequired(true),
		),

	scope: CommandScope.Global,

	run: async (interaction) => {
		const command = (<CommandInteractionOptionResolver>(
			interaction.options
		)).getString("command");

		if (!command) return;
		if (!ownerCommand(interaction)) return;

		try {
			const result = await db.execute(sql.raw(command));

			interaction.reply({
				content: `\`\`\`ts\n${JSON.stringify(result)}\n\`\`\``,
			});
			return;
		} catch (e) {
			interaction.reply({
				content: `> ❌ Error: ${e}`,
			});
			return;
		}
	},
} as SlashCommandObject;
