"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { useId } from "react";
import HolyLoader from "holy-loader";
import { NuqsAdapter } from "nuqs/adapters/next/app";

export default function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  const key = useId();
  const queryClient = new QueryClient();

  return (
    <ThemeProvider
      key={key}
      attribute="class"
      defaultTheme="dark"
      enableSystem
      enableColorScheme
    >
      <HolyLoader height={2} color="#CECDC3" />
      <NuqsAdapter>
        <SessionProvider session={session}>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </SessionProvider>
      </NuqsAdapter>
    </ThemeProvider>
  );
}
