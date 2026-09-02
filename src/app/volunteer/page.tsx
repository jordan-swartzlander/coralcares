import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentSchoolYear, getClearanceLevel } from "@/lib/school-year";
import { signUpForSlot, cancelCommitment, updateStudentTeacher } from "./actions";
import { SignOutButton } from "./sign-out-button";
import { formatSlotDate, formatSlotTime } from "@/lib/format";

export default async function VolunteerPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "volunteer") {
    redirect("/volunteer/login");
  }

  const volunteerId = Number(session.user.id);
  const volunteer = await prisma.volunteer.findUnique({ where: { id: volunteerId } });

  if (!volunteer) {
    redirect("/volunteer/login");
  }

  const teachers = await prisma.teacher.findMany({
    where: { active: true },
    orderBy: [{ grade: "asc" }, { name: "asc" }],
  });

  return (
    <main className="mx-auto max-w-3xl w-full px-6 py-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Volunteer Dashboard</h1>
          <p className="text-sm text-gray-600">Signed in as {volunteer.email}</p>
        </div>
        <SignOutButton />
      </div>

      {volunteer.studentName && (
        <section className="mb-8 border-b border-gray-200 pb-6">
          <p className="text-sm text-gray-600 mb-2">
            Student: <span className="font-medium">{volunteer.studentName}</span>
            {volunteer.studentGrade && ` — Grade ${volunteer.studentGrade}`}
          </p>
          <form action={updateStudentTeacher} className="flex items-end gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium">Teacher</span>
              <select
                name="studentTeacherId"
                defaultValue={volunteer.studentTeacherId ?? ""}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm"
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
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              Save
            </button>
          </form>
        </section>
      )}

      {volunteer.status === "PENDING" && (
        <p className="text-sm text-gray-600">
          Your application is still under review by school staff. Check back
          once you&apos;ve been approved to sign up for opportunities.
        </p>
      )}

      {volunteer.status === "DENIED" && (
        <p className="text-sm text-gray-600">
          Your application was not approved. Please contact the school office
          if you have questions.
        </p>
      )}

      {volunteer.status === "APPROVED" && (
        <ApprovedVolunteerGate
          volunteerId={volunteer.id}
          studentGrade={volunteer.studentGrade}
          studentTeacherId={volunteer.studentTeacherId}
        />
      )}
    </main>
  );
}

async function ApprovedVolunteerGate({
  volunteerId,
  studentGrade,
  studentTeacherId,
}: {
  volunteerId: number;
  studentGrade: string | null;
  studentTeacherId: number | null;
}) {
  const schoolYear = await getCurrentSchoolYear();
  const clearanceLevel = await getClearanceLevel(volunteerId, schoolYear);

  if (clearanceLevel < 1) {
    return (
      <p className="text-sm text-gray-600">
        Your background check has expired for the {schoolYear} school year.
        Please submit new background check paperwork with the school office to
        continue volunteering.
      </p>
    );
  }

  return (
    <ApprovedVolunteerView
      volunteerId={volunteerId}
      clearanceLevel={clearanceLevel}
      studentGrade={studentGrade}
      studentTeacherId={studentTeacherId}
    />
  );
}

async function ApprovedVolunteerView({
  volunteerId,
  clearanceLevel,
  studentGrade,
  studentTeacherId,
}: {
  volunteerId: number;
  clearanceLevel: number;
  studentGrade: string | null;
  studentTeacherId: number | null;
}) {
  const [opportunities, mySignupCommitments] = await Promise.all([
    prisma.opportunity.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      include: {
        slots: {
          orderBy: { date: "asc" },
          include: { commitments: { where: { status: "CONFIRMED" } } },
        },
        audienceTeacher: true,
      },
    }),
    prisma.commitment.findMany({
      where: { volunteerId, status: "CONFIRMED" },
      include: { slot: { include: { opportunity: true } } },
      orderBy: { slot: { date: "asc" } },
    }),
  ]);

  function isVisible(opportunity: (typeof opportunities)[number]) {
    if (opportunity.audience === "SCHOOL") return true;
    if (opportunity.audience === "GRADE") return opportunity.audienceGrade === studentGrade;
    if (opportunity.audience === "CLASSROOM") {
      return opportunity.audienceTeacherId === studentTeacherId;
    }
    return false;
  }

  function audienceLabel(opportunity: (typeof opportunities)[number]) {
    if (opportunity.audience === "GRADE") {
      const g = opportunity.audienceGrade;
      return `Grade ${g === "K" ? "Kindergarten" : g} only`;
    }
    if (opportunity.audience === "CLASSROOM") {
      return opportunity.audienceTeacher
        ? `${opportunity.audienceTeacher.name}'s classroom only`
        : "Specific classroom only";
    }
    return null;
  }

  const mySignups = mySignupCommitments.map((c) => ({
    commitmentId: c.id,
    opportunityName: c.slot.opportunity.name,
    date: c.slot.date,
    startTime: c.slot.startTime,
    endTime: c.slot.endTime,
  }));

  return (
    <>
      <section className="mb-12">
        <h2 className="text-lg font-semibold mb-4">My Signups</h2>
        {mySignups.length === 0 ? (
          <p className="text-sm text-gray-600">
            You haven&apos;t signed up for anything yet.
          </p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b border-gray-300">
                <th className="py-2 pr-4">Opportunity</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Time</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {mySignups.map((s) => (
                <tr key={s.commitmentId} className="border-b border-gray-100">
                  <td className="py-3 pr-4">{s.opportunityName}</td>
                  <td className="py-3 pr-4">{formatSlotDate(s.date)}</td>
                  <td className="py-3 pr-4">
                    {formatSlotTime(s.startTime)} – {formatSlotTime(s.endTime)}
                  </td>
                  <td className="py-3">
                    <form action={cancelCommitment.bind(null, s.commitmentId)}>
                      <button
                        type="submit"
                        className="bg-red-600 text-white rounded-md px-3 py-1"
                      >
                        Cancel
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Opportunities</h2>
        {opportunities.length === 0 ? (
          <p className="text-sm text-gray-600">
            No opportunities are posted right now.
          </p>
        ) : (
          <div className="flex flex-col gap-8">
            {opportunities.map((opportunity) => {
              const eligible = clearanceLevel >= opportunity.requiredClearance;

              if (!isVisible(opportunity)) {
                return (
                  <div key={opportunity.id}>
                    <h3 className="font-medium text-gray-500">{opportunity.name}</h3>
                    <p className="text-sm text-gray-500">{audienceLabel(opportunity)}</p>
                  </div>
                );
              }

              return (
                <div key={opportunity.id}>
                  <h3 className="font-medium">{opportunity.name}</h3>
                  {audienceLabel(opportunity) && (
                    <p className="text-xs text-gray-500 mb-1">{audienceLabel(opportunity)}</p>
                  )}
                  {opportunity.description && (
                    <p className="text-sm text-gray-600 mb-2">
                      {opportunity.description}
                    </p>
                  )}
                  {!eligible && (
                    <p className="text-sm text-amber-600 mb-2">
                      Requires clearance level {opportunity.requiredClearance}.
                      Your current level is {clearanceLevel}.
                    </p>
                  )}
                  {opportunity.slots.length === 0 ? (
                    <p className="text-sm text-gray-600">No slots posted yet.</p>
                  ) : (
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="text-left border-b border-gray-300">
                          <th className="py-2 pr-4">Date</th>
                          <th className="py-2 pr-4">Time</th>
                          <th className="py-2 pr-4">Spots</th>
                          <th className="py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {opportunity.slots.map((slot) => {
                          const alreadySignedUp = slot.commitments.some(
                            (c) => c.volunteerId === volunteerId
                          );
                          const remaining = slot.capacity - slot.commitments.length;
                          return (
                            <tr key={slot.id} className="border-b border-gray-100">
                              <td className="py-3 pr-4">
                                {formatSlotDate(slot.date)}
                              </td>
                              <td className="py-3 pr-4">
                                {formatSlotTime(slot.startTime)} –{" "}
                                {formatSlotTime(slot.endTime)}
                              </td>
                              <td className="py-3 pr-4">
                                {remaining > 0 ? `${remaining} left` : "Full"}
                              </td>
                              <td className="py-3">
                                {alreadySignedUp ? (
                                  <span className="text-sm text-gray-600">
                                    Signed up
                                  </span>
                                ) : (
                                  <form action={signUpForSlot.bind(null, slot.id)}>
                                    <button
                                      type="submit"
                                      disabled={!eligible || remaining <= 0}
                                      className="bg-emerald-600 text-white rounded-md px-3 py-1 disabled:opacity-50"
                                    >
                                      Sign up
                                    </button>
                                  </form>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
