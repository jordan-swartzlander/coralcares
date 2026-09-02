import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentSchoolYear } from "@/lib/school-year";
import { SignOutButton } from "./sign-out-button";
import { BackgroundCheckToggle } from "./background-check-toggle";

const DASHBOARD_TITLES = {
  OWNER: "Owner Dashboard",
  ADMINISTRATOR: "Admin Dashboard",
  STAFF: "Staff Dashboard",
} as const;

export default async function StaffPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "staff") {
    redirect("/staff/login");
  }

  const canManage =
    session.user.staffRole === "OWNER" || session.user.staffRole === "ADMINISTRATOR";
  const dashboardTitle = DASHBOARD_TITLES[session.user.staffRole ?? "STAFF"];

  if (session.user.staffStatus !== "ACTIVE") {
    return (
      <main className="mx-auto max-w-md w-full px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold">{dashboardTitle}</h1>
          <SignOutButton />
        </div>
        {session.user.staffStatus === "PENDING_APPROVAL" ? (
          <p className="text-sm text-gray-600">
            Your staff account is awaiting approval from an Owner or Administrator.
          </p>
        ) : (
          <p className="text-sm text-gray-600">
            Your staff account was not approved. Contact an Owner or Administrator
            if you have questions.
          </p>
        )}
      </main>
    );
  }

  if (!canManage) {
    return (
      <main className="mx-auto max-w-md w-full px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold">{dashboardTitle}</h1>
            <p className="text-sm text-gray-600">Signed in as {session.user.email}</p>
          </div>
          <SignOutButton />
        </div>
        <div className="flex gap-4">
          <Link href="/staff/opportunities" className="text-sm underline">
            Manage Opportunities
          </Link>
          <Link href="/staff/change-password" className="text-sm underline">
            Change Password
          </Link>
        </div>
      </main>
    );
  }

  const schoolYear = await getCurrentSchoolYear();

  const activeVolunteers = await prisma.volunteer.findMany({
    where: { status: { in: ["INVITED", "APPROVED"] } },
    orderBy: { name: "asc" },
    include: { clearances: { where: { schoolYear } } },
  });

  return (
    <main className="mx-auto max-w-3xl w-full px-6 py-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">{dashboardTitle}</h1>
          <p className="text-sm text-gray-600">Signed in as {session.user.email}</p>
          <div className="flex gap-4">
            <Link href="/staff/opportunities" className="text-sm underline">
              Manage Opportunities
            </Link>
            <Link href="/staff/volunteers/new" className="text-sm underline">
              New Volunteer
            </Link>
            <Link href="/staff/settings" className="text-sm underline">
              School Settings
            </Link>
            <Link href="/staff/change-password" className="text-sm underline">
              Change Password
            </Link>
          </div>
        </div>
        <SignOutButton />
      </div>

      <p className="text-sm text-gray-600 mb-8">
        School year: <span className="font-medium">{schoolYear}</span>
      </p>

      <section>
        <h2 className="text-lg font-semibold mb-4">Volunteers ({schoolYear})</h2>
        {activeVolunteers.length === 0 ? (
          <p className="text-sm text-gray-600">No invited or approved volunteers yet.</p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b border-gray-300">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Student</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2">Clearance</th>
              </tr>
            </thead>
            <tbody>
              {activeVolunteers.map((volunteer) => (
                <tr key={volunteer.id} className="border-b border-gray-100">
                  <td className="py-3 pr-4">{volunteer.name}</td>
                  <td className="py-3 pr-4">{volunteer.email}</td>
                  <td className="py-3 pr-4">{volunteer.studentName ?? "—"}</td>
                  <td className="py-3 pr-4">
                    {volunteer.status === "INVITED" ? (
                      <Link
                        href={`/staff/volunteers/${volunteer.id}`}
                        className="underline"
                      >
                        Invited
                      </Link>
                    ) : (
                      "Approved"
                    )}
                  </td>
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
