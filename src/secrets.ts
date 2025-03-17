interface Secrets {
	environment: "production" | "development" | string;
	discordToken: string;
	tomoId: string;
	ownerId: string;
	databaseUrl: string;
	devDatabaseUrl: string;
	notificationsChannel: string;
}

const secrets = {
	environment: process.env.NODE_ENV ?? "production",
	discordToken: process.env.DISCORD_TOKEN ?? "",
	tomoId: process.env.TOMO_ID ?? "",
	ownerId: process.env.OWNER_ID ?? "",
	databaseUrl: process.env.DATABASE_URL ?? "",
	devDatabaseUrl: process.env.DEV_DATABASE_URL ?? "",
	notificationsChannel: process.env.NOTIFICATIONS_CHANNEL_ID ?? "",
} satisfies Secrets;

const missingVars = Object.entries(secrets).filter(([key, value]) => !value);

if (
	missingVars.length > 0 &&
	!(
		secrets.environment === "development" &&
		missingVars.length === 1 &&
		missingVars[0][0] === "databaseUrl"
	) &&
	!(
		secrets.environment === "production" &&
		missingVars.length === 1 &&
		missingVars[0][0] === "devDatabaseUrl"
	)
) {
	console.error(
		"Missing environment variables:",
		missingVars.map(([key]) => key).join(", "),
	);
}

export default secrets;
