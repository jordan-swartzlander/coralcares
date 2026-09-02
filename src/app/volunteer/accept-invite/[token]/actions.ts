"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export type CompleteInviteState = { error: string } | undefined;

export async function completeVolunteerInvite(
  token: string,
  _prevState: CompleteInviteState,
  formData: FormData
): Promise<CompleteInviteState> {
  const password = (formData.get("password") as string | null) ?? "";
  const confirmPassword = (formData.get("confirmPassword") as string | null) ?? "";

  if (!password) {
    return { error: "Password is required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const invite = await prisma.volunteerInvite.findUnique({ where: { token } });
  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return { error: "This invite link is invalid or has expired." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.volunteer.update({
      where: { id: invite.volunteerId },
      data: { passwordHash, status: "APPROVED" },
    }),
    prisma.volunteerInvite.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    }),
  ]);

  redirect("/volunteer/login");
}
