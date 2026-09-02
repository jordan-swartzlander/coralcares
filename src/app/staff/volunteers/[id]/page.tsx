import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendVolunteerInvite, revokeVolunteerInvite } from "../actions";

const GRADES = ["K", "1", "2", "3", "4", "5"];

export default async function StaffVolunteerReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    session.user.role !== "staff" ||
    session.user.staffStatus !== "ACTIVE" ||
    (session.user.staffRole !== "OWNER" && session.user.staffRole !== "ADMINISTRATOR")
  ) {
    redirect("/staff/login");
  }

  const { id } = await params;
  const volunteerId = Number(id);

  const volunteer = await prisma.volunteer.findUnique({ where: { id: volunteerId } });
  if (!volunteer) notFound();

  const teachers = await prisma.teacher.findMany({
    where: { active: true },
    orderBy: [{ grade: "asc" }, { name: "asc" }],
  });

  const activeInvite = await prisma.volunteerInvite.findFirst({
    where: { volunteerId, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "";
  const link = activeInvite ? `${baseUrl}/volunteer/accept-invite/${activeInvite.token}` : null;

  const smsText = link
    ? `Coral Academy NW: Hi ${volunteer.name}, you're cleared to volunteer! Set up your account here: ${link}`
    : null;

  const emailText = link
    ? `Hi ${volunteer.name},

Thanks for your interest in volunteering at Coral Academy NW, and for completing the background check process. You're all set to create your volunteer account.

Click the link below to set a password and get started:
${link}

This link will expire in 7 days. If you have any questions, feel free to reach out to the school office.

Thank you for volunteering!
Coral Academy NW`
    : null;

  return (
    <main className="mx-auto max-w-lg w-full px-6 py-16">
      <Link href="/staff" className="text-sm underline">
        ← Back to dashboard
      </Link>
      <h1 className="text-2xl font-semibold mt-2 mb-1">Review Volunteer</h1>
      <p className="text-sm text-gray-600 mb-8">
        {volunteer.email} — status: {volunteer.status}
      </p>

      {volunteer.status === "APPROVED" && (
        <p className="text-sm text-gray-600 mb-6">
          This volunteer already completed their account setup.
        </p>
      )}

      {volunteer.status !== "APPROVED" && (
        <form
          action={sendVolunteerInvite.bind(null, volunteer.id)}
          className="flex flex-col gap-4 mb-10"
        >
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Full name</span>
            <input
              name="name"
              type="text"
              defaultValue={volunteer.name}
              required
              className="border border-gray-300 rounded-md px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Phone (optional)</span>
            <input
              name="phone"
              type="tel"
              defaultValue={volunteer.phone ?? ""}
              className="border border-gray-300 rounded-md px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Student&apos;s name</span>
            <input
              name="studentName"
              type="text"
              defaultValue={volunteer.studentName ?? ""}
              required
              className="border border-gray-300 rounded-md px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Student&apos;s grade</span>
            <select
              name="studentGrade"
              defaultValue={volunteer.studentGrade ?? ""}
              required
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="" disabled>
                Select a grade
              </option>
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {g === "K" ? "Kindergarten" : `Grade ${g}`}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Student&apos;s teacher (optional)</span>
            <select
              name="studentTeacherId"
              defaultValue={volunteer.studentTeacherId ?? ""}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">No teacher selected</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.grade === "K" ? "Kindergarten" : `Grade ${t.grade}`})
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="bg-black text-white rounded-md px-4 py-2 self-start"
          >
            {activeInvite ? "Resend Invite" : "Send Invite"}
          </button>
        </form>
      )}

      {activeInvite && link && (
        <div className="flex flex-col gap-6 border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Invite Link</h2>
            <form action={revokeVolunteerInvite.bind(null, activeInvite.id, volunteer.id)}>
              <button type="submit" className="text-xs text-red-600 underline">
                Revoke
              </button>
            </form>
          </div>

          <code className="text-xs bg-gray-100 text-gray-900 rounded px-2 py-1 break-all select-all">
            {link}
          </code>

          <div>
            <h3 className="text-sm font-medium mb-1">Text message</h3>
            <p className="text-xs bg-gray-100 text-gray-900 rounded px-3 py-2 whitespace-pre-wrap select-all">
              {smsText}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-1">Email</h3>
            <p className="text-xs bg-gray-100 text-gray-900 rounded px-3 py-2 whitespace-pre-wrap select-all">
              {emailText}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
