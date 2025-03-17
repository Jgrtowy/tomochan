import { CronJob, validateCronExpression } from "cron";
import { ActivityType, type Client } from "discord.js";
import { count, sql } from "drizzle-orm";
import { namesSchema } from "~/db/schema";
import { client, db, guilds } from "~/index";
import { guildsList } from "~/lib/allowed";
import secrets from "~/secrets";

export function scheduleJob() {
	const interval = "0 0 * * * *";
	console.log(
		`${validateCronExpression(interval) ? "║ ✅ Valid" : "║ ❌ Invalid"} cron expression: ${interval}`,
	);
	new CronJob(
		interval,
		() => {
			changeNickname();
		},
		null,
		true,
		"Europe/Warsaw",
	);
	new CronJob(
		interval,
		() => {
			setPresence(client);
		},
		null,
		true,
	);
	console.log("║ ⏳ Registered jobs.");
}

export async function changeNickname(): Promise<undefined | string> {
	const name = (
		await db.select().from(namesSchema).orderBy(sql`RANDOM()`).limit(1)
	)[0];

	if (!name) return;

	console.log(
		`║ 🔄 Changing nickname to ${name.name} @ ${new Date().toLocaleString()}`,
	);

	for (const guild of guildsList) {
		const foundIn = guilds.find((g) => g.id === guild.guildId);
		if (!foundIn) {
			continue;
		}
		const member = await foundIn.members
			.fetch(secrets.tomoId)
			.catch(() => null);
		if (!member) continue;
		if (!member.manageable) {
			console.error(`║ ❌ Insufficient permissions in ${foundIn.name}.`);
			continue;
		}
		await member.setNickname(name.name);
	}
	return name.name;
}

export async function setPresence(client: Client) {
	if (!client.user) return;
	const total = await db.select({ count: count() }).from(namesSchema);
	client.user.setPresence({
		activities: [
			{
				type: ActivityType.Custom,
				name:
					secrets.environment !== "production"
						? "dev mode"
						: `Comes with ${total} Tomo's!`,
			},
		],
		status: secrets.environment !== "production" ? "dnd" : "online",
	});
}
