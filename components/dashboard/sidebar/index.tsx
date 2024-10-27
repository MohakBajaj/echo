"use client";
import Link from "next/link";
import { Icons } from "@/assets/Icons";
import { motion } from "framer-motion";
import AppearanceButton from "./appearance-button";
import { Heart, Home, Plus, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TRANSITION = {
  type: "spring",
  bounce: 0.05,
  duration: 0.2,
};

const ICON_SIZE = 24;

const BASE_BUTTON_CLASSES =
  "flex h-10 w-12 items-center justify-center rounded-md p-2 text-foreground transition-colors";

const NAV_BUTTONS = [
  { icon: Home, label: "Home", variant: "default" },
  { icon: Search, label: "Search", variant: "default" },
  { icon: Plus, label: "Create", variant: "muted" },
  { icon: Heart, label: "Notifications", variant: "default" },
  { icon: User, label: "Profile", variant: "default" },
];

export default function Sidebar() {
  return (
    <div className="flex w-fit flex-col justify-between border-r border-border p-4">
      {/* Logo */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={TRANSITION}
      >
        <Link href="/" className="text-foreground">
          <Icons.logo className="size-12" />
          <span className="sr-only">Echo</span>
        </Link>
      </motion.div>
      {/* Buttons */}
      <div className="flex flex-col space-y-2">
        {NAV_BUTTONS.map((button) => (
          <motion.button
            key={button.label}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={TRANSITION}
            className={cn(
              BASE_BUTTON_CLASSES,
              button.variant === "default" && "bg-background hover:bg-muted",
              button.variant === "muted" &&
                "bg-muted hover:text-slate-500 dark:hover:text-white"
            )}
          >
            <button.icon size={ICON_SIZE} />
          </motion.button>
        ))}
      </div>
      {/* Appearance */}
      <AppearanceButton />
    </div>
  );
}
