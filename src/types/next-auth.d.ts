import "next-auth";
import "next-auth/jwt";

type Role = "staff" | "volunteer";
type StaffRole = "OWNER" | "ADMINISTRATOR" | "STAFF";
type StaffStatus = "PENDING_APPROVAL" | "ACTIVE" | "DENIED";

declare module "next-auth" {
  interface User {
    role: Role;
    staffRole?: StaffRole;
    staffStatus?: StaffStatus;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      staffRole?: StaffRole;
      staffStatus?: StaffStatus;
      email?: string | null;
      name?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    entityId?: string;
    role?: Role;
    staffRole?: StaffRole;
    staffStatus?: StaffStatus;
  }
}
