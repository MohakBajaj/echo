import type { Metadata } from "next";
import { Manrope, Poppins } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/config/site";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${manrope.variable} ${poppins.variable} smooth-scroll min-h-screen bg-background antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
