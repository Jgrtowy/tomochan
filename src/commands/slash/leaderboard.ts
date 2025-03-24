import { type CommandInteractionOptionResolver, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { count, desc } from "drizzle-orm";
import { namesSchema } from "~/db/schema";
import { db } from "~/index";
import { CommandScope, type SlashCommandObject } from "../types";

export default {
    builder: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("Check who added most Tomo's.")
        .addIntegerOption((option) => option.setName("page").setDescription("Page number.").setRequired(false)),

    scope: CommandScope.Global,
    autocomplete: async () => {
        const total = await db.select({ count: count() }).from(namesSchema).groupBy(namesSchema.addedBy);

        const totalPages = Math.ceil(total[0].count / 20);
        return Array.from({ length: totalPages }, (_, i) => ({
            name: `${i + 1}`,
            value: i + 1,
        }));
    },

    run: async (interaction) => {
        let page = (<CommandInteractionOptionResolver>interaction.options).getInteger("page") ?? 1;

        if (!page) return;

        const total = await db.select({ count: count() }).from(namesSchema).groupBy(namesSchema.addedBy);

        const totalPages = Math.ceil(total[0].count / 20);
        if (page > totalPages) {
            page = totalPages;
        }

        const query = await db
            .select({ addedBy: namesSchema.addedBy, count: count() })
            .from(namesSchema)
            .groupBy(namesSchema.addedBy)
            .orderBy(desc(count()))
            .limit(20)
            .offset((page - 1) * 20);

        if (!query.length) {
            interaction.reply({
                content: "> 📜 No names found.",
            });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle(`🏆 Tomo's leaderboard.`)
            .setDescription(query.map((name, index) => `${index + 1}. <@${name.addedBy}> → ${name.count}`).join("\n"))
            .setFooter({ text: `Page ${page} of ${totalPages}` })
            .setColor("Random");

        interaction.reply({ embeds: [embed] });
    },
} as SlashCommandObject;
