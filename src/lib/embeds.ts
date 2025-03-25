import { EmbedBuilder } from "discord.js";

export const successEmbed = new EmbedBuilder().setColor("#00FF00").setTimestamp().setTitle("✅ Success!");
export const errorEmbed = new EmbedBuilder().setColor("#FF0000").setTimestamp().setTitle("❌ An error occurred!");
export const trashEmbed = new EmbedBuilder().setColor("#A8A8A8").setTimestamp().setTitle("🗑️ Deleted!");
export const infoEmbed = new EmbedBuilder().setColor("#0000FF").setTimestamp().setTitle("ℹ️ Info");
