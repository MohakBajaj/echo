"use client";

import { Icons } from "@/assets/Icons";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";
import { TypewriterEffectSmooth } from "../ui/typewriter-effect";

export default function AuthLeftHalf({ className }: { className: string }) {
  return (
    <div id="login-header" className={cn("bg-foreground", className)}>
      <div className="flex h-dvh flex-col items-start justify-between p-4">
        <Link href="/">
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: "anticipate" }}
            className="flex select-none items-end"
          >
            <Icons.logo className="h-20 w-24 select-none fill-secondary" />
            <h1
              className={cn(
                "-translate-y-1 font-[family-name:var(--font-poppins)] text-5xl font-semibold text-secondary"
              )}
            >
              Echo
            </h1>
          </motion.div>
        </Link>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8, ease: "anticipate" }}
          className="mt-52 flex flex-grow"
        >
          <TypewriterEffectSmooth
            key={Math.random()}
            words={[
              {
                text: "Amplify",
                className: "text-accent",
              },
              {
                text: "Your",
                className: "text-accent",
              },
              {
                text: "Voice.",
                className: "text-secondary",
              },
              {
                text: "Anonymously.",
                className: "text-secondary",
              },
            ]}
            className="text-center font-bold"
            textClassName="text-[calc(3vw)]"
            cursorClassName="h-[calc(4.5vw)]"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8, ease: "anticipate" }}
          className="flex flex-col items-center justify-center"
        >
          <p className="text-sm text-secondary">
            &copy; {new Date().getFullYear()} Echo. All rights reserved.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
