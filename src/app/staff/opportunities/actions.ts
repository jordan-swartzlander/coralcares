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

function buildSlotRows(opportunityId: number, config: SchedulingConfig) {
  if (config.capacity < 1) {
    throw new Error("Capacity must be at least 1.");
  }

  const rows: {
    opportunityId: number;
    date: Date;
    startTime: Date;
    endTime: Date;
    capacity: number;
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
  scheduling: SchedulingConfig;
}) {
  await requireActiveStaff();

  const name = input.name.trim();
  if (!name) throw new Error("Name is required.");

  const opportunity = await prisma.opportunity.create({
    data: {
      name,
      description: input.description.trim() || null,
      requiredClearance: input.requiredClearance,
    },
  });

  const rows = buildSlotRows(opportunity.id, input.scheduling);
  if (rows.length > 0) {
    await prisma.slot.createMany({ data: rows });
  }

  revalidatePath("/staff/opportunities");
  revalidatePath("/volunteer");
}

export async function addSlotsToOpportunity(opportunityId: number, scheduling: SchedulingConfig) {
  await requireActiveStaff();
  const rows = buildSlotRows(opportunityId, scheduling);
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
