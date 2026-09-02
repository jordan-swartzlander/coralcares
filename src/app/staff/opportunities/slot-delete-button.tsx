"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteSlot } from "./actions";

export function SlotDeleteButton({ slotId }: { slotId: number }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    setError(null);
    try {
      await deleteSlot(slotId);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete slot.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="text-xs text-red-600 underline disabled:opacity-50"
      >
        Delete
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
