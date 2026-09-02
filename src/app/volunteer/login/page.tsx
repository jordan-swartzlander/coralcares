"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function VolunteerLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await signIn("volunteer", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    setPending(false);

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push("/volunteer");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-sm w-full px-6 py-16">
      <h1 className="text-2xl font-semibold mb-8">Volunteer Login</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          <span className="text-sm font-medium">Password</span>
          <input
            name="password"
            type="password"
            required
            className="border border-gray-300 rounded-md px-3 py-2"
          />
        </label>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 bg-black text-white rounded-md px-4 py-2 disabled:opacity-50"
        >
          {pending ? "Signing in..." : "Sign in"}
        </button>

        <p className="text-sm text-gray-600">
          Don&apos;t have an account yet?{" "}
          <Link href="/register" className="underline">
            How to become a volunteer
          </Link>
        </p>
      </form>
    </main>
  );
}
