import {
	type CommandInteractionOptionResolver,
	EmbedBuilder,
	SlashCommandBuilder,
} from "discord.js";
import { db } from "../..";
import {
	CommandScope,
	type NamesSchema,
	type SlashCommandObject,
} from "../types";

export default {
	builder: new SlashCommandBuilder()
		.setName("list")
		.setDescription("List Tomo names.")
		.addIntegerOption((option) =>
			option.setName("page").setDescription("Page number.").setRequired(true),
		),

	scope: CommandScope.Global,

	run: async (interaction) => {
		const page = (<CommandInteractionOptionResolver>(
			interaction.options
		)).getInteger("page");

		if (!page) return;

		const names = db
			.query("SELECT * FROM names ORDER BY id ASC LIMIT 10 OFFSET $offset")
			.all({ $offset: (page - 1) * 10 }) as NamesSchema[];
		const total = db.query("SELECT COUNT(*) as total FROM names").all() as {
			total: number;
		}[];
		const totalPages = Math.ceil(total[0].total / 10);
		if (!names.length) {
			interaction.reply({
				content: "> 📜 No names found.",
			});
			return;
		}

		const embed = new EmbedBuilder()
			.setTitle("Tomo Names")
			.setDescription(
				names
					.map(
						(name) =>
							`> ${name.id}. ${name.name} ⟶ <@${name.addedBy}>\\@<t:${name.addedAt}:f>`,
					)
					.join("\n"),
			)
			.setFooter({ text: `Page ${page} of ${totalPages}` });

		interaction.reply({
			embeds: [embed],
		});
	},
} as SlashCommandObject;
