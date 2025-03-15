import {
	type CommandInteractionOptionResolver,
	SlashCommandBuilder,
} from "discord.js";
import { max } from "drizzle-orm";
import { db } from "../..";
import { names } from "../../db/schema";
import { CommandScope, type SlashCommandObject } from "../types";

export default {
	builder: new SlashCommandBuilder()
		.setName("add")
		.setDescription("Add a Tomo's name.")
		.addStringOption((option) =>
			option
				.setName("name")
				.setDescription("Tomo`<input>`wsky")
				.setRequired(true),
		),

	scope: CommandScope.Global,

	run: async (interaction) => {
		let name = (<CommandInteractionOptionResolver>(
			interaction.options
		)).getString("name");
		if (!name) return;
		name = name
			.replace(/tomo/gi, "")
			.replace(/wsky/gi, "")
			.replace(/wski/gi, "")
			.trim();
		if (name) {
			name = name.charAt(0).toUpperCase() + name.slice(1);
		}
		const fullName = `Tomo${name}wsky`;

		await db.insert(names).values({
			name: fullName,
			addedBy: interaction.user.id,
		});

		interaction.reply({
			content: `> ✅ Added __**${fullName}**__ to the list.`,
		});
	},
} as SlashCommandObject;
