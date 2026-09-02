"use client";

import { useActionState } from "react";
import { completeVolunteerInvite } from "./actions";

export function AcceptInviteForm({ token, name }: { token: string; name: string }) {
  const [state, formAction, pending] = useActionState(
    completeVolunteerInvite.bind(null, token),
    undefined
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <p className="text-sm text-gray-600">
        Setting up your volunteer account, <span className="font-medium">{name}</span>.
      </p>

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
        className="bg-black text-white rounded-md px-4 py-2 disabled:opacity-50"
      >
        {pending ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
