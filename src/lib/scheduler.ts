import { CronJob } from "cron";
import { db, guilds } from "..";
import secrets from "../secrets";
import { checkFor } from "./checkFor";
export function scheduleJob() {
	new CronJob("0 0 0 * * *", () => changeNickname());
}

export async function changeNickname() {
	const name = db
		.query("SELECT name FROM names ORDER BY RANDOM() LIMIT 1")
		.get() as { name: string };

	if (!name) return;

	console.log(
		secrets.environment === "production"
			? `║ 🔄 Changing nickname to ${name.name}`
			: `║ 🔄 (not) Changing nickname to ${name.name}`,
	);

	for (const guild of guilds) {
		const foundIn = await checkFor(guild, "tomo");
		if (!foundIn) {
			console.error(`║ ❌ Tomo not found in ${guild.name}.`);
			continue;
		}
		const member = await guild.members.fetch(secrets.tomoId);
		if (!member) continue;
		if (!member.manageable) {
			console.error(`║ ❌ Insufficient permissions in ${guild.name}.`);
			continue;
		}
		if (secrets.environment === "production") {
			await member.setNickname(name.name);
		}
	}
}
