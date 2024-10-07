import type {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from "next";
import type { NextAuthOptions, User } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import type { Adapter } from "next-auth/adapters";

export const config = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(db) as Adapter,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        if (
          credentials.email === "admin" &&
          credentials.password === "password"
        ) {
          return {
            id: "1",
            name: "Admin",
            username: "admin",
            college: "Example University",
          } satisfies User;
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      return { ...session, ...token };
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.college = user.college;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/logout",
  },
} satisfies NextAuthOptions;

export function auth(
  ...args:
    | [GetServerSidePropsContext["req"], GetServerSidePropsContext["res"]]
    | [NextApiRequest, NextApiResponse]
    | []
) {
  return getServerSession(...args, config);
}
