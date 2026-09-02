"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { startNewSchoolYear } from "./actions";

export function SchoolSettingsDropdown({ schoolYear }: { schoolYear: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-sm underline"
      >
        School Settings
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-64 rounded-md border border-gray-300 bg-white text-gray-900 shadow-lg p-4 flex flex-col gap-3 z-10">
          <Link
            href="/staff/accounts"
            className="text-sm underline"
            onClick={() => setOpen(false)}
          >
            Manage Staff
          </Link>
          <Link
            href="/staff/teachers"
            className="text-sm underline"
            onClick={() => setOpen(false)}
          >
            Manage Teachers
          </Link>

          <div className="border-t border-gray-200 pt-3">
            <p className="text-xs text-gray-500 mb-2">
              Current school year: <span className="font-medium">{schoolYear}</span>
            </p>
            <details>
              <summary className="cursor-pointer text-sm underline">
                Start New School Year
              </summary>
              <div className="mt-2 flex flex-col gap-2">
                <p className="text-xs text-gray-500">
                  This resets background-check clearance for the new school
                  year. Prior years are kept on record and are not affected.
                </p>
                <form
                  action={(formData: FormData) => {
                    const newYear = formData.get("newSchoolYear") as string;
                    startTransition(async () => {
                      await startNewSchoolYear(newYear);
                      setOpen(false);
                    });
                  }}
                  className="flex flex-col gap-2"
                >
                  <input
                    name="newSchoolYear"
                    type="text"
                    placeholder="e.g. 2027-2028"
                    className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={pending}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm disabled:opacity-50"
                  >
                    {pending ? "Starting..." : "Start New School Year"}
                  </button>
                </form>
              </div>
            </details>
          </div>
        </div>
      )}
    </div>
  );
}
