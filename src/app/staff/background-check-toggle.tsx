"use client";

import { useState, useTransition } from "react";
import { setBackgroundCheckApproved } from "./actions";

export function BackgroundCheckToggle({
  volunteerId,
  initialApproved,
}: {
  volunteerId: number;
  initialApproved: boolean;
}) {
  const [approved, setApproved] = useState(initialApproved);
  const [isPending, startTransition] = useTransition();

  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={approved}
        disabled={isPending}
        onChange={(e) => {
          const next = e.target.checked;
          setApproved(next);
          startTransition(async () => {
            await setBackgroundCheckApproved(volunteerId, next);
          });
        }}
      />
      Background check approved (Level {approved ? 1 : 0})
    </label>
  );
}
