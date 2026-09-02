import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { approveVolunteer, denyVolunteer } from "./actions";
import { SignOutButton } from "./sign-out-button";

export default async function StaffPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/staff/login");
  }

  const pendingVolunteers = await prisma.volunteer.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="mx-auto max-w-3xl w-full px-6 py-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Pending Registrations</h1>
          <p className="text-sm text-gray-600">Signed in as {session.user.email}</p>
        </div>
        <SignOutButton />
      </div>

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
    </main>
  );
}
