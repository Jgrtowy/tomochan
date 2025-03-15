import { defineConfig } from "drizzle-kit";
import secrets from "./src/secrets";

export default defineConfig({
	out: "./drizzle",
	schema: "./src/db/schema.ts",
	dialect: "postgresql",
	dbCredentials: {
		url: secrets.devDatabaseUrl,
	},
	verbose: true,
});
