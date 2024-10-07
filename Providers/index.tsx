import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();

  return (
    <ThemeProvider
      attribute="class"
      enableSystem
      defaultTheme="dark"
      enableColorScheme
    >
      <SessionProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
