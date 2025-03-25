import adze, { setup } from "adze";
import secrets from "~/secrets";

setup({
    activeLevel: secrets.environment === "production" ? "info" : "debug",
    format: "pretty",
    timestampFormatter: () => new Date().toLocaleString("en-GB"),
});

export const logger = () => adze.withEmoji.seal();
