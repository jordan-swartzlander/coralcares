import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { ChangePasswordForm } from "./change-password-form";

export default async function ChangePasswordPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "staff" || session.user.staffStatus !== "ACTIVE") {
    redirect("/staff/login");
  }

  return (
    <main className="mx-auto max-w-md w-full px-6 py-16">
      <div className="mb-8">
        <Link href="/staff" className="text-sm underline">
          ← Back to dashboard
        </Link>
        <h1 className="text-2xl font-semibold mt-2">Change Password</h1>
      </div>

      <ChangePasswordForm />
    </main>
  );
}
