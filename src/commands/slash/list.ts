import {
	type CommandInteractionOptionResolver,
	EmbedBuilder,
	SlashCommandBuilder,
} from "discord.js";
import { asc, count } from "drizzle-orm";
import { db } from "../..";
import { names } from "../../db/schema";
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

		const query = await db
			.select()
			.from(names)
			.orderBy(asc(names.rowNumber))
			.limit(10)
			.offset((page - 1) * 10);

		const total = await db.select({ count: count() }).from(names);

		const totalPages = Math.ceil(total[0].count / 10);
		if (!query.length) {
			interaction.reply({
				content: "> 📜 No names found.",
			});
			return;
		}

		const embed = new EmbedBuilder()
			.setTitle("Tomo Names")
			.setDescription(
				query
					.map(
						(name) =>
							`> ${name.rowNumber}. ${name.name} ⟶ <@${name.addedBy}>\\@<t:${name.addedAt}:f>`,
					)
					.join("\n"),
			)
			.setFooter({ text: `Page ${page} of ${totalPages}` });

		interaction.reply({ embeds: [embed] });
	},
} as SlashCommandObject;
