import type { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";
import { generateUserHash, validateEmail, validatePassword } from "./utils";

export const config = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // 24 hours
    generateSessionToken: () => randomBytes(64).toString("hex"),
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<User | null> {
        // Validate credentials exist
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Validate email and password format
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

        // Find user in database
        const user = await db.user.findUnique({
          where: { userHash },
          select: {
            id: true,
            username: true,
            college: {
              select: { name: true },
            },
            isAdmin: true,
          },
        });

        if (!user) {
          return null;
        }

        // Return user data formatted for session
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
    async session({ session, token }) {
      // Ensure we're always using the token data
      session.user = {
        ...session.user,
        id: token.id,
        username: token.username,
        college: token.college,
        isAdmin: token.isAdmin,
      };
      return session;
    },
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.college = user.college;
        token.isAdmin = user.isAdmin;
      }

      // Handle username update
      if (trigger === "update" && session?.user?.username) {
        token.username = session.user.username;
      }

      return token;
    },
  },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
  },
} satisfies NextAuthOptions;
