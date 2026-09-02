"use server";

import { requireStaffId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createOpportunity(formData: FormData) {
  await requireStaffId();

  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const description = (formData.get("description") as string | null)?.trim() ?? "";
  const requiredClearance = Number(formData.get("requiredClearance") ?? 0);

  if (!name) return;

  await prisma.opportunity.create({
    data: { name, description: description || null, requiredClearance },
  });

  revalidatePath("/staff/opportunities");
}

export async function setOpportunityActive(opportunityId: number, active: boolean) {
  await requireStaffId();
  await prisma.opportunity.update({
    where: { id: opportunityId },
    data: { active },
  });
  revalidatePath("/staff/opportunities");
  revalidatePath("/volunteer");
}

export async function createSlot(opportunityId: number, formData: FormData) {
  await requireStaffId();

  const dateStr = formData.get("date") as string | null;
  const startTimeStr = formData.get("startTime") as string | null;
  const endTimeStr = formData.get("endTime") as string | null;
  const capacity = Number(formData.get("capacity") ?? 0);

  if (!dateStr || !startTimeStr || !endTimeStr || capacity < 1) return;

  await prisma.slot.create({
    data: {
      opportunityId,
      date: new Date(`${dateStr}T00:00:00Z`),
      startTime: new Date(`1970-01-01T${startTimeStr}:00Z`),
      endTime: new Date(`1970-01-01T${endTimeStr}:00Z`),
      capacity,
    },
  });

  revalidatePath("/staff/opportunities");
  revalidatePath("/volunteer");
}
