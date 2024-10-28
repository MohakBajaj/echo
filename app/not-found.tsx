"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home } from "lucide-react";

const TRANSITION = {
  type: "spring",
  bounce: 0.5,
  duration: 0.8,
};

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={TRANSITION}
        className="flex flex-col items-center gap-8 text-center"
      >
        <h1 className="text-8xl font-bold text-foreground">404</h1>
        <p className="text-xl text-muted-foreground">
          Oops! The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={TRANSITION}
        >
          <Link
            href="/"
            className="group flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-background transition-colors hover:bg-muted hover:text-foreground"
          >
            <Home className="size-5" />
            <span>Return Home</span>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
