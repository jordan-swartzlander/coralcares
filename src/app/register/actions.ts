"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

export type RegisterState = { error: string } | undefined;

export async function registerVolunteer(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const email = (formData.get("email") as string | null)?.trim().toLowerCase() ?? "";
  const phone = (formData.get("phone") as string | null)?.trim() ?? "";
  const studentName = (formData.get("studentName") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const confirmPassword = (formData.get("confirmPassword") as string | null) ?? "";

  if (!name || !email || !studentName || !password) {
    return { error: "Name, email, student name, and password are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await prisma.volunteer.create({
      data: { name, email, phone: phone || null, studentName, passwordHash },
    });
  } catch (err) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: string }).code === "P2002"
    ) {
      return { error: "That email is already registered." };
    }
    throw err;
  }

  redirect("/register/success");
}
