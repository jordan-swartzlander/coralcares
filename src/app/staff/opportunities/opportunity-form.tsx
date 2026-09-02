"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createOpportunityWithSlots, type AudienceConfig } from "./actions";
import { useSchedulingFields } from "./use-scheduling-fields";
import { useSlotAudienceOverride } from "./use-slot-audience-override";

const GRADES = ["K", "1", "2", "3", "4", "5"];

export function OpportunityForm({
  teachers,
}: {
  teachers: { id: number; name: string; grade: string }[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [requiredClearance, setRequiredClearance] = useState(1);
  const [audienceType, setAudienceType] = useState<"SCHOOL" | "GRADE" | "CLASSROOM">("SCHOOL");
  const [audienceGrade, setAudienceGrade] = useState("");
  const [audienceTeacherId, setAudienceTeacherId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const { fields, getConfig, reset } = useSchedulingFields();
  const {
    fields: slotAudienceFields,
    getOverride: getSlotAudienceOverride,
    reset: resetSlotAudience,
  } = useSlotAudienceOverride(teachers);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    let audience: AudienceConfig;
    if (audienceType === "GRADE") {
      audience = { audience: "GRADE", audienceGrade };
    } else if (audienceType === "CLASSROOM") {
      audience = { audience: "CLASSROOM", audienceTeacherId: Number(audienceTeacherId) };
    } else {
      audience = { audience: "SCHOOL" };
    }

    setPending(true);
    try {
      await createOpportunityWithSlots({
        name,
        description,
        requiredClearance,
        audience,
        scheduling: getConfig(),
        slotAudience: getSlotAudienceOverride(),
      });
      setName("");
      setDescription("");
      setRequiredClearance(1);
      setAudienceType("SCHOOL");
      setAudienceGrade("");
      setAudienceTeacherId("");
      reset();
      resetSlotAudience();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-xl">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Event name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="border border-gray-300 rounded-md px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Description (optional)</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Required clearance level</span>
        <input
          type="number"
          min={0}
          value={requiredClearance}
          onChange={(e) => setRequiredClearance(Number(e.target.value))}
          className="border border-gray-300 rounded-md px-3 py-2 w-32"
        />
      </label>

      <fieldset className="border border-gray-300 rounded-md p-4 flex flex-col gap-3">
        <legend className="text-sm font-medium px-1">Audience</legend>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-1">
            <input
              type="radio"
              checked={audienceType === "SCHOOL"}
              onChange={() => setAudienceType("SCHOOL")}
            />
            Entire school
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              checked={audienceType === "GRADE"}
              onChange={() => setAudienceType("GRADE")}
            />
            Specific grade
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              checked={audienceType === "CLASSROOM"}
              onChange={() => setAudienceType("CLASSROOM")}
            />
            Specific classroom
          </label>
        </div>

        {audienceType === "GRADE" && (
          <select
            value={audienceGrade}
            onChange={(e) => setAudienceGrade(e.target.value)}
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

        {audienceType === "CLASSROOM" && (
          <select
            value={audienceTeacherId}
            onChange={(e) => setAudienceTeacherId(e.target.value)}
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

      {slotAudienceFields}

      {fields}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-black text-white rounded-md px-4 py-2 self-start disabled:opacity-50"
      >
        {pending ? "Creating..." : "Create opportunity"}
      </button>
    </form>
  );
}
