"use server";

import { requireStaffId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentSchoolYear } from "@/lib/school-year";
import { revalidatePath } from "next/cache";

export async function approveVolunteer(volunteerId: number) {
  const staffId = await requireStaffId();
  await prisma.volunteer.update({
    where: { id: volunteerId },
    data: { status: "APPROVED", approvedByStaffId: staffId, approvedAt: new Date() },
  });
  revalidatePath("/staff");
}

export async function denyVolunteer(volunteerId: number) {
  const staffId = await requireStaffId();
  await prisma.volunteer.update({
    where: { id: volunteerId },
    data: { status: "DENIED", approvedByStaffId: staffId, approvedAt: new Date() },
  });
  revalidatePath("/staff");
}

export async function setBackgroundCheckApproved(volunteerId: number, approved: boolean) {
  const staffId = await requireStaffId();
  const schoolYear = await getCurrentSchoolYear();

  await prisma.volunteerClearance.upsert({
    where: { volunteerId_schoolYear: { volunteerId, schoolYear } },
    update: {
      level: approved ? 1 : 0,
      approvedByStaffId: approved ? staffId : null,
      approvedAt: approved ? new Date() : null,
    },
    create: {
      volunteerId,
      schoolYear,
      level: approved ? 1 : 0,
      approvedByStaffId: approved ? staffId : null,
      approvedAt: approved ? new Date() : null,
    },
  });
  revalidatePath("/staff");
}

export async function startNewSchoolYear(newSchoolYear: string) {
  await requireStaffId();
  const trimmed = newSchoolYear.trim();
  if (!trimmed) return;

  await prisma.appSettings.update({
    where: { id: 1 },
    data: { currentSchoolYear: trimmed },
  });
  revalidatePath("/staff");
}
