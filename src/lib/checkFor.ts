import type { Guild } from "discord.js";
import { guilds } from "..";
import secrets from "../secrets";

export async function checkFor(guild: Guild, what: "owner" | "tomo") {
	const foundIn: Guild[] = [];
	if (!guild) return;
	const member = (await guild.members.fetch())
		.map((member) => member)
		.find(
			(member) =>
				member.id === (what === "owner" ? secrets.ownerId : secrets.tomoId),
		);
	if (!member) return;
	foundIn.push(guild);
	return foundIn;
}
