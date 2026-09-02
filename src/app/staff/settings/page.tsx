import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { getCurrentSchoolYear } from "@/lib/school-year";
import { startNewSchoolYear } from "../actions";

export default async function SchoolSettingsPage() {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    session.user.role !== "staff" ||
    session.user.staffStatus !== "ACTIVE" ||
    (session.user.staffRole !== "OWNER" && session.user.staffRole !== "ADMINISTRATOR")
  ) {
    redirect("/staff");
  }

  const schoolYear = await getCurrentSchoolYear();

  return (
    <main className="mx-auto max-w-md w-full px-6 py-16">
      <div className="mb-8">
        <Link href="/staff" className="text-sm underline">
          ← Back to dashboard
        </Link>
        <h1 className="text-2xl font-semibold mt-2">School Settings</h1>
      </div>

      <section className="mb-10 flex flex-col gap-2">
        <Link href="/staff/accounts" className="text-sm underline">
          Manage Staff
        </Link>
        <Link href="/staff/teachers" className="text-sm underline">
          Manage Teachers
        </Link>
      </section>

      <section className="border-t border-gray-200 pt-6">
        <h2 className="text-sm font-semibold mb-1">School Year</h2>
        <p className="text-sm text-gray-600 mb-4">
          Current school year: <span className="font-medium">{schoolYear}</span>
        </p>
        <details className="text-sm">
          <summary className="cursor-pointer underline">Start New School Year</summary>
          <div className="mt-3 flex flex-col gap-2">
            <p className="text-xs text-gray-500">
              This resets background-check clearance for the new school year.
              Prior years are kept on record and are not affected.
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
          </div>
        </details>
      </section>
    </main>
  );
}
