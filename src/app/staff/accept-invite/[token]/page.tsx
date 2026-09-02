import { prisma } from "@/lib/prisma";
import { AcceptInviteForm } from "./accept-invite-form";

export default async function AcceptStaffInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const invite = await prisma.staffInvite.findUnique({ where: { token } });
  const invalid = !invite || invite.usedAt || invite.expiresAt < new Date();

  return (
    <main className="mx-auto max-w-sm w-full px-6 py-16">
      <h1 className="text-2xl font-semibold mb-8">Set Up Staff Account</h1>

      {invalid ? (
        <p className="text-sm text-red-600">
          This invite link is invalid or has expired. Ask an administrator to send
          a new one.
        </p>
      ) : (
        <AcceptInviteForm token={token} email={invite.email} />
      )}
    </main>
  );
}
