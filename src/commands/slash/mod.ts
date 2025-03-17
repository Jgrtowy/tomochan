import {
	type CommandInteractionOptionResolver,
	SlashCommandBuilder,
} from "discord.js";
import { CommandScope, type SlashCommandObject } from "~/commands/types";
import { modsSchema } from "~/db/schema";
import { db } from "~/index";
import { ownerCommand, updateAllowed } from "~/lib/allowed";

export default {
	builder: new SlashCommandBuilder()
		.setName("mod")
		.setDescription("Add a list moderator.")
		.addUserOption((option) =>
			option
				.setName("user")
				.setDescription("User to add as a moderator.")
				.setRequired(true),
		),

	scope: CommandScope.Global,

	run: async (interaction) => {
		const user = (<CommandInteractionOptionResolver>(
			interaction.options
		)).getUser("user");

		if (!user) return;
		if (!ownerCommand(interaction)) return;

		await db.insert(modsSchema).values({
			userId: user.id,
			displayName: user.displayName,
		});

		interaction.reply({
			content: `> ✅ Added __**${user.displayName}**__ to the mods list.`,
		});

		updateAllowed();
	},
} as SlashCommandObject;
