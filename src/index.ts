import { Database } from "bun:sqlite";
import {
	ActivityType,
	Client,
	Events,
	GatewayIntentBits,
	type Guild,
	IntentsBitField,
	Partials,
} from "discord.js";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { autocomplete, executeCommand, registerCommands } from "./commands";
import { names } from "./db/schema";
import { checkFor } from "./lib/checkFor";
import { changeNickname, scheduleJob } from "./lib/scheduler";
import secrets from "./secrets";

const start = new Date();

console.log(`╔════════════════════════════════════════════════════
║ 🤖 TomoChan's starting! ${start.toLocaleString()}
${secrets.environment === "production" ? "║ 🌐 Production" : "║ 🛠️  Development"}
╠════════════════════════════════════════════════════`);
export let db: NodePgDatabase;

try {
	db = drizzle(
		secrets.environment !== "production"
			? secrets.devDatabaseUrl
			: secrets.databaseUrl,
	);
} catch (e) {
	console.error("║ ❌  Database error:", e);
	process.exit(1);
}

export const client = new Client({
	intents: [
		IntentsBitField.Flags.Guilds,
		GatewayIntentBits.GuildVoiceStates,
		IntentsBitField.Flags.GuildMembers,
		GatewayIntentBits.GuildMembers,
	],
	partials: [Partials.Channel, Partials.Message, Partials.GuildMember],
});

export let guilds: Guild[] = [];

client.once(Events.ClientReady, async (client) => {
	guilds = client.guilds.cache.map((guild) => guild);
	console.log(
		guilds.length &&
			`║ ⚔️  Guilds [${client.guilds.cache.map(() => {}).length}]: ${client.guilds.cache.map((guild) => guild.name).join(", ")}`,
	);
	if (guilds.length === 0) {
		console.log("║ ❌  No guilds found. Exiting...");
		process.exit(1);
	}
	const foundIn: Guild[] = [];
	for (const guild of guilds) {
		const found = await checkFor(guild, "tomo");
		if (found) {
			foundIn.push(guild);
		}
	}

	if (foundIn.length === 0) {
		console.log("║ ❌  Tomo not found in any guild. Exiting...");
		process.exit(1);
	}
	console.log(
		`║ 👻 Tomo found in ${foundIn.length} guilds: ${foundIn.map((guild) => guild.name).join(", ")}`,
	);
	foundIn.length = 0;

	for (const guild of guilds) {
		const found = await checkFor(guild, "owner");
		if (found) {
			foundIn.push(guild);
		}
	}

	if (foundIn.length === 0) {
		console.log("║ ❌  Owner not found in any guild. Exiting...");
		process.exit(1);
	}
	console.log(
		`║ 👀 Owner found in ${foundIn.length} guilds: ${foundIn.map((guild) => guild.name).join(", ")}`,
	);

	console.log("║ 📡 Registering commands...");
	registerCommands(client.user);
	scheduleJob();

	client.on(Events.InteractionCreate, async (interaction) => {
		if (interaction.isChatInputCommand() || interaction.isContextMenuCommand())
			return executeCommand(interaction);
		if (interaction.isAutocomplete()) return autocomplete(interaction);
	});

	client.user.setPresence({
		activities: [
			{
				type: ActivityType.Custom,
				name: secrets.environment !== "production" ? "dev mode" : "sup!",
			},
		],
		status: secrets.environment !== "production" ? "dnd" : "online",
	});
	console.log(
		`║ 🚀 Started in ${((new Date().getTime() - start.getTime()) / 1000).toFixed(3)} seconds.`,
	);
});

client.login(secrets.discordToken);
