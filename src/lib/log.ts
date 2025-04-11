import adze, { setup } from "adze";

setup({
    activeLevel: process.env.NODE_ENV === "production" ? "info" : "debug",
    format: "pretty",
    timestampFormatter: () => new Date().toLocaleString("en-GB"),
});

export const logger = () => adze.withEmoji.seal();
