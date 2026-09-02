import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-md w-full px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold mb-8">
        Coral Academy NW
        <br />
        Volunteer Portal
      </h1>
      <div className="flex flex-col gap-4">
        <Link
          href="/register"
          className="bg-black text-white rounded-md px-4 py-2"
        >
          Apply to volunteer
        </Link>
        <Link href="/staff/login" className="text-sm underline">
          Staff login
        </Link>
      </div>
    </main>
  );
}
