"use client";
import Link from "next/link";
import { Icons } from "@/assets/Icons";
import { motion } from "framer-motion";
import AppearanceButton from "./appearance-button";
import { Heart, Home, Plus, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useCreateDialog } from "@/store";

const TRANSITION = {
  type: "spring",
  bounce: 0.05,
  duration: 0.2,
};

const ICON_SIZE = 24;

const BASE_BUTTON_CLASSES =
  "flex h-12 w-16 items-center justify-center rounded-lg px-4 py-3 text-foreground transition-colors";

const NAV_BUTTONS = [
  { icon: Home, label: "Home", variant: "default", href: "/" },
  { icon: Search, label: "Search", variant: "default", href: "/search" },
  {
    icon: Plus,
    label: "Create",
    variant: "muted",
  },
  {
    icon: Heart,
    label: "Notifications",
    variant: "default",
    href: "/notifications",
  },
  { icon: User, label: "Profile", variant: "default", href: "/profile" },
];

export default function Sidebar() {
  const router = useRouter();
  const { setOpenCreateDialog } = useCreateDialog();
  return (
    <div className="flex w-fit flex-col justify-between p-4">
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
      <div className="flex flex-col space-y-4">
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
            onClick={() =>
              button.href
                ? router.push(button.href)
                : button.label === "Create" && setOpenCreateDialog(true)
            }
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
