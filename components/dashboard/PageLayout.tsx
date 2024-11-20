"use client";

import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { cn, getAvatarURL } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { Icons } from "@/assets/Icons";
import { ChevronLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function PageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // prefetch the avatar
  const { data: session } = useSession();
  const avatarURL = getAvatarURL(session?.user?.username ?? "");
  router.prefetch(avatarURL);

  const queryClient = useQueryClient();

  return (
    <div className="flex min-h-screen flex-col">
      <header
        className={cn(
          "sticky top-0 flex h-14 w-full items-center bg-background px-4",
          pathname === "/"
            ? "justify-center"
            : "justify-between sm:justify-center"
        )}
      >
        {pathname !== "/" && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.back()}
            className="sm:hidden"
            aria-label="Go back"
          >
            <ChevronLeft className="size-5" />
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="font-[family-name:var(--font-poppins)] font-semibold capitalize"
          onClick={() => {
            queryClient.invalidateQueries({
              queryKey: ["posts"],
              exact: false,
            });
            queryClient.refetchQueries({ queryKey: ["posts"], exact: false });
            queryClient.fetchQuery({ queryKey: ["posts"] });
            router.push(pathname);
          }}
          aria-label="Refresh page"
        >
          <span className="hidden sm:block">
            {pathname === "/"
              ? "Home"
              : pathname.startsWith("/college")
                ? "College"
                : pathname.slice(1).replace(/-/g, " ")}
          </span>
          <span className="flex items-center gap-1.5 sm:hidden">
            <Icons.logo className="size-6" />
            <span className="translate-y-0.5">{siteConfig.name}</span>
          </span>
        </motion.button>

        {/* Placeholder div to maintain center alignment on desktop */}
        {pathname !== "/" && <div className="w-10 sm:hidden" />}
      </header>

      <main className="flex-1">
        <div className="no-scrollbar mx-auto h-[calc(100dvh-3rem)] w-full max-w-2xl overflow-y-auto rounded-t-lg border-x border-t border-border">
          {children}
        </div>
      </main>
    </div>
  );
}
