import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { setOpportunityActive } from "./actions";
import { formatSlotDate, formatSlotTime, gradeLabel } from "@/lib/format";
import { OpportunityForm } from "./opportunity-form";
import { AddSlotsForm } from "./add-slots-form";
import { SlotDeleteButton } from "./slot-delete-button";

export default async function StaffOpportunitiesPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "staff" || session.user.staffStatus !== "ACTIVE") {
    redirect("/staff/login");
  }

  const [opportunities, teachers] = await Promise.all([
    prisma.opportunity.findMany({
      orderBy: { name: "asc" },
      include: {
        slots: {
          orderBy: { date: "asc" },
          include: {
            commitments: { where: { status: "CONFIRMED" } },
            audienceTeacher: true,
          },
        },
        audienceTeacher: true,
      },
    }),
    prisma.teacher.findMany({
      where: { active: true },
      orderBy: [{ grade: "asc" }, { name: "asc" }],
    }),
  ]);

  function audienceLabel(opportunity: (typeof opportunities)[number]) {
    if (opportunity.audience === "GRADE") {
      return gradeLabel(opportunity.audienceGrade);
    }
    if (opportunity.audience === "CLASSROOM") {
      return opportunity.audienceTeacher
        ? `${opportunity.audienceTeacher.name}'s classroom`
        : "Classroom (teacher removed)";
    }
    return "Entire school";
  }

  function slotAudienceLabel(opportunity: (typeof opportunities)[number], slot: (typeof opportunity.slots)[number]) {
    if (!slot.audienceOverride) return null;
    if (slot.audienceOverride === "GRADE") {
      return gradeLabel(slot.audienceGrade);
    }
    if (slot.audienceOverride === "CLASSROOM") {
      return slot.audienceTeacher ? `${slot.audienceTeacher.name}'s classroom` : "Classroom";
    }
    return "Entire school";
  }

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
        <OpportunityForm teachers={teachers} />
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
                <p className="text-xs text-gray-500">{audienceLabel(opportunity)}</p>
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
                    <th className="py-2 pr-4">For</th>
                    <th className="py-2 pr-4">Filled</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {opportunity.slots.map((slot) => (
                    <tr key={slot.id} className="border-b border-gray-100">
                      <td className="py-2 pr-4">{formatSlotDate(slot.date)}</td>
                      <td className="py-2 pr-4">
                        {formatSlotTime(slot.startTime)} – {formatSlotTime(slot.endTime)}
                      </td>
                      <td className="py-2 pr-4 text-gray-500">
                        {slotAudienceLabel(opportunity, slot) ?? "—"}
                      </td>
                      <td className="py-2 pr-4">
                        {slot.commitments.length} / {slot.capacity}
                      </td>
                      <td className="py-2">
                        <SlotDeleteButton slotId={slot.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <AddSlotsForm opportunityId={opportunity.id} teachers={teachers} />
          </div>
        ))}
      </section>
    </main>
  );
}
