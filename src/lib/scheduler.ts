import { CronJob, validateCronExpression } from "cron";
import { sql } from "drizzle-orm";
import { db, guilds } from "..";
import { names } from "../db/schema";
import secrets from "../secrets";
import { checkFor } from "./checkFor";

let cronJob: CronJob;
export function scheduleJob() {
	const job = "0 0 * * * *";
	console.log(
		`${validateCronExpression(job) ? "║ ✅ Valid" : "║ ❌ Invalid"} cron expression: ${job}`,
	);
	cronJob = new CronJob(
		job,
		() => {
			changeNickname();
		},
		null,
		true,
		"Europe/Warsaw",
	);
}

export async function changeNickname() {
	const name = (
		await db.select().from(names).orderBy(sql`RANDOM()`).limit(1)
	)[0];

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
