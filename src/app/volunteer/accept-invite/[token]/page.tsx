import { prisma } from "@/lib/prisma";
import { AcceptInviteForm } from "./accept-invite-form";

export default async function AcceptVolunteerInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const invite = await prisma.volunteerInvite.findUnique({
    where: { token },
    include: { volunteer: true },
  });
  const invalid = !invite || invite.usedAt || invite.expiresAt < new Date();

  return (
    <main className="mx-auto max-w-sm w-full px-6 py-16">
      <h1 className="text-2xl font-semibold mb-8">Set Up Volunteer Account</h1>

      {invalid || !invite ? (
        <p className="text-sm text-red-600">
          This invite link is invalid or has expired. Ask school staff to send a
          new one.
        </p>
      ) : (
        <AcceptInviteForm token={token} name={invite.volunteer.name} />
      )}
    </main>
  );
}
