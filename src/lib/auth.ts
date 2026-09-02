import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: AuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/staff/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
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

        return { id: String(staff.id), email: staff.email, name: staff.name };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.staffId = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.staffId as string;
      return session;
    },
  },
};
