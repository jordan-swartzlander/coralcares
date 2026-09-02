"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export type CompleteInviteState = { error: string } | undefined;

export async function completeStaffInvite(
  token: string,
  _prevState: CompleteInviteState,
  formData: FormData
): Promise<CompleteInviteState> {
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const confirmPassword = (formData.get("confirmPassword") as string | null) ?? "";

  if (!name || !password) {
    return { error: "Name and password are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const invite = await prisma.staffInvite.findUnique({ where: { token } });
  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return { error: "This invite link is invalid or has expired." };
  }

  const existingStaff = await prisma.staff.findUnique({ where: { email: invite.email } });
  if (existingStaff) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.staff.create({
      data: {
        email: invite.email,
        name,
        passwordHash,
        role: invite.role,
        status: "PENDING_APPROVAL",
      },
    }),
    prisma.staffInvite.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    }),
  ]);

  redirect("/staff/login");
}
