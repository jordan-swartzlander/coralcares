import Link from "next/link";

export default function RegisterSuccessPage() {
  return (
    <main className="mx-auto max-w-md w-full px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold mb-2">Application submitted</h1>
      <p className="text-sm text-gray-600 mb-8">
        Thanks for applying to volunteer! School staff will review your
        application and follow up by email.
      </p>
      <Link href="/" className="text-sm underline">
        Back to home
      </Link>
    </main>
  );
}
