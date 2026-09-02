"use server";

import { requireStaffRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const VALID_GRADES = ["K", "1", "2", "3", "4", "5"];

export async function createTeacher(formData: FormData) {
  await requireStaffRole(["OWNER", "ADMINISTRATOR"]);

  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const grade = formData.get("grade") as string | null;

  if (!name || !grade || !VALID_GRADES.includes(grade)) return;

  await prisma.teacher.create({ data: { name, grade } });
  revalidatePath("/staff/teachers");
}

export async function updateTeacher(teacherId: number, formData: FormData) {
  await requireStaffRole(["OWNER", "ADMINISTRATOR"]);

  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const grade = formData.get("grade") as string | null;

  if (!name || !grade || !VALID_GRADES.includes(grade)) return;

  await prisma.teacher.update({ where: { id: teacherId }, data: { name, grade } });
  revalidatePath("/staff/teachers");
}

export async function setTeacherActive(teacherId: number, active: boolean) {
  await requireStaffRole(["OWNER", "ADMINISTRATOR"]);
  await prisma.teacher.update({ where: { id: teacherId }, data: { active } });
  revalidatePath("/staff/teachers");
}
