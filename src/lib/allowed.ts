import type { ChatInputCommandInteraction } from "discord.js";
import { guildsSchema, modsSchema } from "~/db/schema";
import { db } from "~/index";
import secrets from "~/secrets";

export let guildsList: { guildId: string; guildName: string }[] = [];
export let modsList: { userId: string; displayName: string }[] = [];

export async function pullAllowed() {
    guildsList = await db.select().from(guildsSchema);
    modsList = await db.select().from(modsSchema);
}

export function modCommand(interaction: ChatInputCommandInteraction) {
    if (interaction.user.id === secrets.ownerId) return true;
    for (const mod of modsList) {
        if (mod.userId === interaction.user.id) return true;
    }
    interaction.reply({
        content: "> ❌ You are not on the mods list.",
    });
    return false;
}

export function ownerCommand(interaction: ChatInputCommandInteraction) {
    if (interaction.user.id === secrets.ownerId) return true;
    interaction.reply({
        content: "> ❌ You are not the owner of the bot.",
    });
    return false;
}
