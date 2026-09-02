"use server";

import crypto from "node:crypto";
import { requireStaffRole, type StaffRoleType } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const INVITE_TTL_DAYS = 7;

function isStaffRole(value: unknown): value is StaffRoleType {
  return value === "OWNER" || value === "ADMINISTRATOR" || value === "STAFF";
}

export async function createInvite(formData: FormData) {
  const actor = await requireStaffRole(["OWNER", "ADMINISTRATOR"]);

  const email = (formData.get("email") as string | null)?.trim().toLowerCase() ?? "";
  const role = formData.get("role");
  if (!email || !isStaffRole(role)) {
    throw new Error("Email and role are required.");
  }

  if (role === "OWNER" && actor.role !== "OWNER") {
    throw new Error("Only an Owner can invite another Owner.");
  }

  const existingStaff = await prisma.staff.findUnique({ where: { email } });
  if (existingStaff) {
    throw new Error("A staff account with that email already exists.");
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.staffInvite.create({
    data: { email, role, token, invitedByStaffId: actor.id, expiresAt },
  });

  revalidatePath("/staff/accounts");
}

export async function revokeInvite(inviteId: number) {
  await requireStaffRole(["OWNER", "ADMINISTRATOR"]);
  await prisma.staffInvite.deleteMany({ where: { id: inviteId, usedAt: null } });
  revalidatePath("/staff/accounts");
}

export async function approveStaff(staffId: number) {
  await requireStaffRole(["OWNER", "ADMINISTRATOR"]);
  await prisma.staff.update({ where: { id: staffId }, data: { status: "ACTIVE" } });
  revalidatePath("/staff/accounts");
}

export async function denyStaff(staffId: number) {
  await requireStaffRole(["OWNER", "ADMINISTRATOR"]);
  await prisma.staff.update({ where: { id: staffId }, data: { status: "DENIED" } });
  revalidatePath("/staff/accounts");
}

export async function updateStaffRole(staffId: number, formData: FormData) {
  const actor = await requireStaffRole(["OWNER", "ADMINISTRATOR"]);

  const newRole = formData.get("role");
  if (!isStaffRole(newRole)) {
    throw new Error("Invalid role.");
  }

  if (staffId === actor.id) {
    throw new Error("You cannot change your own role.");
  }

  const target = await prisma.staff.findUnique({ where: { id: staffId } });
  if (!target) {
    throw new Error("Staff account not found.");
  }

  if ((target.role === "OWNER" || newRole === "OWNER") && actor.role !== "OWNER") {
    throw new Error("Only an Owner can grant or change Owner access.");
  }

  if (target.role === "OWNER" && newRole !== "OWNER") {
    const ownerCount = await prisma.staff.count({ where: { role: "OWNER", status: "ACTIVE" } });
    if (ownerCount <= 1) {
      throw new Error("Cannot remove the last remaining Owner.");
    }
  }

  await prisma.staff.update({ where: { id: staffId }, data: { role: newRole } });
  revalidatePath("/staff/accounts");
}
