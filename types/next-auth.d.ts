import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User extends DefaultSession["user"] {
    id: string;
    username: string;
    college: string;
  }

  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    college: string;
  }
}
