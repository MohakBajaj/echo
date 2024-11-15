"use client";
import Link from "next/link";
import { Icons } from "@/assets/Icons";
import { motion } from "framer-motion";
import AppearanceButton from "./appearance-button";
import { Heart, Home, Plus, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { useCreateDialog } from "@/store";
import { CreateDialog } from "../create-dialog";
import { useSession } from "next-auth/react";

const TRANSITION = {
  type: "spring",
  bounce: 0.05,
  duration: 0.2,
};

const ICON_SIZE = 24;

const BASE_BUTTON_CLASSES =
  "flex h-12 w-16 items-center justify-center rounded-lg px-4 py-3 text-muted-foreground transition-colors";

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
  const pathname = usePathname();
  const { data: session } = useSession();
  const { setOpenCreateDialog } = useCreateDialog();

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden w-fit flex-col justify-between p-4 sm:flex">
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
                button.href === pathname && "text-foreground",
                button.variant === "default" && "bg-background hover:bg-muted",
                button.variant === "muted" &&
                  "bg-muted hover:text-slate-500 dark:hover:text-white",
                button.href === "/profile" &&
                  pathname === `/profile/@${session?.user?.username}` &&
                  "text-foreground"
              )}
              onClick={() =>
                button.href
                  ? button.href === "/profile"
                    ? router.push(`/profile/@${session?.user?.username}`)
                    : router.push(button.href)
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

      {/* Mobile Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex w-full justify-around border-t border-border bg-background p-2 sm:hidden">
        {NAV_BUTTONS.map((button) => (
          <motion.button
            key={button.label}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={TRANSITION}
            className={cn(
              BASE_BUTTON_CLASSES,
              button.href === pathname && "text-foreground",
              button.variant === "default" && "bg-background hover:bg-muted",
              button.variant === "muted" &&
                "bg-muted hover:text-slate-500 dark:hover:text-white",
              button.href === "/profile" &&
                pathname === `/profile/@${session?.user?.username}` &&
                "text-foreground"
            )}
            onClick={() =>
              button.href
                ? button.href === "/profile"
                  ? router.push(`/profile/@${session?.user?.username}`)
                  : router.push(button.href)
                : button.label === "Create" && setOpenCreateDialog(true)
            }
          >
            <button.icon size={20} />
          </motion.button>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={TRANSITION}
        className="fixed bottom-8 right-8 hidden rounded-xl border border-foreground bg-muted px-6 py-3.5 md:block"
        onClick={() => setOpenCreateDialog(true)}
      >
        <Plus size={32} />
      </motion.button>

      <CreateDialog />
    </>
  );
}
