import { SlashCommandBuilder } from "discord.js";
import { CommandScope, type SlashCommandObject } from "~/commands/types";
import { modCommand } from "~/lib/allowed";
import { changeNickname } from "~/lib/scheduler";

export default {
    builder: new SlashCommandBuilder().setName("reroll").setDescription("Reroll Tomo's name."),

    scope: CommandScope.Global,

    run: async (interaction) => {
        if (!modCommand(interaction)) return;

        const name = await changeNickname();
        interaction.reply({
            content: `> 🔁 Rerolled name to ${name}.`,
        });
    },
} as SlashCommandObject;
