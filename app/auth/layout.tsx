"use client";

import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useSession({
    required: true,
    onUnauthenticated() {
      redirect("/");
    },
  });

  return <div>{children}</div>;
}
