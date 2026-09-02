"use server";

import { requireVolunteerId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentSchoolYear, getClearanceLevel } from "@/lib/school-year";
import { revalidatePath } from "next/cache";

export async function signUpForSlot(slotId: number) {
  const volunteerId = await requireVolunteerId();

  const volunteer = await prisma.volunteer.findUnique({ where: { id: volunteerId } });
  if (!volunteer || volunteer.status !== "APPROVED") {
    revalidatePath("/volunteer");
    return;
  }

  const slot = await prisma.slot.findUnique({
    where: { id: slotId },
    include: { opportunity: true, commitments: { where: { status: "CONFIRMED" } } },
  });
  if (!slot) {
    revalidatePath("/volunteer");
    return;
  }

  const schoolYear = await getCurrentSchoolYear();
  const clearanceLevel = await getClearanceLevel(volunteerId, schoolYear);
  if (clearanceLevel < slot.opportunity.requiredClearance) {
    revalidatePath("/volunteer");
    return;
  }

  const { opportunity } = slot;
  const audienceMatches =
    opportunity.audience === "SCHOOL" ||
    (opportunity.audience === "GRADE" && opportunity.audienceGrade === volunteer.studentGrade) ||
    (opportunity.audience === "CLASSROOM" &&
      opportunity.audienceTeacherId === volunteer.studentTeacherId);
  if (!audienceMatches) {
    revalidatePath("/volunteer");
    return;
  }

  if (slot.commitments.length >= slot.capacity) {
    revalidatePath("/volunteer");
    return;
  }

  await prisma.commitment.upsert({
    where: { volunteerId_slotId: { volunteerId, slotId } },
    update: { status: "CONFIRMED" },
    create: { volunteerId, slotId, status: "CONFIRMED" },
  });

  revalidatePath("/volunteer");
}

export async function updateStudentTeacher(formData: FormData) {
  const volunteerId = await requireVolunteerId();
  const studentTeacherIdRaw = formData.get("studentTeacherId") as string | null;
  const studentTeacherId = studentTeacherIdRaw ? Number(studentTeacherIdRaw) : null;

  await prisma.volunteer.update({
    where: { id: volunteerId },
    data: { studentTeacherId },
  });

  revalidatePath("/volunteer");
}

export async function cancelCommitment(commitmentId: number) {
  const volunteerId = await requireVolunteerId();

  const commitment = await prisma.commitment.findUnique({ where: { id: commitmentId } });
  if (!commitment || commitment.volunteerId !== volunteerId) {
    revalidatePath("/volunteer");
    return;
  }

  await prisma.commitment.update({
    where: { id: commitmentId },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/volunteer");
}
