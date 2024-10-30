"use client";

import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { getAvatarURL } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { Icons } from "@/assets/Icons";

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

  return (
    <div className="flex flex-col items-center">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="mt-2 p-2 text-center font-[family-name:var(--font-poppins)] font-semibold capitalize"
        onClick={() => router.refresh()}
      >
        <span className="hidden sm:block">
          {pathname === "/" ? "Home" : pathname.slice(1).replace(/-/g, " ")}
        </span>
        <span className="flex items-center gap-1 sm:hidden">
          <Icons.logo className="size-6" />
          <p className="translate-y-0.5">{siteConfig.name}</p>
        </span>
      </motion.button>
      <div className="min-h-[calc(100dvh-3rem)] w-full overflow-y-auto border-t border-border sm:rounded-t-xl sm:border-x">
        {children}
      </div>
    </div>
  );
}
