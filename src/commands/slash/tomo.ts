import { type AutocompleteInteraction, type ChatInputCommandInteraction, type CommandInteractionOptionResolver, EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import { asc, count, desc, eq, sql } from "drizzle-orm";
import { namesSchema } from "~/db/schema";
import { db } from "~/index";
import { modCommand } from "~/lib/allowed";
import { errorEmbed, infoEmbed, successEmbed, trashEmbed } from "~/lib/embeds";
import { setPresence } from "~/lib/scheduler";
import { CommandScope, type SlashCommandObject } from "../types";

export default {
    builder: new SlashCommandBuilder()
        .setName("tomo")
        .setDescription("Tomo's commands.")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("add")
                .setDescription("Add a Tomo's name.")
                .addStringOption((option) => option.setName("name").setDescription("Tomo`<input>`owsky").setRequired(true))
                .addStringOption((option) => option.setName("date").setDescription("Special date for this name. Format: dd/mm. Contact owner for adding more.").setRequired(false)),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("remove")
                .setDescription("Remove a Tomo's name.")
                .addStringOption((option) => option.setName("id").setDescription("ID of the name to remove.").setRequired(true)),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("update")
                .setDescription("Update a Tomo's name.")
                .addNumberOption((option) => option.setName("id").setDescription("ID of the name to update.").setRequired(true).setAutocomplete(true))
                .addStringOption((option) => option.setName("name").setDescription("New Tomo`<input>`owsky").setRequired(true)),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("list")
                .setDescription("List all Tomo's names.")
                .addIntegerOption((option) => option.setName("page").setDescription("Page number.").setRequired(false).setAutocomplete(true)),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("leaderboard")
                .setDescription("Check who added most Tomo's.")
                .addIntegerOption((option) => option.setName("page").setDescription("Page number.").setRequired(false).setAutocomplete(true)),
        ),
    scope: CommandScope.Guild,
    autocomplete: async (interaction: AutocompleteInteraction) => {
        if (interaction.options.getSubcommand() === "list") {
            const total = await db.select({ count: count() }).from(namesSchema);
            const totalPages = Math.ceil(total[0].count / 20);

            return Array.from({ length: totalPages > 24 ? 24 : totalPages - 1 }, (_, i) => ({
                name: `${i + 1}`,
                value: i + 1,
            })).concat({
                name: `${totalPages}`,
                value: totalPages,
            });
        }
        if (interaction.options.getSubcommand() === "update") {
            const total = await db.select().from(namesSchema).orderBy(desc(namesSchema.rowNumber)).limit(25);
            return total.map((name) => ({
                name: `${name.rowNumber}. ${name.name}`,
                value: name.rowNumber,
            }));
        }
        if (interaction.options.getSubcommand() === "leaderboard") {
            const total = await db.select({ count: count() }).from(namesSchema).groupBy(namesSchema.addedBy);
            const totalPages = Math.ceil(total[0].count / 20);

            return Array.from({ length: totalPages > 24 ? 24 : totalPages - 1 }, (_, i) => ({
                name: `${i + 1}`,
                value: i + 1,
            })).concat({
                name: `${totalPages}`,
                value: totalPages,
            });
        }
    },
    run: async (interaction) => {
        switch (interaction.options.getSubcommand()) {
            case "add":
                await add(interaction as ChatInputCommandInteraction);
                break;
            case "remove":
                await remove(interaction as ChatInputCommandInteraction);
                break;
            case "update":
                await update(interaction as ChatInputCommandInteraction);
                break;
            case "list":
                await list(interaction as ChatInputCommandInteraction);
                break;
            case "leaderboard":
                await leaderboard(interaction as ChatInputCommandInteraction);
                break;
            default:
                await interaction.reply({
                    embeds: [errorEmbed.setDescription("Unknown subcommand.")],
                });
                break;
        }
    },
} as SlashCommandObject;

const add = async (interaction: ChatInputCommandInteraction): Promise<void> => {
    let name = (<CommandInteractionOptionResolver>interaction.options).getString("name");
    const date = (<CommandInteractionOptionResolver>interaction.options).getString("date") ?? null;
    if (!name) return;
    name = name
        .replace(/tomo/gi, "")
        .replace(/owsk[i,y]/gi, "")
        .trim();
    if (name) {
        name = name.charAt(0).toUpperCase() + name.slice(1);
    }
    if (!/^[\p{L}\p{M}\p{N}\s]+$/u.test(name)) {
        await interaction.reply({
            embeds: [errorEmbed.setDescription("Name can only contain letters, numbers, and spaces.")],
        });
        return;
    }
    const fullName = `Tomo${name}owsky`;

    if (fullName.length > 32) {
        await interaction.reply({
            embeds: [errorEmbed.setDescription("Name is too long. Max 32 characters.")],
        });
        return;
    }

    const exists = await db.select().from(namesSchema).where(eq(namesSchema.name, fullName));
    if (exists.length !== 0) {
        await interaction.reply({
            embeds: [errorEmbed.setDescription(`Name ${fullName} already exists.`)],
        });
        return;
    }

    await db.insert(namesSchema).values({
        name: fullName,
        addedBy: interaction.user.id,
    });

    if (date && /^\d{1,2}\/\d{1,2}$/.test(date)) {
        await db
            .update(namesSchema)
            .set({
                specialDates: sql`${sql`ARRAY[${date}]`}`,
            })
            .where(eq(namesSchema.name, fullName));
    }

    const rowNumber = await db.select().from(namesSchema).where(eq(namesSchema.name, fullName));

    await setPresence().catch(null);

    await interaction.reply({
        embeds: [successEmbed.setDescription(`Name added: #${rowNumber[0].rowNumber}. **${fullName}**. ${date ? `With it's special date on: **${date}**` : ""}`)],
    });
    return;
};

const remove = async (interaction: ChatInputCommandInteraction): Promise<void> => {
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

    await interaction.reply({
        embeds: [trashEmbed.setDescription(`Removed Tomo's name #${fullNameRow.rowNumber}. **${fullNameRow.name}**.`)],
    });

    await setPresence().catch(null);

    return;
};

const update = async (interaction: ChatInputCommandInteraction): Promise<void> => {
    let name = (<CommandInteractionOptionResolver>interaction.options).getString("name");

    const id = (<CommandInteractionOptionResolver>interaction.options).getNumber("id");

    if (!name || !id) return;
    if (!modCommand(interaction)) return;

    const before = await db.select().from(namesSchema).where(eq(namesSchema.rowNumber, id));
    if (before.length === 0) {
        await interaction.reply({
            embeds: [errorEmbed.setDescription("Name not found.")],
        });
        return;
    }

    name = name.replace(/tomo/gi, "").replace(/owsky/gi, "").replace(/owski/gi, "").trim();
    if (name) {
        name = name.charAt(0).toUpperCase() + name.slice(1);
    }
    if (/[^a-zA-Z0-9ąćęłńóśźż\s]/.test(name)) {
        await interaction.reply({
            embeds: [errorEmbed.setDescription("Name can only contain letters, numbers, and spaces.")],
        });
        return;
    }
    const fullName = `Tomo${name}owsky`;

    if (fullName.length > 32) {
        await interaction.reply({
            embeds: [errorEmbed.setDescription("Name is too long. Max 32 characters.")],
        });
        return;
    }

    await db.update(namesSchema).set({ name: fullName }).where(eq(namesSchema.rowNumber, id));

    await interaction.reply({
        embeds: [successEmbed.setDescription(`Name updated: #${id}. **${fullName}**.`)],
    });
    return;
};

const list = async (interaction: ChatInputCommandInteraction): Promise<void> => {
    let page = (<CommandInteractionOptionResolver>interaction.options).getInteger("page") ?? 1;

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
            embeds: [infoEmbed.setDescription("No Tomo's found.")],
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    const embed = new EmbedBuilder()
        .setTitle(`📃 ${total[0].count} Tomo's in database.`)
        .setDescription(query.map((name) => `${name.rowNumber}. ${name.name} ⟶ <@${name.addedBy}>\\@<t:${name.addedAt}:f>`).join("\n"))
        .setFooter({ text: `Page ${page} of ${totalPages}` })
        .setColor("Random");

    await interaction.reply({ embeds: [embed] });
    return;
};

const leaderboard = async (interaction: ChatInputCommandInteraction): Promise<void> => {
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
        await interaction.reply({
            embeds: [infoEmbed.setDescription("No contributors found.")],
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    const embed = new EmbedBuilder()
        .setTitle(`🏆 Tomo's leaderboard.`)
        .setDescription(query.map((name, index) => `${index + 1}. <@${name.addedBy}> → ${name.count}`).join("\n"))
        .setFooter({ text: `Page ${page} of ${totalPages}` })
        .setColor("Random");

    await interaction.reply({ embeds: [embed] });
    return;
};
