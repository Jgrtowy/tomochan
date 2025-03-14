interface Secrets {
	environment: "production" | "development" | string;
	discordToken: string;
	tomoId: string;
	ownerId: string;
}

const secrets: Secrets = {
	environment: process.env.NODE_ENV ?? "production",
	discordToken: process.env.DISCORD_TOKEN ?? "",
	tomoId: process.env.TOMO_ID ?? "",
	ownerId: process.env.OWNER_ID ?? "",
};

if (Object.values(secrets).includes(""))
	throw new Error("Not all environment variables are set.");

export default secrets;
