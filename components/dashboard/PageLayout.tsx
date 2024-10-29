"use client";

import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function PageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex flex-col items-center">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="mt-2 p-2 text-center font-[family-name:var(--font-poppins)] font-semibold capitalize"
        onClick={() => router.refresh()}
      >
        {pathname === "/" ? "Home" : pathname.slice(1).replace(/-/g, " ")}
      </motion.button>
      <div className="min-h-[calc(100dvh-3rem)] w-full overflow-y-auto rounded-t-xl border-x border-t border-border">
        {children}
      </div>
    </div>
  );
}
