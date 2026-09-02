"use server";

import { requireStaffRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentSchoolYear } from "@/lib/school-year";
import { revalidatePath } from "next/cache";

export async function setBackgroundCheckApproved(volunteerId: number, approved: boolean) {
  const { id: staffId } = await requireStaffRole(["OWNER", "ADMINISTRATOR"]);
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
  await requireStaffRole(["OWNER", "ADMINISTRATOR"]);
  const trimmed = newSchoolYear.trim();
  if (!trimmed) return;

  await prisma.appSettings.update({
    where: { id: 1 },
    data: { currentSchoolYear: trimmed },
  });
  revalidatePath("/staff");
}
