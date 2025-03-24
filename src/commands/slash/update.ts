import { type CommandInteractionOptionResolver, SlashCommandBuilder } from "discord.js";
import { desc, eq } from "drizzle-orm";
import { CommandScope, type SlashCommandObject } from "~/commands/types";
import { namesSchema } from "~/db/schema";
import { db } from "~/index";
import { modCommand } from "~/lib/allowed";

export default {
    builder: new SlashCommandBuilder()
        .setName("update")
        .setDescription("Update a Tomo's name.")
        .addNumberOption((option) => option.setName("id").setDescription("ID of the name to update.").setRequired(true).setAutocomplete(true))
        .addStringOption((option) => option.setName("name").setDescription("New Tomo`<input>`owsky").setRequired(true)),

    scope: CommandScope.Global,
    autocomplete: async () => {
        const total = await db.select().from(namesSchema).orderBy(desc(namesSchema.rowNumber)).limit(25);
        return total.map((name) => ({
            name: `${name.rowNumber}. ${name.name}`,
            value: name.rowNumber,
        }));
    },

    run: async (interaction) => {
        let name = (<CommandInteractionOptionResolver>interaction.options).getString("name");

        const id = (<CommandInteractionOptionResolver>interaction.options).getNumber("id");

        if (!name || !id) return;
        if (!modCommand(interaction)) return;

        const before = await db.select().from(namesSchema).where(eq(namesSchema.rowNumber, id));
        if (before.length === 0) {
            return interaction.reply({
                content: "> ❌ Name not found.",
            });
        }

        name = name.replace(/tomo/gi, "").replace(/owsky/gi, "").replace(/owski/gi, "").trim();
        if (name) {
            name = name.charAt(0).toUpperCase() + name.slice(1);
        }
        if (/[^a-zA-Z0-9ąćęłńóśźż\s]/.test(name)) {
            return interaction.reply({
                content: "> ❌ Name can only contain letters.",
            });
        }
        const fullName = `Tomo${name}owsky`;

        if (fullName.length > 32) {
            return interaction.reply({
                content: "> ❌ Whole name is too long. Max length is 32 characters.",
            });
        }

        await db.update(namesSchema).set({ name: fullName }).where(eq(namesSchema.rowNumber, id));

        interaction.reply({
            content: `> ✅ Updated __**${before[0].name}**__ to __**${fullName}**__.`,
        });
    },
} as SlashCommandObject;
