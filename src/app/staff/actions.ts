"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function requireStaffId(): Promise<number> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return Number(session.user.id);
}

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
