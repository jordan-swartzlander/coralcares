import "next-auth";
import "next-auth/jwt";

type Role = "staff" | "volunteer";

declare module "next-auth" {
  interface User {
    role: Role;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      email?: string | null;
      name?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    entityId?: string;
    role?: Role;
  }
}
