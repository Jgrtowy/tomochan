import { sql } from "drizzle-orm";
import { date, integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const names = pgTable("names", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	name: varchar({ length: 255 }).notNull(),
	addedBy: varchar({ length: 255 }).notNull(),
	addedAt: integer().default(sql`extract(epoch from now())`),
	rowNumber: integer(),
	specialDate: date(),
});

export const guilds = pgTable("guilds", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	guildId: varchar({ length: 255 }).notNull(),
});
