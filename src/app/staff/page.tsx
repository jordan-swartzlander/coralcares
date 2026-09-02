import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentSchoolYear } from "@/lib/school-year";
import { approveVolunteer, denyVolunteer, startNewSchoolYear } from "./actions";
import { SignOutButton } from "./sign-out-button";
import { BackgroundCheckToggle } from "./background-check-toggle";

export default async function StaffPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "staff") {
    redirect("/staff/login");
  }

  const schoolYear = await getCurrentSchoolYear();

  const [pendingVolunteers, approvedVolunteers] = await Promise.all([
    prisma.volunteer.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
    }),
    prisma.volunteer.findMany({
      where: { status: "APPROVED" },
      orderBy: { name: "asc" },
      include: { clearances: { where: { schoolYear } } },
    }),
  ]);

  return (
    <main className="mx-auto max-w-3xl w-full px-6 py-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Staff Dashboard</h1>
          <p className="text-sm text-gray-600">Signed in as {session.user.email}</p>
          <Link href="/staff/opportunities" className="text-sm underline">
            Manage Opportunities
          </Link>
        </div>
        <SignOutButton />
      </div>

      <section className="mb-12 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Current school year: <span className="font-medium">{schoolYear}</span>
        </p>
        <form
          action={async (formData: FormData) => {
            "use server";
            const newYear = formData.get("newSchoolYear") as string;
            await startNewSchoolYear(newYear);
          }}
          className="flex gap-2"
        >
          <input
            name="newSchoolYear"
            type="text"
            placeholder="e.g. 2027-2028"
            className="border border-gray-300 rounded-md px-2 py-1 text-sm"
          />
          <button
            type="submit"
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            Start New School Year
          </button>
        </form>
      </section>

      <section className="mb-12">
        <h2 className="text-lg font-semibold mb-4">Pending Registrations</h2>
        {pendingVolunteers.length === 0 ? (
          <p className="text-sm text-gray-600">No pending applications right now.</p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b border-gray-300">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Phone</th>
                <th className="py-2 pr-4">Student</th>
                <th className="py-2 pr-4">Applied</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {pendingVolunteers.map((volunteer) => (
                <tr key={volunteer.id} className="border-b border-gray-100">
                  <td className="py-3 pr-4">{volunteer.name}</td>
                  <td className="py-3 pr-4">{volunteer.email}</td>
                  <td className="py-3 pr-4">{volunteer.phone ?? "—"}</td>
                  <td className="py-3 pr-4">{volunteer.studentName ?? "—"}</td>
                  <td className="py-3 pr-4">
                    {volunteer.createdAt.toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <form action={approveVolunteer.bind(null, volunteer.id)}>
                        <button
                          type="submit"
                          className="bg-emerald-600 text-white rounded-md px-3 py-1"
                        >
                          Approve
                        </button>
                      </form>
                      <form action={denyVolunteer.bind(null, volunteer.id)}>
                        <button
                          type="submit"
                          className="bg-red-600 text-white rounded-md px-3 py-1"
                        >
                          Deny
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">
          Approved Volunteers ({schoolYear})
        </h2>
        {approvedVolunteers.length === 0 ? (
          <p className="text-sm text-gray-600">No approved volunteers yet.</p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b border-gray-300">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Student</th>
                <th className="py-2">Clearance</th>
              </tr>
            </thead>
            <tbody>
              {approvedVolunteers.map((volunteer) => (
                <tr key={volunteer.id} className="border-b border-gray-100">
                  <td className="py-3 pr-4">{volunteer.name}</td>
                  <td className="py-3 pr-4">{volunteer.email}</td>
                  <td className="py-3 pr-4">{volunteer.studentName ?? "—"}</td>
                  <td className="py-3">
                    <BackgroundCheckToggle
                      key={`${volunteer.id}-${schoolYear}`}
                      volunteerId={volunteer.id}
                      initialApproved={(volunteer.clearances[0]?.level ?? 0) >= 1}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
