import { type CommandInteractionOptionResolver, SlashCommandBuilder } from "discord.js";
import { eq } from "drizzle-orm";
import { CommandScope, type SlashCommandObject } from "~/commands/types";
import { namesSchema } from "~/db/schema";
import { db } from "~/index";
import { modCommand } from "~/lib/allowed";
import { setPresence } from "~/lib/scheduler";

export default {
    builder: new SlashCommandBuilder()
        .setName("remove")
        .setDescription("Remove a Tomo's name.")
        .addStringOption((option) => option.setName("id").setDescription("ID of the name to remove.").setRequired(true)),

    scope: CommandScope.Global,

    run: async (interaction) => {
        const id = (<CommandInteractionOptionResolver>interaction.options).getString("id");
        if (!id) return;

        if (!modCommand(interaction)) return;

        const fullNameRow = (
            await db
                .select()
                .from(namesSchema)
                .where(eq(namesSchema.rowNumber, Number(id)))
        )[0];

        await db.delete(namesSchema).where(eq(namesSchema.rowNumber, Number(id)));

        interaction.reply({
            content: `> 🗑️ Removed __**${fullNameRow.name}**__ from the list.`,
        });

        await setPresence().catch(null);
    },
} as SlashCommandObject;
