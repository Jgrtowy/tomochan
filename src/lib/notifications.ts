import type { Client, TextChannel } from "discord.js";
import secrets from "~/secrets";
import { successEmbed } from "./embeds";

export function sendDeployNotification(client: Client) {
    const channel = client.channels.cache.get(secrets.notificationsChannel) as TextChannel;
    channel.send({
        embeds: [successEmbed.setDescription(`Deployed successfully! v${secrets.version}`)],
    });
}
