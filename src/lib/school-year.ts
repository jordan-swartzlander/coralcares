import { prisma } from "@/lib/prisma";

export async function getCurrentSchoolYear(): Promise<string> {
  const settings = await prisma.appSettings.findUnique({ where: { id: 1 } });
  if (!settings) {
    throw new Error("app_settings row is missing (expected id=1 to exist)");
  }
  return settings.currentSchoolYear;
}

export async function getClearanceLevel(
  volunteerId: number,
  schoolYear: string
): Promise<number> {
  const clearance = await prisma.volunteerClearance.findUnique({
    where: { volunteerId_schoolYear: { volunteerId, schoolYear } },
  });
  return clearance?.level ?? 0;
}
