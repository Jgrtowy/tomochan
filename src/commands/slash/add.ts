import {
	type CommandInteractionOptionResolver,
	SlashCommandBuilder,
} from "discord.js";
import { db } from "../..";
import { CommandScope, type SlashCommandObject } from "../types";

export default {
	builder: new SlashCommandBuilder()
		.setName("add")
		.setDescription("Add a Tomo's name.")
		.addStringOption((option) =>
			option
				.setName("name")
				.setDescription("Tomo`<input>`sky")
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
			.replace(/sky/gi, "")
			.replace(/ski/gi, "")
			.trim();
		if (name) {
			name = name.charAt(0).toUpperCase() + name.slice(1);
		}
		const fullName = `Tomo${name}sky`;

		db.run("INSERT INTO names (name, addedBy, addedAt) VALUES (?, ?, ?)", [
			fullName,
			interaction.user.id,
			Math.floor(new Date().getTime() / 1000),
		]);

		interaction.reply({
			content: `> ✅ Added __**${fullName}**__ to the list.`,
		});
	},
} as SlashCommandObject;
