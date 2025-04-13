import { type CommandInteractionOptionResolver, SlashCommandBuilder } from "discord.js";
import { desc, eq } from "drizzle-orm";
import { CommandScope, type SlashCommandObject } from "~/commands/types";
import { namesSchema } from "~/db/schema";
import { db } from "~/index";
import { modCommand } from "~/lib/allowed";
import { successEmbed } from "~/lib/embeds";
import { changeNickname } from "~/lib/scheduler";

export default {
    builder: new SlashCommandBuilder()
        .setName("name")
        .setDescription("Change Tomo's current name.")
        .addIntegerOption((option) => option.setName("id").setDescription("Name id").setRequired(true).setAutocomplete(true)),

    scope: CommandScope.Global,
    autocomplete: async () => {
        const names = await db.select().from(namesSchema).orderBy(desc(namesSchema.rowNumber)).limit(25);
        return names.map((name) => ({
            name: `${name.rowNumber}. ${name.name}`,
            value: name.rowNumber,
        }));
    },

    run: async (interaction) => {
        const id = (<CommandInteractionOptionResolver>interaction.options).getInteger("id");
        if (!id) return;
        if (!modCommand(interaction)) return;

        const name = await db.select().from(namesSchema).where(eq(namesSchema.rowNumber, id));

        await changeNickname(true, name[0] as { id: number; name: string });

        await interaction.reply({
            embeds: [successEmbed.setDescription(`Changed Tomo's name to **${name[0].name}**.`)],
        });
    },
} as SlashCommandObject;
