import { CronJob, validateCronExpression } from "cron";
import { ActivityType, type Client, type ClientApplication } from "discord.js";
import { and, arrayContains, count, eq, notInArray, sql } from "drizzle-orm";
import { namesSchema, usedSchema } from "~/db/schema";
import { client, db, guilds } from "~/index";
import { guildsList } from "~/lib/allowed";
import secrets from "~/secrets";
import { logger } from "./log";

const log = logger().namespace("scheduler.ts").seal();
let jobsEnabled = true;

export const checkForSpecialDate = async (scheduled: boolean | undefined = false) => {
    const today = new Date();
    const dateString = `${today.getDate().toString().padStart(2, "0")}/${(today.getMonth() + 1).toString().padStart(2, "0")}`;
    const todayName = await db
        .select()
        .from(namesSchema)
        .where(arrayContains(namesSchema.specialDates, [`${dateString}`]))
        .limit(1);
    if (todayName.length > 0) {
        jobsEnabled && log.info(`Special date found: ${todayName[0].name}`);
        jobsEnabled = false;
        changeNickname(true, { id: todayName[0].id, name: todayName[0].name });
        return;
    }
    changeNickname(scheduled);
    jobsEnabled = true;
    return;
};

export function scheduleJob() {
    const interval = "0 */15 * * * *";
    log.info(`Scheduling jobs with interval ${validateCronExpression(interval) ? "valid" : "invalid"}: ${interval}`);
    new CronJob(
        "0 0 0 * * *",
        async () => {
            checkForSpecialDate(true);
        },
        null,
        true,
        "Europe/Warsaw",
    );
    new CronJob(
        interval,
        () => {
            jobsEnabled && changeNickname();
        },
        null,
        true,
        "Europe/Warsaw",
    );
    new CronJob(
        interval,
        () => {
            jobsEnabled && setPresence();
        },
        null,
        true,
        "Europe/Warsaw",
    );
}

export async function changeNickname(change: boolean | undefined = true, desired?: { id: number; name: string }): Promise<undefined | string> {
    if (desired) {
        for (const guild of guildsList) {
            const foundIn = guilds.find((g) => g.id === guild.guildId);
            if (!foundIn) {
                continue;
            }
            const member = await foundIn.members.fetch(secrets.tomoId).catch(() => null);
            if (!member) continue;
            if (!member.manageable) {
                log.error(`Insufficient permissions in ${foundIn.name}.`);
                continue;
            }
            change && (await member.setNickname(desired.name));
        }

        log.success(`${change ? "" : "(not)"} ${desired.name} @ ${new Date().toLocaleString()}`);

        const highestPositionResult = await db.select({ maxPos: sql<number>`COALESCE(MAX(position), 0)` }).from(usedSchema);
        const nextPosition = (highestPositionResult[0]?.maxPos || 0) + 1;
        await db.insert(usedSchema).values({
            nameId: desired.id,
            position: nextPosition,
        });

        return desired.name;
    }
    const used = await db
        .select({ id: usedSchema.nameId })
        .from(usedSchema)
        .then((res) => res.map((r) => r.id));
    const name = (
        await db
            .select()
            .from(namesSchema)
            .where(and(used.length ? notInArray(namesSchema.id, used) : sql`1=1`, eq(namesSchema.isExcluded, false)))
            .orderBy(sql`RANDOM()`)
            .limit(1)
    )[0] as { id: number; name: string };

    if (!name) return;

    for (const guild of guildsList) {
        const foundIn = guilds.find((g) => g.id === guild.guildId);
        if (!foundIn) {
            continue;
        }
        const member = await foundIn.members.fetch(secrets.tomoId).catch(() => null);
        if (!member) continue;
        if (!member.manageable) {
            log.error(`Insufficient permissions in ${foundIn.name}.`);
            continue;
        }
        change && (await member.setNickname(name.name));
    }

    const highestPositionResult = await db.select({ maxPos: sql<number>`COALESCE(MAX(position), 0)` }).from(usedSchema);
    const nextPosition = (highestPositionResult[0]?.maxPos || 0) + 1;
    await db.insert(usedSchema).values({
        nameId: name.id,
        position: nextPosition,
    });

    log.success(`${change ? "" : "(not)"} ${name.name} @ ${new Date().toLocaleString()}`);

    return name.name;
}

export async function setPresence() {
    if (!client.user) return;
    const total = await db.select({ count: count() }).from(namesSchema);
    client.user.setPresence({
        activities: [
            {
                type: ActivityType.Custom,
                name: secrets.environment !== "production" ? "yoghurt's breaking stuff" : `Comes with ${total[0].count} Tomo's!`,
            },
        ],
        status: secrets.environment !== "production" ? "dnd" : "online",
    });
}

export async function setDescription(application: ClientApplication) {
    if (!application) return;
    await client.application?.edit({
        description: `Running tomochan v${secrets.version} | ${secrets.environment !== "production" ? "Development" : "Production"} | ${guildsList.length} guilds`,
    });
}
