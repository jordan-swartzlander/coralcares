"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createOpportunityWithSlots } from "./actions";
import { useSchedulingFields } from "./use-scheduling-fields";

export function OpportunityForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [requiredClearance, setRequiredClearance] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const { fields, getConfig, reset } = useSchedulingFields();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await createOpportunityWithSlots({
        name,
        description,
        requiredClearance,
        scheduling: getConfig(),
      });
      setName("");
      setDescription("");
      setRequiredClearance(1);
      reset();
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
