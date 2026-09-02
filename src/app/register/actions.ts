"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export type RegisterState = { error: string } | undefined;

export async function registerVolunteer(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const email = (formData.get("email") as string | null)?.trim().toLowerCase() ?? "";
  const phone = (formData.get("phone") as string | null)?.trim() ?? "";
  const studentName = (formData.get("studentName") as string | null)?.trim() ?? "";

  if (!name || !email || !studentName) {
    return { error: "Name, email, and student name are required." };
  }

  try {
    await prisma.volunteer.create({
      data: { name, email, phone: phone || null, studentName },
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
