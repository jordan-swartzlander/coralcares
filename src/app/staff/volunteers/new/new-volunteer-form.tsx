"use client";

import { useActionState } from "react";
import { createAndInviteVolunteer } from "../actions";

const GRADES = ["K", "1", "2", "3", "4", "5"];

export function NewVolunteerForm({
  teachers,
}: {
  teachers: { id: number; name: string; grade: string }[];
}) {
  const [state, formAction, pending] = useActionState(createAndInviteVolunteer, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Parent&apos;s full name</span>
        <input
          name="name"
          type="text"
          required
          className="border border-gray-300 rounded-md px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Parent&apos;s email</span>
        <input
          name="email"
          type="email"
          required
          className="border border-gray-300 rounded-md px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Phone (optional)</span>
        <input
          name="phone"
          type="tel"
          className="border border-gray-300 rounded-md px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Student&apos;s name</span>
        <input
          name="studentName"
          type="text"
          required
          className="border border-gray-300 rounded-md px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Student&apos;s grade</span>
        <select
          name="studentGrade"
          required
          defaultValue=""
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
          defaultValue=""
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

      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-black text-white rounded-md px-4 py-2 disabled:opacity-50"
      >
        {pending ? "Creating..." : "Create & Generate Invite"}
      </button>
    </form>
  );
}
