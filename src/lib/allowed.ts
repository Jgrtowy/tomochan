import type { ChatInputCommandInteraction } from "discord.js";
import { guildsSchema, modsSchema } from "~/db/schema";
import { db } from "~/index";
import secrets from "~/secrets";
import { errorEmbed } from "./embeds";

export let guildsList: { guildId: string; guildName: string }[] = [];
export let modsList: { userId: string; displayName: string }[] = [];

export async function pullAllowed() {
    guildsList = await db.select().from(guildsSchema);
    modsList = await db.select().from(modsSchema);
}

export async function modCommand(interaction: ChatInputCommandInteraction) {
    if (interaction.user.id === secrets.ownerId) return true;
    for (const mod of modsList) {
        if (mod.userId === interaction.user.id) return true;
    }
    await interaction.reply({
        embeds: [errorEmbed.setDescription("You are not a list moderator.")],
    });
    return false;
}

export async function ownerCommand(interaction: ChatInputCommandInteraction) {
    if (interaction.user.id === secrets.ownerId) return true;
    await interaction.reply({
        embeds: [errorEmbed.setDescription("You are not the owner of the bot.")],
    });
    return false;
}
