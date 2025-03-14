import {
	type CommandInteractionOptionResolver,
	SlashCommandBuilder,
} from "discord.js";
import { ownerCommand } from "..";
import { db } from "../..";
import { changeNickname } from "../../lib/scheduler";
import { CommandScope, type SlashCommandObject } from "../types";

export default {
	builder: new SlashCommandBuilder()
		.setName("reroll")
		.setDescription("Reroll Tomo's name."),

	scope: CommandScope.Global,

	run: async (interaction) => {
		if (!ownerCommand(interaction)) return;

		changeNickname();

		interaction.reply({
			content: "> 🔁 Rerolled today name.",
		});
	},
} as SlashCommandObject;
