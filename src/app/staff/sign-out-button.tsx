"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/staff/login" })}
      className="text-sm underline"
    >
      Sign out
    </button>
  );
}
