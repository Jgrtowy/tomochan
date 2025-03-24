import type { ApplicationCommandOptionChoiceData, AutocompleteInteraction, ChatInputCommandInteraction, ContextMenuCommandBuilder, ContextMenuCommandInteraction, SlashCommandBuilder } from "discord.js";

interface CommandObject<TBuilder, TInteraction> {
    builder: TBuilder;
    scope: CommandScope;
    run: (interaction: TInteraction) => Promise<void>;
}

interface Autocomplete {
    autocomplete?: (interaction?: AutocompleteInteraction) => Promise<ApplicationCommandOptionChoiceData[]>;
}

export interface SlashCommandObject extends CommandObject<SlashCommandBuilder, ChatInputCommandInteraction>, Autocomplete {}

export interface ContextMenuCommandObject extends CommandObject<ContextMenuCommandBuilder, ContextMenuCommandInteraction> {}

export enum CommandScope {
    Guild = "GUILD",
    Global = "GLOBAL",
}

export interface NamesSchema {
    id: number;
    name: string;
    addedBy: string;
    addedAt: number;
}
