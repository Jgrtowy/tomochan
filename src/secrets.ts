interface Secrets {
	environment: "production" | "development" | string;
	discordToken: string;
	tomoId: string;
	ownerId: string;
	databaseUrl: string;
	devDatabaseUrl: string;
}

const secrets: Secrets = {
	environment: process.env.NODE_ENV ?? "production",
	discordToken: process.env.DISCORD_TOKEN ?? "",
	tomoId: process.env.TOMO_ID ?? "",
	ownerId: process.env.OWNER_ID ?? "",
	databaseUrl: process.env.DATABASE_URL ?? "",
	devDatabaseUrl: process.env.DEV_DATABASE_URL ?? "",
};

if (Object.values(secrets).includes(""))
	if (
		(secrets.environment === "production" && secrets.databaseUrl === "") ||
		(secrets.environment === "development" && secrets.devDatabaseUrl === "")
	)
		throw new Error("Not all environment variables are set.");

export default secrets;
