import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User extends DefaultSession["user"] {
    id: string;
    username: string;
    college: string;
    isAdmin: boolean;
  }

  interface Session {
    user: User;
  }
}
