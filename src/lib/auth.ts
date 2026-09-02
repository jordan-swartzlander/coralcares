import type { AuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: AuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      id: "staff",
      name: "Staff Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const staff = await prisma.staff.findUnique({
          where: { email: credentials.email },
        });
        if (!staff) return null;

        const valid = await bcrypt.compare(credentials.password, staff.passwordHash);
        if (!valid) return null;

        return {
          id: String(staff.id),
          email: staff.email,
          name: staff.name,
          role: "staff",
          staffRole: staff.role,
          staffStatus: staff.status,
        };
      },
    }),
    CredentialsProvider({
      id: "volunteer",
      name: "Volunteer Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const volunteer = await prisma.volunteer.findUnique({
          where: { email: credentials.email },
        });
        if (!volunteer || !volunteer.passwordHash) return null;

        const valid = await bcrypt.compare(credentials.password, volunteer.passwordHash);
        if (!valid) return null;

        return {
          id: String(volunteer.id),
          email: volunteer.email,
          name: volunteer.name,
          role: "volunteer",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.entityId = user.id;
        token.role = user.role;
        token.staffRole = user.staffRole;
        token.staffStatus = user.staffStatus;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.entityId as string;
        session.user.role = token.role as "staff" | "volunteer";
        session.user.staffRole = token.staffRole;
        session.user.staffStatus = token.staffStatus;
      }
      return session;
    },
  },
};

export type StaffRoleType = "OWNER" | "ADMINISTRATOR" | "STAFF";

/** Any authenticated, ACTIVE staff account regardless of role. */
export async function requireActiveStaff(): Promise<{ id: number; role: StaffRoleType }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "staff") {
    throw new Error("Unauthorized");
  }
  if (session.user.staffStatus !== "ACTIVE") {
    throw new Error("Account is not active");
  }
  return { id: Number(session.user.id), role: session.user.staffRole as StaffRoleType };
}

/** An authenticated, ACTIVE staff account whose role is one of allowedRoles. */
export async function requireStaffRole(
  allowedRoles: StaffRoleType[]
): Promise<{ id: number; role: StaffRoleType }> {
  const staff = await requireActiveStaff();
  if (!allowedRoles.includes(staff.role)) {
    throw new Error("Forbidden");
  }
  return staff;
}

export async function requireVolunteerId(): Promise<number> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "volunteer") {
    throw new Error("Unauthorized");
  }
  return Number(session.user.id);
}
