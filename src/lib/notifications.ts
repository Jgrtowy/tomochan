import type { Client, TextChannel } from "discord.js";
import secrets from "~/secrets";

export function sendDeployNotification(client: Client) {
    const channel = client.channels.cache.get(secrets.notificationsChannel) as TextChannel;
    channel.send({
        content: `> 🚀 Deployed! \`${new Date().toLocaleString()}\``,
    });
}
