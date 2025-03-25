import { type CommandInteractionOptionResolver, SlashCommandBuilder } from "discord.js";
import { eq } from "drizzle-orm";
import { CommandScope, type SlashCommandObject } from "~/commands/types";
import { namesSchema } from "~/db/schema";
import { db } from "~/index";
import { errorEmbed, successEmbed } from "~/lib/embeds";
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
        if (!/^[\p{L}\p{M}\p{N}\s]+$/u.test(name)) {
            return interaction.reply({
                embeds: [errorEmbed.setDescription("Name can only contain letters, numbers, and spaces.")],
            });
        }
        const fullName = `Tomo${name}owsky`;

        if (fullName.length > 32) {
            return interaction.reply({
                embeds: [errorEmbed.setDescription("Name is too long. Max 32 characters.")],
            });
        }

        const exists = await db.select().from(namesSchema).where(eq(namesSchema.name, fullName));
        if (exists.length !== 0) {
            interaction.reply({
                embeds: [errorEmbed.setDescription(`Name ${fullName} already exists.`)],
            });
            return;
        }

        await db.insert(namesSchema).values({
            name: fullName,
            addedBy: interaction.user.id,
        });

        const rowNumber = await db.select().from(namesSchema).where(eq(namesSchema.name, fullName));

        await interaction.reply({
            embeds: [successEmbed.setDescription(`Name added: #${rowNumber[0].rowNumber}. **${fullName}**.`)],
        });

        await setPresence().catch(null);
    },
} as SlashCommandObject;
