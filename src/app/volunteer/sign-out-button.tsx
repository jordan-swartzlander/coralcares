"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/volunteer/login" })}
      className="text-sm underline"
    >
      Sign out
    </button>
  );
}
