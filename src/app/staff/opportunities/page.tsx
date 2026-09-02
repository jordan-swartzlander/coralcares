import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createOpportunity, setOpportunityActive, createSlot } from "./actions";
import { formatSlotDate, formatSlotTime } from "@/lib/format";

export default async function StaffOpportunitiesPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "staff") {
    redirect("/staff/login");
  }

  const opportunities = await prisma.opportunity.findMany({
    orderBy: { name: "asc" },
    include: {
      slots: {
        orderBy: { date: "asc" },
        include: { commitments: { where: { status: "CONFIRMED" } } },
      },
    },
  });

  return (
    <main className="mx-auto max-w-3xl w-full px-6 py-16">
      <div className="mb-8">
        <Link href="/staff" className="text-sm underline">
          ← Back to dashboard
        </Link>
        <h1 className="text-2xl font-semibold mt-2">Manage Opportunities</h1>
      </div>

      <section className="mb-12">
        <h2 className="text-lg font-semibold mb-4">New Opportunity</h2>
        <form action={createOpportunity} className="flex flex-col gap-4 max-w-md">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Name</span>
            <input
              name="name"
              type="text"
              required
              className="border border-gray-300 rounded-md px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Description (optional)</span>
            <textarea
              name="description"
              className="border border-gray-300 rounded-md px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Required clearance level</span>
            <input
              name="requiredClearance"
              type="number"
              min={0}
              defaultValue={1}
              className="border border-gray-300 rounded-md px-3 py-2"
            />
          </label>

          <button
            type="submit"
            className="bg-black text-white rounded-md px-4 py-2 self-start"
          >
            Create opportunity
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-10">
        {opportunities.map((opportunity) => (
          <div key={opportunity.id} className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-medium">
                  {opportunity.name}{" "}
                  <span className="text-sm text-gray-600">
                    (requires level {opportunity.requiredClearance})
                  </span>
                </h3>
                {opportunity.description && (
                  <p className="text-sm text-gray-600">{opportunity.description}</p>
                )}
              </div>
              <form
                action={setOpportunityActive.bind(
                  null,
                  opportunity.id,
                  !opportunity.active
                )}
              >
                <button
                  type="submit"
                  className={
                    opportunity.active
                      ? "border border-gray-300 rounded-md px-3 py-1 text-sm"
                      : "bg-emerald-600 text-white rounded-md px-3 py-1 text-sm"
                  }
                >
                  {opportunity.active ? "Deactivate" : "Activate"}
                </button>
              </form>
            </div>

            {opportunity.slots.length > 0 && (
              <table className="w-full text-sm border-collapse mb-4">
                <thead>
                  <tr className="text-left border-b border-gray-300">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Time</th>
                    <th className="py-2 pr-4">Filled</th>
                  </tr>
                </thead>
                <tbody>
                  {opportunity.slots.map((slot) => (
                    <tr key={slot.id} className="border-b border-gray-100">
                      <td className="py-2 pr-4">{formatSlotDate(slot.date)}</td>
                      <td className="py-2 pr-4">
                        {formatSlotTime(slot.startTime)} – {formatSlotTime(slot.endTime)}
                      </td>
                      <td className="py-2 pr-4">
                        {slot.commitments.length} / {slot.capacity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <form
              action={createSlot.bind(null, opportunity.id)}
              className="flex flex-wrap items-end gap-3"
            >
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium">Date</span>
                <input
                  name="date"
                  type="date"
                  required
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium">Start</span>
                <input
                  name="startTime"
                  type="time"
                  required
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium">End</span>
                <input
                  name="endTime"
                  type="time"
                  required
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium">Capacity</span>
                <input
                  name="capacity"
                  type="number"
                  min={1}
                  defaultValue={1}
                  required
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm w-20"
                />
              </label>
              <button
                type="submit"
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                Add slot
              </button>
            </form>
          </div>
        ))}
      </section>
    </main>
  );
}
