"use client";

import { useState } from "react";
import type { SlotAudienceOverride } from "./actions";

const GRADES = ["K", "1", "2", "3", "4", "5"];

export function useSlotAudienceOverride(
  teachers: { id: number; name: string; grade: string }[]
) {
  const [mode, setMode] = useState<"inherit" | "GRADE" | "CLASSROOM">("inherit");
  const [grade, setGrade] = useState("");
  const [teacherId, setTeacherId] = useState("");

  function reset() {
    setMode("inherit");
    setGrade("");
    setTeacherId("");
  }

  function getOverride(): SlotAudienceOverride {
    if (mode === "GRADE") return { mode: "override", audience: "GRADE", audienceGrade: grade };
    if (mode === "CLASSROOM") {
      return { mode: "override", audience: "CLASSROOM", audienceTeacherId: Number(teacherId) };
    }
    return { mode: "inherit" };
  }

  const fields = (
    <fieldset className="border border-gray-300 rounded-md p-4 flex flex-col gap-3">
      <legend className="text-sm font-medium px-1">Who are these specific slots for?</legend>
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-1">
          <input
            type="radio"
            checked={mode === "inherit"}
            onChange={() => setMode("inherit")}
          />
          Same as opportunity default
        </label>
        <label className="flex items-center gap-1">
          <input type="radio" checked={mode === "GRADE"} onChange={() => setMode("GRADE")} />
          Specific grade
        </label>
        <label className="flex items-center gap-1">
          <input
            type="radio"
            checked={mode === "CLASSROOM"}
            onChange={() => setMode("CLASSROOM")}
          />
          Specific classroom
        </label>
      </div>

      {mode === "GRADE" && (
        <select
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          required
          className="border border-gray-300 rounded-md px-3 py-2 text-sm w-40"
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
      )}

      {mode === "CLASSROOM" && (
        <select
          value={teacherId}
          onChange={(e) => setTeacherId(e.target.value)}
          required
          className="border border-gray-300 rounded-md px-3 py-2 text-sm w-56"
        >
          <option value="" disabled>
            Select a teacher
          </option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.grade === "K" ? "Kindergarten" : `Grade ${t.grade}`})
            </option>
          ))}
        </select>
      )}
    </fieldset>
  );

  return { fields, getOverride, reset };
}
