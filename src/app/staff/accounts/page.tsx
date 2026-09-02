import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createInvite,
  revokeInvite,
  approveStaff,
  denyStaff,
  updateStaffRole,
} from "./actions";

const ALL_ROLES = ["OWNER", "ADMINISTRATOR", "STAFF"] as const;

export default async function StaffAccountsPage() {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    session.user.role !== "staff" ||
    session.user.staffStatus !== "ACTIVE" ||
    (session.user.staffRole !== "OWNER" && session.user.staffRole !== "ADMINISTRATOR")
  ) {
    redirect("/staff/login");
  }

  const isOwner = session.user.staffRole === "OWNER";
  const assignableRoles = isOwner ? ALL_ROLES : (["ADMINISTRATOR", "STAFF"] as const);

  const [staffList, invites] = await Promise.all([
    prisma.staff.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.staffInvite.findMany({
      where: { usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const baseUrl = process.env.NEXTAUTH_URL ?? "";

  return (
    <main className="mx-auto max-w-3xl w-full px-6 py-16">
      <div className="mb-8">
        <Link href="/staff" className="text-sm underline">
          ← Back to dashboard
        </Link>
        <h1 className="text-2xl font-semibold mt-2">Manage Staff</h1>
      </div>

      <section className="mb-12">
        <h2 className="text-lg font-semibold mb-4">Invite Staff</h2>
        <form action={createInvite} className="flex flex-wrap items-end gap-3 mb-6">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Email</span>
            <input
              name="email"
              type="email"
              required
              className="border border-gray-300 rounded-md px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Role</span>
            <select name="role" className="border border-gray-300 rounded-md px-3 py-2">
              {assignableRoles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="bg-black text-white rounded-md px-4 py-2">
            Send Invite
          </button>
        </form>

        {invites.length > 0 && (
          <div className="flex flex-col gap-3">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="border border-gray-200 rounded-md p-3 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between text-sm">
                  <span>
                    {invite.email} — <span className="text-gray-600">{invite.role}</span>
                  </span>
                  <form action={revokeInvite.bind(null, invite.id)}>
                    <button type="submit" className="text-xs text-red-600 underline">
                      Revoke
                    </button>
                  </form>
                </div>
                <code className="text-xs bg-gray-100 text-gray-900 rounded px-2 py-1 break-all select-all">
                  {baseUrl}/staff/accept-invite/{invite.token}
                </code>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Staff Accounts</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left border-b border-gray-300">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Role</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {staffList.map((staff) => {
              const isSelf = staff.id === Number(session.user.id);
              const canEditRole =
                !isSelf && (isOwner || staff.role !== "OWNER");

              return (
                <tr key={staff.id} className="border-b border-gray-100 align-top">
                  <td className="py-3 pr-4">
                    {staff.name}
                    {isSelf && <span className="text-gray-600"> (you)</span>}
                  </td>
                  <td className="py-3 pr-4">{staff.email}</td>
                  <td className="py-3 pr-4">
                    {canEditRole ? (
                      <form
                        action={updateStaffRole.bind(null, staff.id)}
                        className="flex gap-2"
                      >
                        <select
                          name="role"
                          defaultValue={staff.role}
                          className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                        >
                          {(isOwner ? ALL_ROLES : (["ADMINISTRATOR", "STAFF"] as const)).map(
                            (r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            )
                          )}
                        </select>
                        <button
                          type="submit"
                          className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                        >
                          Save
                        </button>
                      </form>
                    ) : (
                      staff.role
                    )}
                  </td>
                  <td className="py-3 pr-4">{staff.status}</td>
                  <td className="py-3">
                    {staff.status === "PENDING_APPROVAL" && (
                      <div className="flex gap-2">
                        <form action={approveStaff.bind(null, staff.id)}>
                          <button
                            type="submit"
                            className="bg-emerald-600 text-white rounded-md px-3 py-1 text-sm"
                          >
                            Approve
                          </button>
                        </form>
                        <form action={denyStaff.bind(null, staff.id)}>
                          <button
                            type="submit"
                            className="bg-red-600 text-white rounded-md px-3 py-1 text-sm"
                          >
                            Deny
                          </button>
                        </form>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </main>
  );
}
