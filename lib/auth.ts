import type { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";
import { generateUserHash, validateEmail, validatePassword } from "./utils";

export const config = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    generateSessionToken: () => {
      return randomBytes(64).toString("hex");
    },
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        if (
          !validateEmail(credentials.email) ||
          !validatePassword(credentials.password)
        ) {
          return null;
        }

        const userHash = generateUserHash(
          credentials.email,
          credentials.password
        );

        const user = await db.user.findUnique({
          where: {
            userHash,
          },
          select: {
            id: true,
            username: true,
            college: {
              select: {
                name: true,
              },
            },
            isAdmin: true,
          },
        });

        if (!user) {
          return null;
        }

        return {
          id: user.id,
          username: user.username,
          college: user.college.name,
          isAdmin: user.isAdmin,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session }) {
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
  },
} satisfies NextAuthOptions;
