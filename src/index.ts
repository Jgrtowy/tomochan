import { Client, Events, GatewayIntentBits, type Guild, IntentsBitField, Partials } from "discord.js";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { autocomplete, executeCommand, registerCommands } from "~/commands";
import { guildsList, modsList, pullAllowed } from "~/lib/allowed";
import { checkForSpecialDate, scheduleJob as scheduleJobs, setDescription, setPresence } from "~/lib/scheduler";
import secrets from "~/secrets";
import { logger } from "./lib/log";
import { sendDeployNotification } from "./lib/notifications";

export const botStart = new Date();

const log = logger().namespace("index.ts").seal();
log.timestamp.info(`🤖 TomoChan's starting! ${secrets.environment === "production" ? "Production" : "Development"} | v${secrets.version}`);
export let db: NodePgDatabase;

try {
    db = drizzle(secrets.environment !== "production" ? secrets.devDatabaseUrl : secrets.databaseUrl);
} catch (e) {
    log.error("Error connecting to the database:", e);
    process.exit(1);
}

process.on("SIGINT", () => {
    process.exit();
});

process.on("SIGTERM", () => {
    process.exit();
});

process.on("SIGKILL", () => {
    process.exit();
});

export const client = new Client({
    intents: [IntentsBitField.Flags.Guilds, GatewayIntentBits.GuildVoiceStates, IntentsBitField.Flags.GuildMembers, GatewayIntentBits.GuildMembers],
    partials: [Partials.Channel, Partials.Message, Partials.GuildMember],
});

export let guilds: Guild[] = [];

client.once(Events.ClientReady, async (client) => {
    guilds = client.guilds.cache.map((guild) => guild);
    log.info(`Guilds: ${guilds.map((guild) => guild.name).join(", ")}`);
    if (guilds.length === 0) {
        log.error("No guilds found. Exiting...");
        process.exit(1);
    }

    log.info("Registering commands...");
    await registerCommands(client.user);
    await pullAllowed();
    await checkForSpecialDate();
    scheduleJobs();

    log.info("Allowed guilds:", guildsList.map((guild) => guild.guildName).join(", "));
    log.info("Allowed mods:", modsList.map((mod) => mod.displayName).join(", "));

    client.on(Events.InteractionCreate, async (interaction) => {
        if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) return executeCommand(interaction);
        if (interaction.isAutocomplete()) return autocomplete(interaction);
    });

    await setPresence();
    await setDescription(client.application);
    if (secrets.environment === "production") sendDeployNotification(client);
    log.success(`🚀 Ready in ${((new Date().getTime() - botStart.getTime()) / 1000).toFixed(3)} seconds.`);
});

client.login(secrets.discordToken);
