import { type CommandInteractionOptionResolver, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { asc, count } from "drizzle-orm";
import { namesSchema } from "~/db/schema";
import { db } from "~/index";
import { CommandScope, type SlashCommandObject } from "../types";

export default {
    builder: new SlashCommandBuilder()
        .setName("list")
        .setDescription("List Tomo names.")
        .addIntegerOption((option) => option.setName("page").setDescription("Page number.").setRequired(true).setAutocomplete(true)),

    scope: CommandScope.Global,
    autocomplete: async () => {
        const total = await db.select({ count: count() }).from(namesSchema);
        const totalPages = Math.ceil(total[0].count / 20);
        return Array.from({ length: totalPages }, (_, i) => ({
            name: `${i + 1}`,
            value: i + 1,
        }));
    },

    run: async (interaction) => {
        let page = (<CommandInteractionOptionResolver>interaction.options).getInteger("page");

        if (!page) return;

        const total = await db.select({ count: count() }).from(namesSchema);

        const totalPages = Math.ceil(total[0].count / 20);
        if (page > totalPages) {
            page = totalPages;
        }

        const query = await db
            .select()
            .from(namesSchema)
            .orderBy(asc(namesSchema.rowNumber))
            .limit(20)
            .offset((page - 1) * 20);

        if (!query.length) {
            interaction.reply({
                content: "> 📜 No names found.",
            });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle(`📃 ${total[0].count} Tomo's in database.`)
            .setDescription(query.map((name) => `${name.rowNumber}. ${name.name} ⟶ <@${name.addedBy}>\\@<t:${name.addedAt}:f>`).join("\n"))
            .setFooter({ text: `Page ${page} of ${totalPages}` })
            .setColor("Random");

        interaction.reply({ embeds: [embed] });
    },
} as SlashCommandObject;
