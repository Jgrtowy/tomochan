import { sql } from "drizzle-orm";
import { date, integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const namesSchema = pgTable("names", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	name: varchar({ length: 255 }).notNull(),
	addedBy: varchar({ length: 255 }).notNull(),
	addedAt: integer().default(sql`extract(epoch from now())`),
	rowNumber: integer(),
	specialDate: date(),
});

export const guildsSchema = pgTable("guilds", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	guildId: varchar({ length: 255 }).notNull(),
	guildName: varchar({ length: 255 }).notNull(),
});

export const modsSchema = pgTable("mods", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	userId: varchar({ length: 255 }).notNull(),
	displayName: varchar({ length: 255 }).notNull(),
});
