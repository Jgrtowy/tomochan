import datetimeDifference from "datetime-difference";
import { SlashCommandBuilder } from "discord.js";
import { asc } from "drizzle-orm";
import { CommandScope, type SlashCommandObject } from "~/commands/types";
import { namesSchema } from "~/db/schema";
import { botStart, db } from "~/index";
import secrets from "~/secrets";

export default {
    builder: new SlashCommandBuilder().setName("ping").setDescription("Check latency and stuff."),

    scope: CommandScope.Global,

    run: async (interaction) => {
        const start = new Date();
        await interaction.reply({ content: "<:tf:1352618473720647700>" });
        const dbStart = performance.now();
        await db.select().from(namesSchema).limit(100).orderBy(asc(namesSchema.rowNumber));
        const dbEnd = performance.now();
        const diff = datetimeDifference(start, botStart);

        await interaction.editReply({
            content: `\`\`\`yml
            env: ${secrets.environment}
            client: ${Math.abs(interaction.createdTimestamp - start.getTime())}ms
            db 100 recs: ${(dbEnd - dbStart).toFixed(3)}ms
            uptime: "${JSON.stringify(diff).replace(/[{}"]/gi, "").replaceAll(",", ", ").replaceAll(":", ": ")}"\`\`\``,
        });
    },
} as SlashCommandObject;
