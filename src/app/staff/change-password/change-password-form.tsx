"use client";

import { useActionState } from "react";
import { changePassword } from "./actions";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, undefined);
  const success = state && "success" in state;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Current password</span>
        <input
          name="currentPassword"
          type="password"
          required
          className="border border-gray-300 rounded-md px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">New password</span>
        <input
          name="newPassword"
          type="password"
          required
          minLength={8}
          className="border border-gray-300 rounded-md px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Confirm new password</span>
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          className="border border-gray-300 rounded-md px-3 py-2"
        />
      </label>

      {state && "error" in state && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {success && (
        <p className="text-sm text-emerald-600" role="status">
          Password updated.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-black text-white rounded-md px-4 py-2 disabled:opacity-50 self-start"
      >
        {pending ? "Updating..." : "Update password"}
      </button>
    </form>
  );
}
