import {
	type CommandInteractionOptionResolver,
	SlashCommandBuilder,
} from "discord.js";
import { ownerCommand } from "..";
import { db } from "../..";
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

		const fullNameRow = db
			.query("SELECT name FROM names WHERE id = $id")
			.all({ $id: id })[0] as { name: string };
		const fullName = fullNameRow.name ? fullNameRow.name : "Unknown user";

		db.run("DELETE FROM names WHERE id = ?", [id]);

		db.exec("BEGIN TRANSACTION");

		try {
			db.run("UPDATE names SET id = id - 1 WHERE id > ?", [id]);

			db.run(
				`UPDATE sqlite_sequence SET seq = (SELECT COALESCE(MAX(id), 0) FROM names) WHERE name = 'names'`,
			);

			db.exec("COMMIT");
		} catch (error) {
			db.exec("ROLLBACK");
			console.error("Error reordering IDs:", error);
		}

		interaction.reply({
			content: `> 🗑️ Removed __**${fullName}**__ from the list.`,
		});
	},
} as SlashCommandObject;
