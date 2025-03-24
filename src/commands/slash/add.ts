import { type CommandInteractionOptionResolver, SlashCommandBuilder } from "discord.js";
import { eq } from "drizzle-orm";
import { CommandScope, type SlashCommandObject } from "~/commands/types";
import { namesSchema } from "~/db/schema";
import { db } from "~/index";
import { setPresence } from "~/lib/scheduler";

export default {
    builder: new SlashCommandBuilder()
        .setName("add")
        .setDescription("Add a Tomo's name.")
        .addStringOption((option) => option.setName("name").setDescription("Tomo`<input>`owsky").setRequired(true)),

    scope: CommandScope.Global,

    run: async (interaction) => {
        let name = (<CommandInteractionOptionResolver>interaction.options).getString("name");
        if (!name) return;
        name = name
            .replace(/tomo/gi, "")
            .replace(/owsk[i,y]/gi, "")
            .trim();
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

        const exists = await db.select().from(namesSchema).where(eq(namesSchema.name, fullName));
        if (exists.length !== 0) {
            interaction.reply({
                content: `> ❌ __**${fullName}**__ is already in the list.`,
            });
            return;
        }

        await db.insert(namesSchema).values({
            name: fullName,
            addedBy: interaction.user.id,
        });

        await interaction.reply({
            content: `> ✅ Added __**${fullName}**__ to the list.`,
        });

        await setPresence().catch(null);
    },
} as SlashCommandObject;
