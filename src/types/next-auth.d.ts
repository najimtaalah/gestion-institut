import type { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      establishmentIds: string[];
    };
  }

  interface User {
    id: string;
    role: UserRole;
    establishmentIds: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    establishmentIds: string[];
  }
}
