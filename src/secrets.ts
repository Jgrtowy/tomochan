import DopplerSDK from "@dopplerhq/node-sdk";
import { version } from "../package.json";
import { logger } from "./lib/log";

const fetched = new Map<string, string>();
if (process.env.DOPPLER_TOKEN) {
    const doppler = new DopplerSDK({ accessToken: process.env.DOPPLER_TOKEN });

    const dopplerRes = (await doppler.secrets.list("tomochan", process.env.DOPPLER_TOKEN?.split(".")[2] ?? "")) as {
        secrets: {
            [key: string]: {
                raw: string;
                [key: string]: unknown;
            };
        };
    };

    for (const [key, value] of Object.entries(dopplerRes.secrets)) {
        if (value && typeof value === "object" && "raw" in value) {
            fetched.set(key, value.raw as string);
        }
    }
}

interface Secrets {
    environment: "production" | "development" | string;
    discordToken: string;
    tomoId: string;
    ownerId: string;
    testGuild: string;
    databaseUrl: string;
    devDatabaseUrl: string;
    notificationsChannel: string;
    version: string;
}

const secrets = {
    environment: process.env.NODE_ENV ?? "production",
    discordToken: fetched.get("DISCORD_TOKEN") ?? process.env.DISCORD_TOKEN ?? "",
    tomoId: fetched.get("TOMO_ID") ?? process.env.TOMO_ID ?? "",
    ownerId: fetched.get("OWNER_ID") ?? process.env.OWNER_ID ?? "",
    testGuild: fetched.get("TEST_GUILD") ?? process.env.TEST_GUILD ?? "",
    databaseUrl: fetched.get("DATABASE_URL") ?? process.env.DATABASE_URL ?? "",
    devDatabaseUrl: fetched.get("DEV_DATABASE_URL") ?? process.env.DEV_DATABASE_URL ?? "",
    notificationsChannel: fetched.get("NOTIFICATIONS_CHANNEL_ID") ?? process.env.NOTIFICATIONS_CHANNEL_ID ?? "",
    version: process.env.npm_package_version ?? version ?? "",
} satisfies Secrets;

const missingVars = Object.entries(secrets).filter(([_key, value]) => !value);

if (missingVars.length > 0 && !(secrets.environment === "development" && missingVars.length === 1 && missingVars[0][0] === "databaseUrl") && !(secrets.environment === "production" && missingVars.length === 1 && missingVars[0][0] === "devDatabaseUrl")) {
    logger()
        .namespace("secrets.ts")
        .error("Missing environment variables:", missingVars.map(([key]) => key).join(", "));
}

export default secrets;
