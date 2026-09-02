"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addSlotsToOpportunity } from "./actions";
import { useSchedulingFields } from "./use-scheduling-fields";
import { useSlotAudienceOverride } from "./use-slot-audience-override";

export function AddSlotsForm({
  opportunityId,
  teachers,
}: {
  opportunityId: number;
  teachers: { id: number; name: string; grade: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const { fields, getConfig, reset } = useSchedulingFields();
  const {
    fields: slotAudienceFields,
    getOverride: getSlotAudienceOverride,
    reset: resetSlotAudience,
  } = useSlotAudienceOverride(teachers);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm underline">
        + Add more slots
      </button>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await addSlotsToOpportunity(opportunityId, getConfig(), getSlotAudienceOverride());
      reset();
      resetSlotAudience();
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-xl">
      {slotAudienceFields}

      {fields}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="border border-gray-300 rounded-md px-3 py-1 text-sm disabled:opacity-50"
        >
          {pending ? "Adding..." : "Add slots"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm underline"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
