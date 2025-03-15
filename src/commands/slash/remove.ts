import {
	type CommandInteractionOptionResolver,
	SlashCommandBuilder,
} from "discord.js";
import { eq, sql } from "drizzle-orm";
import { ownerCommand } from "..";
import { db } from "../..";
import { names } from "../../db/schema";
import secrets from "../../secrets";
import { CommandScope, type SlashCommandObject } from "../types";

export default {
	builder: new SlashCommandBuilder()
		.setName("remove")
		.setDescription("Remove a Tomo's name.")
		.addStringOption((option) =>
			option
				.setName("id")
				.setDescription("ID of the name to remove.")
				.setRequired(true),
		),

	scope: CommandScope.Global,

	run: async (interaction) => {
		const id = (<CommandInteractionOptionResolver>(
			interaction.options
		)).getString("id");
		if (!id) return;

		if (!ownerCommand(interaction)) return;

		const fullNameRow = (
			await db
				.select()
				.from(names)
				.where(eq(names.rowNumber, Number(id)))
		)[0];

		await db.delete(names).where(eq(names.rowNumber, Number(id)));

		interaction.reply({
			content: `> 🗑️ Removed __**${fullNameRow.name}**__ from the list.`,
		});
	},
} as SlashCommandObject;
