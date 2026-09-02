import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTeacher, updateTeacher, setTeacherActive } from "./actions";

const GRADES = ["K", "1", "2", "3", "4", "5"];

export default async function StaffTeachersPage() {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    session.user.role !== "staff" ||
    session.user.staffStatus !== "ACTIVE" ||
    (session.user.staffRole !== "OWNER" && session.user.staffRole !== "ADMINISTRATOR")
  ) {
    redirect("/staff/login");
  }

  const teachers = await prisma.teacher.findMany({ orderBy: [{ grade: "asc" }, { name: "asc" }] });

  return (
    <main className="mx-auto max-w-lg w-full px-6 py-16">
      <Link href="/staff" className="text-sm underline">
        ← Back to dashboard
      </Link>
      <h1 className="text-2xl font-semibold mt-2 mb-8">Manage Teachers</h1>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">Add Teacher</h2>
        <form action={createTeacher} className="flex items-end gap-3">
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
            <span className="text-sm font-medium">Grade</span>
            <select
              name="grade"
              required
              defaultValue=""
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="" disabled>
                Select
              </option>
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {g === "K" ? "Kindergarten" : `Grade ${g}`}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="bg-black text-white rounded-md px-4 py-2">
            Add
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Teachers</h2>
        {teachers.length === 0 ? (
          <p className="text-sm text-gray-600">No teachers added yet.</p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b border-gray-300">
                <th className="py-2 pr-4">Teacher</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="border-b border-gray-100">
                  <td className="py-2 pr-4">
                    <form
                      action={updateTeacher.bind(null, teacher.id)}
                      className="flex items-center gap-2"
                    >
                      <input
                        name="name"
                        type="text"
                        defaultValue={teacher.name}
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm w-32"
                      />
                      <select
                        name="grade"
                        defaultValue={teacher.grade}
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                      >
                        {GRADES.map((g) => (
                          <option key={g} value={g}>
                            {g === "K" ? "Kindergarten" : `Grade ${g}`}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                      >
                        Save
                      </button>
                    </form>
                  </td>
                  <td className="py-2 pr-4">{teacher.active ? "Active" : "Inactive"}</td>
                  <td className="py-2">
                    <form action={setTeacherActive.bind(null, teacher.id, !teacher.active)}>
                      <button
                        type="submit"
                        className="text-xs underline"
                      >
                        {teacher.active ? "Deactivate" : "Activate"}
                      </button>
                    </form>
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
