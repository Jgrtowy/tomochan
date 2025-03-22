
import {
	Client,
	Events,
	GatewayIntentBits,
	type Guild,
	IntentsBitField,
	Partials,
} from "discord.js";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { autocomplete, executeCommand, registerCommands } from "~/commands";
import { guildsList, modsList, updateAllowed } from "~/lib/allowed";
import { scheduleJob, setPresence } from "~/lib/scheduler";
import secrets from "~/secrets";
import { sendDeployNotification } from "./lib/notifications";

export const botStart = new Date();

console.log(`╔════════════════════════════════════════════════════
║ 🤖 TomoChan's starting! ${botStart.toLocaleString()}
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
			`║ 📋 Joined guilds: [${client.guilds.cache.map(() => {}).length}]: ${client.guilds.cache.map((guild) => guild.name).join(", ")}`,
	);
	if (guilds.length === 0) {
		console.log("║ ❌  No guilds found. Exiting...");
		process.exit(1);
	}

	console.log("║ 📡 Registering commands...");
	registerCommands(client.user);
	await updateAllowed();
	scheduleJob();

	console.log(
		"║ ⚔️  Allowed guilds:",
		guildsList.map((guild) => guild.guildName).join(", "),
	);

	console.log("║ 👑 Mods:", modsList.map((mod) => mod.displayName).join(", "));

	client.on(Events.InteractionCreate, async (interaction) => {
		if (interaction.isChatInputCommand() || interaction.isContextMenuCommand())
			return executeCommand(interaction);
		if (interaction.isAutocomplete()) return autocomplete(interaction);
	});

	setPresence();
	if (secrets.environment === "production") sendDeployNotification(client);
	console.log(
		`║ 🚀 Started in ${((new Date().getTime() - botStart.getTime()) / 1000).toFixed(3)} seconds.`,
	);
});

client.login(secrets.discordToken);
