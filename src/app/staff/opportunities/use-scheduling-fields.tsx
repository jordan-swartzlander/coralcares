"use client";

import { useState } from "react";
import type { SchedulingConfig } from "./actions";

const DAYS = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
];

export function useSchedulingFields() {
  const [schedulingMode, setSchedulingMode] = useState<"dates" | "recurring">("dates");

  const [dates, setDates] = useState([""]);
  const [slotsPerDate, setSlotsPerDate] = useState(1);
  const [sameTime, setSameTime] = useState(true);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [times, setTimes] = useState([{ startTime: "", endTime: "" }]);

  const [recurStartDate, setRecurStartDate] = useState("");
  const [recurEndDate, setRecurEndDate] = useState("");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [slotsPerOccurrence, setSlotsPerOccurrence] = useState(1);

  const [capacity, setCapacity] = useState(1);

  function updateSlotsPerDate(count: number) {
    setSlotsPerDate(count);
    setTimes((prev) => {
      const next = [...prev];
      while (next.length < count) next.push({ startTime: "", endTime: "" });
      while (next.length > count) next.pop();
      return next;
    });
  }

  function reset() {
    setDates([""]);
    setSlotsPerDate(1);
    setSameTime(true);
    setStartTime("");
    setEndTime("");
    setTimes([{ startTime: "", endTime: "" }]);
    setRecurStartDate("");
    setRecurEndDate("");
    setDaysOfWeek([]);
    setSlotsPerOccurrence(1);
    setCapacity(1);
  }

  function getConfig(): SchedulingConfig {
    if (schedulingMode === "dates") {
      const cleanedDates = dates.map((d) => d.trim()).filter(Boolean);
      return sameTime
        ? {
            mode: "dates",
            dates: cleanedDates,
            slotsPerDate,
            sameTime: true,
            startTime,
            endTime,
            capacity,
          }
        : { mode: "dates", dates: cleanedDates, slotsPerDate, sameTime: false, times, capacity };
    }
    return {
      mode: "recurring",
      startDate: recurStartDate,
      endDate: recurEndDate,
      daysOfWeek,
      slotsPerOccurrence,
      startTime,
      endTime,
      capacity,
    };
  }

  function updateDate(index: number, value: string) {
    setDates((prev) => prev.map((d, i) => (i === index ? value : d)));
  }
  function addDate() {
    setDates((prev) => [...prev, ""]);
  }
  function removeDate(index: number) {
    setDates((prev) => prev.filter((_, i) => i !== index));
  }
  function toggleDay(day: number) {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }
  function updateSlotTime(index: number, field: "startTime" | "endTime", value: string) {
    setTimes((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  }

  const fields = (
    <fieldset className="border border-gray-300 rounded-md p-4 flex flex-col gap-4">
      <legend className="text-sm font-medium px-1">Scheduling</legend>

      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-1">
          <input
            type="radio"
            checked={schedulingMode === "dates"}
            onChange={() => setSchedulingMode("dates")}
          />
          One-time / specific dates
        </label>
        <label className="flex items-center gap-1">
          <input
            type="radio"
            checked={schedulingMode === "recurring"}
            onChange={() => setSchedulingMode("recurring")}
          />
          Recurring
        </label>
      </div>

      {schedulingMode === "dates" ? (
        <>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Dates</span>
            {dates.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="date"
                  value={d}
                  onChange={(e) => updateDate(i, e.target.value)}
                  required
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                />
                {dates.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDate(i)}
                    className="text-sm text-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addDate} className="text-sm underline self-start">
              + Add another date
            </button>
          </div>

          <label className="flex flex-col gap-1 w-40">
            <span className="text-sm font-medium">Slots per date</span>
            <input
              type="number"
              min={1}
              value={slotsPerDate}
              onChange={(e) => updateSlotsPerDate(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm"
            />
          </label>

          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-1">
              <input type="radio" checked={sameTime} onChange={() => setSameTime(true)} />
              Same time for every slot
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" checked={!sameTime} onChange={() => setSameTime(false)} />
              Unique time per slot
            </label>
          </div>

          {sameTime ? (
            <div className="flex gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium">Start</span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium">End</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                />
              </label>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {times.map((t, i) => (
                <div key={i} className="flex items-end gap-3">
                  <span className="text-xs text-gray-600 w-14">Slot {i + 1}</span>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium">Start</span>
                    <input
                      type="time"
                      value={t.startTime}
                      onChange={(e) => updateSlotTime(i, "startTime", e.target.value)}
                      required
                      className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium">End</span>
                    <input
                      type="time"
                      value={t.endTime}
                      onChange={(e) => updateSlotTime(i, "endTime", e.target.value)}
                      required
                      className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                    />
                  </label>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium">Start date</span>
              <input
                type="date"
                value={recurStartDate}
                onChange={(e) => setRecurStartDate(e.target.value)}
                required
                className="border border-gray-300 rounded-md px-2 py-1 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium">End date</span>
              <input
                type="date"
                value={recurEndDate}
                onChange={(e) => setRecurEndDate(e.target.value)}
                required
                className="border border-gray-300 rounded-md px-2 py-1 text-sm"
              />
            </label>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Repeats on</span>
            <div className="flex gap-3 text-sm">
              {DAYS.map((d) => (
                <label key={d.value} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={daysOfWeek.includes(d.value)}
                    onChange={() => toggleDay(d.value)}
                  />
                  {d.label}
                </label>
              ))}
            </div>
          </div>

          <label className="flex flex-col gap-1 w-40">
            <span className="text-sm font-medium">Slots per occurrence</span>
            <input
              type="number"
              min={1}
              value={slotsPerOccurrence}
              onChange={(e) => setSlotsPerOccurrence(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm"
            />
          </label>

          <div className="flex gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium">Start time</span>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="border border-gray-300 rounded-md px-2 py-1 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium">End time</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="border border-gray-300 rounded-md px-2 py-1 text-sm"
              />
            </label>
          </div>
        </>
      )}

      <label className="flex flex-col gap-1 w-40">
        <span className="text-sm font-medium">Capacity per slot</span>
        <input
          type="number"
          min={1}
          value={capacity}
          onChange={(e) => setCapacity(Number(e.target.value))}
          className="border border-gray-300 rounded-md px-2 py-1 text-sm"
        />
      </label>
    </fieldset>
  );

  return { fields, getConfig, reset };
}
