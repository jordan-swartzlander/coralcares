import Link from "next/link";

export default function HowToVolunteerPage() {
  return (
    <main className="mx-auto max-w-md w-full px-6 py-16">
      <h1 className="text-2xl font-semibold mb-2">Becoming a Volunteer</h1>
      <p className="text-sm text-gray-600 mb-8">
        Here&apos;s how volunteering at Coral Academy NW works, from getting
        started to signing up for opportunities.
      </p>

      <ol className="flex flex-col gap-6 mb-10">
        <li>
          <p className="text-sm font-medium mb-1">1. Download the volunteer application</p>
          <p className="text-sm text-gray-600 mb-2">
            <a
              href="https://drive.google.com/file/d/1o-X3Rg-0wTRrA1Ip6Hdnj-L2AwrraTir/view"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Coral Academy NW Volunteer Application
            </a>
          </p>
          <p className="text-sm text-amber-600">
            This application must be submitted in person at the school
            office. Please bring a valid photo ID with you — it needs to be
            on record when you drop off your application.
          </p>
        </li>
        <li>
          <p className="text-sm font-medium mb-1">2. Complete a background check</p>
          <p className="text-sm text-gray-600">
            The office will walk you through the required background check
            paperwork.
          </p>
        </li>
        <li>
          <p className="text-sm font-medium mb-1">3. Get your account link</p>
          <p className="text-sm text-gray-600">
            Once you&apos;re cleared, staff will text or email you a link to
            set up your volunteer account.
          </p>
        </li>
        <li>
          <p className="text-sm font-medium mb-1">4. Sign up for opportunities</p>
          <p className="text-sm text-gray-600">
            Log in anytime to browse and sign up for volunteer opportunities.
          </p>
        </li>
      </ol>

      <p className="text-sm text-gray-600 mb-2">Already have an account?</p>
      <Link href="/volunteer/login" className="text-sm underline">
        Volunteer login
      </Link>
    </main>
  );
}
