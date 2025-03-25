import { type CommandInteractionOptionResolver, SlashCommandBuilder } from "discord.js";
import { eq } from "drizzle-orm";
import { CommandScope, type SlashCommandObject } from "~/commands/types";
import { guildsSchema } from "~/db/schema";
import { client, db } from "~/index";
import { ownerCommand, pullAllowed } from "~/lib/allowed";
import { errorEmbed, successEmbed } from "~/lib/embeds";

export default {
    builder: new SlashCommandBuilder()
        .setName("guild")
        .setDescription("Add a allowed guild.")
        .addStringOption((option) => option.setName("id").setDescription("Guild ID, defaults to guild where command was executed.").setRequired(false)),

    scope: CommandScope.Global,

    run: async (interaction) => {
        const guild = (<CommandInteractionOptionResolver>interaction.options).getString("id") ?? interaction.guildId;

        if (!ownerCommand(interaction)) return;
        if (!client.guilds.cache.has(guild ?? interaction.guildId ?? "") || !guild) {
            return interaction.reply({
                embeds: [errorEmbed.setDescription("Guild not found.")],
            });
        }

        const found = await db.select().from(guildsSchema).where(eq(guildsSchema.guildId, guild));

        if (found.length !== 0) {
            return interaction.reply({
                embeds: [errorEmbed.setDescription("Guild is already in the list.")],
            });
        }

        const guildName = client.guilds.cache.get(guild)?.name ?? "Unknown";
        await db.insert(guildsSchema).values({
            guildId: guild,
            guildName,
        });

        interaction.reply({
            embeds: [successEmbed.setDescription(`Guild \`${guildName}\` added.`)],
        });

        pullAllowed();
    },
} as SlashCommandObject;
