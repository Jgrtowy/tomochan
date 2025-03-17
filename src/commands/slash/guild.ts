import {
	type CommandInteractionOptionResolver,
	SlashCommandBuilder,
} from "discord.js";
import { eq, max } from "drizzle-orm";
import { CommandScope, type SlashCommandObject } from "~/commands/types";
import { guildsSchema } from "~/db/schema";
import { client, db } from "~/index";
import { ownerCommand, updateAllowed } from "~/lib/allowed";

export default {
	builder: new SlashCommandBuilder()
		.setName("guild")
		.setDescription("Add a allowed guild.")
		.addStringOption((option) =>
			option
				.setName("id")
				.setDescription(
					"Guild ID, defaults to guild where command was executed.",
				)
				.setRequired(false),
		),

	scope: CommandScope.Global,

	run: async (interaction) => {
		const guild =
			(<CommandInteractionOptionResolver>interaction.options).getString("id") ??
			interaction.guildId;

		if (!ownerCommand(interaction)) return;
		if (
			!client.guilds.cache.has(guild ?? interaction.guildId ?? "") ||
			!guild
		) {
			return interaction.reply({
				content: "> ❌ Guild ID not found.",
			});
		}

		const found = await db
			.select()
			.from(guildsSchema)
			.where(eq(guildsSchema.guildId, guild));

		if (found.length !== 0) {
			return interaction.reply({
				content: "> ❌ Guild already in the list.",
			});
		}

		await db.insert(guildsSchema).values({
			guildId: guild,
			guildName: client.guilds.cache.get(guild)?.name ?? "Unknown",
		});

		interaction.reply({
			content: `> ✅ Added __**${
				client.guilds.cache.get(guild)?.name
			}**__ to the list.`,
		});

		updateAllowed();
	},
} as SlashCommandObject;
