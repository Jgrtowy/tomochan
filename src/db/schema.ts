import { sql } from "drizzle-orm";
import { date, foreignKey, integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const namesSchema = pgTable("names", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull(),
    addedBy: varchar({ length: 255 }).notNull(),
    addedAt: integer().default(sql`extract(epoch from now())`),
    rowNumber: integer(),
    specialDates: varchar({ length: 255 }).array().default(sql`ARRAY[]::text[]`),
    specialDateType: varchar({ length: 255 }).default(sql`null`),
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

export const usedSchema = pgTable("used", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    nameId: integer()
        .notNull()
        .references(() => namesSchema.id, { onDelete: "cascade" }),
    position: integer().notNull(),
});
