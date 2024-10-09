import type { Metadata } from "next";
import { Manrope, Poppins } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/config/site";
import Providers from "@/Providers";
import { cn } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { Toaster } from "@/components/ui/sonner";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  openGraph: {
    images: [siteConfig.ogImage],
  },
  twitter: {
    card: "summary_large_image",
    images: [siteConfig.ogImage],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();

  return (
    <html lang="en">
      <body
        className={cn(
          manrope.className,
          poppins.variable,
          "smooth-scroll min-h-screen bg-background antialiased"
        )}
      >
        <Providers session={session}>
          {children}
          <Toaster
            position="top-right"
            visibleToasts={3}
            pauseWhenPageIsHidden
          />
        </Providers>
      </body>
    </html>
  );
}
