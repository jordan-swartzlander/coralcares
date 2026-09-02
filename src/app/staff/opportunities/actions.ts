"use server";

import { requireActiveStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type SchedulingConfig =
  | {
      mode: "dates";
      dates: string[];
      slotsPerDate: number;
      sameTime: true;
      startTime: string;
      endTime: string;
      capacity: number;
    }
  | {
      mode: "dates";
      dates: string[];
      slotsPerDate: number;
      sameTime: false;
      times: { startTime: string; endTime: string }[];
      capacity: number;
    }
  | {
      mode: "recurring";
      startDate: string;
      endDate: string;
      daysOfWeek: number[];
      slotsPerOccurrence: number;
      startTime: string;
      endTime: string;
      capacity: number;
    };

function toDate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00Z`);
}

function toTime(timeStr: string) {
  return new Date(`1970-01-01T${timeStr}:00Z`);
}

function datesInRange(startDate: string, endDate: string, daysOfWeek: number[]): string[] {
  const dates: string[] = [];
  const start = toDate(startDate);
  const end = toDate(endDate);
  for (let d = start; d <= end; d = new Date(d.getTime() + 86400000)) {
    if (daysOfWeek.includes(d.getUTCDay())) {
      dates.push(d.toISOString().slice(0, 10));
    }
  }
  return dates;
}

export type AudienceConfig =
  | { audience: "SCHOOL" }
  | { audience: "GRADE"; audienceGrade: string }
  | { audience: "CLASSROOM"; audienceTeacherId: number };

// An "inherit" override means the slot has no audience of its own and just
// follows its parent Opportunity's audience — the normal case. A batch of
// slots can instead be tagged with its own audience, letting one event
// (e.g. an all-day Jog-a-thon) mix grade-specific shifts under one
// opportunity instead of staff creating a separate opportunity per grade.
export type SlotAudienceOverride = { mode: "inherit" } | ({ mode: "override" } & AudienceConfig);

function validateAudience(audience: AudienceConfig) {
  if (audience.audience === "GRADE" && !audience.audienceGrade) {
    throw new Error("Select a grade.");
  }
  if (audience.audience === "CLASSROOM" && !audience.audienceTeacherId) {
    throw new Error("Select a teacher.");
  }
}

function buildSlotRows(
  opportunityId: number,
  config: SchedulingConfig,
  audienceOverride: SlotAudienceOverride
) {
  if (config.capacity < 1) {
    throw new Error("Capacity must be at least 1.");
  }

  if (audienceOverride.mode === "override") {
    validateAudience(audienceOverride);
  }

  const audienceFields =
    audienceOverride.mode === "override"
      ? {
          audienceOverride: audienceOverride.audience,
          audienceGrade: audienceOverride.audience === "GRADE" ? audienceOverride.audienceGrade : null,
          audienceTeacherId:
            audienceOverride.audience === "CLASSROOM" ? audienceOverride.audienceTeacherId : null,
        }
      : { audienceOverride: null, audienceGrade: null, audienceTeacherId: null };

  const rows: {
    opportunityId: number;
    date: Date;
    startTime: Date;
    endTime: Date;
    capacity: number;
    audienceOverride: "SCHOOL" | "GRADE" | "CLASSROOM" | null;
    audienceGrade: string | null;
    audienceTeacherId: number | null;
  }[] = [];

  if (config.mode === "dates") {
    if (config.dates.length === 0) throw new Error("Add at least one date.");
    if (config.slotsPerDate < 1) throw new Error("Slots per date must be at least 1.");
    if (!config.sameTime && config.times.length !== config.slotsPerDate) {
      throw new Error("Provide a time for every slot.");
    }

    for (const dateStr of config.dates) {
      const date = toDate(dateStr);
      for (let i = 0; i < config.slotsPerDate; i++) {
        const { startTime, endTime } = config.sameTime ? config : config.times[i];
        rows.push({
          opportunityId,
          date,
          startTime: toTime(startTime),
          endTime: toTime(endTime),
          capacity: config.capacity,
          ...audienceFields,
        });
      }
    }
  } else {
    if (config.daysOfWeek.length === 0) throw new Error("Select at least one day of the week.");
    if (config.slotsPerOccurrence < 1) {
      throw new Error("Slots per occurrence must be at least 1.");
    }
    if (toDate(config.endDate) < toDate(config.startDate)) {
      throw new Error("End date must be on or after the start date.");
    }

    const dates = datesInRange(config.startDate, config.endDate, config.daysOfWeek);
    for (const dateStr of dates) {
      const date = toDate(dateStr);
      for (let i = 0; i < config.slotsPerOccurrence; i++) {
        rows.push({
          opportunityId,
          date,
          startTime: toTime(config.startTime),
          endTime: toTime(config.endTime),
          capacity: config.capacity,
          ...audienceFields,
        });
      }
    }
  }

  return rows;
}

export async function createOpportunityWithSlots(input: {
  name: string;
  description: string;
  requiredClearance: number;
  audience: AudienceConfig;
  scheduling: SchedulingConfig;
  slotAudience: SlotAudienceOverride;
}) {
  await requireActiveStaff();

  const name = input.name.trim();
  if (!name) throw new Error("Name is required.");

  validateAudience(input.audience);

  const opportunity = await prisma.opportunity.create({
    data: {
      name,
      description: input.description.trim() || null,
      requiredClearance: input.requiredClearance,
      audience: input.audience.audience,
      audienceGrade: input.audience.audience === "GRADE" ? input.audience.audienceGrade : null,
      audienceTeacherId:
        input.audience.audience === "CLASSROOM" ? input.audience.audienceTeacherId : null,
    },
  });

  const rows = buildSlotRows(opportunity.id, input.scheduling, input.slotAudience);
  if (rows.length > 0) {
    await prisma.slot.createMany({ data: rows });
  }

  revalidatePath("/staff/opportunities");
  revalidatePath("/volunteer");
}

export async function addSlotsToOpportunity(
  opportunityId: number,
  scheduling: SchedulingConfig,
  slotAudience: SlotAudienceOverride
) {
  await requireActiveStaff();
  const rows = buildSlotRows(opportunityId, scheduling, slotAudience);
  if (rows.length > 0) {
    await prisma.slot.createMany({ data: rows });
  }
  revalidatePath("/staff/opportunities");
  revalidatePath("/volunteer");
}

export async function setOpportunityActive(opportunityId: number, active: boolean) {
  await requireActiveStaff();
  await prisma.opportunity.update({
    where: { id: opportunityId },
    data: { active },
  });
  revalidatePath("/staff/opportunities");
  revalidatePath("/volunteer");
}

export async function deleteSlot(slotId: number) {
  await requireActiveStaff();

  const existingCommitment = await prisma.commitment.findFirst({ where: { slotId } });
  if (existingCommitment) {
    throw new Error("Cannot delete a slot that has volunteer signup history.");
  }

  await prisma.slot.delete({ where: { id: slotId } });
  revalidatePath("/staff/opportunities");
  revalidatePath("/volunteer");
}
