"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { requireStaffRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentSchoolYear } from "@/lib/school-year";
import { revalidatePath } from "next/cache";

const INVITE_TTL_DAYS = 7;
const VALID_GRADES = ["K", "1", "2", "3", "4", "5"];

export type CreateVolunteerState = { error: string } | undefined;

export async function createAndInviteVolunteer(
  _prevState: CreateVolunteerState,
  formData: FormData
): Promise<CreateVolunteerState> {
  const actor = await requireStaffRole(["OWNER", "ADMINISTRATOR"]);

  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const email = (formData.get("email") as string | null)?.trim().toLowerCase() ?? "";
  const phone = (formData.get("phone") as string | null)?.trim() ?? "";
  const studentName = (formData.get("studentName") as string | null)?.trim() ?? "";
  const studentGrade = formData.get("studentGrade") as string | null;
  const studentTeacherIdRaw = formData.get("studentTeacherId") as string | null;
  const studentTeacherId = studentTeacherIdRaw ? Number(studentTeacherIdRaw) : null;

  if (!name || !email || !studentName || !studentGrade || !VALID_GRADES.includes(studentGrade)) {
    return { error: "Name, email, student name, and student grade are required." };
  }

  let volunteerId: number;
  try {
    const volunteer = await prisma.volunteer.create({
      data: {
        name,
        email,
        phone: phone || null,
        studentName,
        studentGrade,
        studentTeacherId,
        status: "INVITED",
      },
    });
    volunteerId = volunteer.id;
  } catch (err) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: string }).code === "P2002"
    ) {
      return { error: "A volunteer with that email already exists." };
    }
    throw err;
  }

  const schoolYear = await getCurrentSchoolYear();
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.volunteerClearance.upsert({
      where: { volunteerId_schoolYear: { volunteerId, schoolYear } },
      update: { level: 1, approvedByStaffId: actor.id, approvedAt: new Date() },
      create: {
        volunteerId,
        schoolYear,
        level: 1,
        approvedByStaffId: actor.id,
        approvedAt: new Date(),
      },
    }),
    prisma.volunteerInvite.create({
      data: { volunteerId, token, invitedByStaffId: actor.id, expiresAt },
    }),
  ]);

  revalidatePath("/staff");
  redirect(`/staff/volunteers/${volunteerId}`);
}

export async function sendVolunteerInvite(volunteerId: number, formData: FormData) {
  const actor = await requireStaffRole(["OWNER", "ADMINISTRATOR"]);

  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const phone = (formData.get("phone") as string | null)?.trim() ?? "";
  const studentName = (formData.get("studentName") as string | null)?.trim() ?? "";
  const studentGrade = formData.get("studentGrade") as string | null;
  const studentTeacherIdRaw = formData.get("studentTeacherId") as string | null;
  const studentTeacherId = studentTeacherIdRaw ? Number(studentTeacherIdRaw) : null;

  if (!name || !studentName || !studentGrade || !VALID_GRADES.includes(studentGrade)) {
    throw new Error("Name, student name, and student grade are required.");
  }

  const schoolYear = await getCurrentSchoolYear();
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.volunteer.update({
      where: { id: volunteerId },
      data: {
        name,
        phone: phone || null,
        studentName,
        studentGrade,
        studentTeacherId,
        status: "INVITED",
      },
    }),
    prisma.volunteerClearance.upsert({
      where: { volunteerId_schoolYear: { volunteerId, schoolYear } },
      update: { level: 1, approvedByStaffId: actor.id, approvedAt: new Date() },
      create: {
        volunteerId,
        schoolYear,
        level: 1,
        approvedByStaffId: actor.id,
        approvedAt: new Date(),
      },
    }),
    prisma.volunteerInvite.create({
      data: { volunteerId, token, invitedByStaffId: actor.id, expiresAt },
    }),
  ]);

  revalidatePath(`/staff/volunteers/${volunteerId}`);
  revalidatePath("/staff");
}

export async function revokeVolunteerInvite(inviteId: number, volunteerId: number) {
  await requireStaffRole(["OWNER", "ADMINISTRATOR"]);
  await prisma.volunteerInvite.deleteMany({ where: { id: inviteId, usedAt: null } });
  revalidatePath(`/staff/volunteers/${volunteerId}`);
  revalidatePath("/staff");
}
