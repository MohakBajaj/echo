import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    username: string;
    college: string;
    isAdmin: boolean;
  }

  interface Session {
    user: Omit<User, keyof DefaultSession["user"]> & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    college: string;
    isAdmin: boolean;
  }
}
