"use client";

import { useActionState } from "react";
import { registerVolunteer } from "./actions";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerVolunteer, undefined);

  return (
    <main className="mx-auto max-w-md w-full px-6 py-16">
      <h1 className="text-2xl font-semibold mb-2">Volunteer Registration</h1>
      <p className="text-sm text-gray-600 mb-8">
        Fill out the form below to apply to volunteer and create your account.
        Your application will be reviewed by school staff before you can sign
        up for opportunities.
      </p>

      <form action={formAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Full name</span>
          <input
            name="name"
            type="text"
            required
            className="border border-gray-300 rounded-md px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Email</span>
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
          <span className="text-sm font-medium">
            Your student&apos;s name (at Coral Academy NW)
          </span>
          <input
            name="studentName"
            type="text"
            required
            className="border border-gray-300 rounded-md px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Password</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Confirm password</span>
          <input
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
        </label>

        {state?.error && (
          <p className="text-sm text-red-600" role="alert">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 bg-black text-white rounded-md px-4 py-2 disabled:opacity-50"
        >
          {pending ? "Submitting..." : "Submit application"}
        </button>
      </form>
    </main>
  );
}
