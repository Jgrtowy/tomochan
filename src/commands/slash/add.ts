import {
	type CommandInteractionOptionResolver,
	SlashCommandBuilder,
} from "discord.js";
import { CommandScope, type SlashCommandObject } from "~/commands/types";
import { namesSchema } from "~/db/schema";
import { db } from "~/index";

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

		if (fullName.length > 32) {
			return interaction.reply({
				content: "> ❌ Whole name is too long. Max length is 32 characters.",
			});
		}

		await db.insert(namesSchema).values({
			name: fullName,
			addedBy: interaction.user.id,
		});

		interaction.reply({
			content: `> ✅ Added __**${fullName}**__ to the list.`,
		});
	},
} as SlashCommandObject;
