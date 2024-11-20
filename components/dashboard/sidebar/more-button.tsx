"use client";

import useClickOutside from "@/hooks/use-click-outside";
import { MotionConfig, motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Monitor, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useId, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { Icons } from "@/assets/Icons";
import { cn } from "@/lib/utils";
import useWindow from "@/hooks/use-window";

const TRANSITION = {
  type: "spring",
  bounce: 0.05,
  duration: 0.2,
};

const FADE_IN_SCALE = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: TRANSITION,
};

const THEMES = [
  { label: "Light", value: "light", icon: Sun },
  { label: "Dark", value: "dark", icon: Moon },
  { label: "Auto", value: "system", icon: Monitor },
];

export default function MoreButton() {
  const appearanceRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const { isMobile } = useWindow();
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  useClickOutside(appearanceRef as React.RefObject<HTMLElement>, () =>
    setIsOpen(false)
  );

  return (
    <MotionConfig transition={TRANSITION}>
      <div className="relative flex items-center justify-center sm:mt-4">
        <motion.button
          key="button"
          layoutId={"more-button" + id}
          className="flex h-10 w-12 items-center justify-center bg-background px-3 text-foreground transition-colors hover:bg-muted"
          style={{
            borderRadius: 8,
          }}
          onClick={() => setIsOpen(true)}
          whileTap={{ scale: 0.95 }}
        >
          <motion.span
            layoutId={"more-label" + id}
            className="text-sm"
            animate={{ rotate: isOpen ? 180 : 0 }}
          >
            <Icons.more className="size-5" />
          </motion.span>
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={appearanceRef}
              layoutId={"more-button" + id}
              className={cn(
                "absolute z-[999] h-auto min-h-[180px] w-[50vw] max-w-[350px] overflow-hidden border border-border bg-background shadow-lg outline-none sm:w-[350px]",
                isMobile ? "right-0 top-0" : "bottom-0 left-0"
              )}
              style={{
                borderRadius: 12,
              }}
              {...FADE_IN_SCALE}
            >
              <div className="flex h-full flex-col">
                <motion.span
                  layoutId={"more-label" + id}
                  className="absolute left-4 top-3 select-none text-sm text-muted-foreground"
                >
                  Appearance
                </motion.span>
                <motion.div
                  className="flex h-full flex-col gap-4 p-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                    {THEMES.map((t) => (
                      <motion.button
                        key={t.value}
                        data-id={t.value}
                        className="relative flex flex-1 items-center justify-center rounded-lg px-3 py-2 text-foreground transition-colors hover:bg-muted"
                        onClick={() => {
                          setTheme(t.value);
                        }}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        aria-selected={theme === t.value}
                      >
                        <AnimatePresence>
                          {theme === t.value && (
                            <motion.div
                              layoutId="theme-active"
                              className="absolute inset-0 rounded-lg bg-muted"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={TRANSITION}
                            />
                          )}
                        </AnimatePresence>
                        <div className="z-10 flex flex-row items-center gap-2 sm:flex-col">
                          <t.icon size={20} />
                          <span className="text-sm">{t.label}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                  <motion.button
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => signOut()}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <LogOut size={16} />
                    <span>Log out</span>
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
