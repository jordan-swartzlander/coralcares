import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewVolunteerForm } from "./new-volunteer-form";

export default async function NewVolunteerPage() {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    session.user.role !== "staff" ||
    session.user.staffStatus !== "ACTIVE" ||
    (session.user.staffRole !== "OWNER" && session.user.staffRole !== "ADMINISTRATOR")
  ) {
    redirect("/staff/login");
  }

  const teachers = await prisma.teacher.findMany({
    where: { active: true },
    orderBy: [{ grade: "asc" }, { name: "asc" }],
  });

  return (
    <main className="mx-auto max-w-md w-full px-6 py-16">
      <Link href="/staff" className="text-sm underline">
        ← Back to dashboard
      </Link>
      <h1 className="text-2xl font-semibold mt-2 mb-1">New Volunteer</h1>
      <p className="text-sm text-gray-600 mb-8">
        Enter the parent&apos;s info after their background check is approved.
        This will generate a link to send them to complete their account.
      </p>

      <NewVolunteerForm teachers={teachers} />
    </main>
  );
}
