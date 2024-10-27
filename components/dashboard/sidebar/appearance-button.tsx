"use client";

import useClickOutside from "@/hooks/use-click-outside";
import { MotionConfig, motion, AnimatePresence } from "framer-motion";
import { SunMoon, Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { useRef, useState } from "react";

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

export default function AppearanceButton() {
  const appearanceRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  useClickOutside(appearanceRef as React.RefObject<HTMLElement>, () =>
    setIsOpen(false)
  );

  return (
    <MotionConfig transition={TRANSITION}>
      <div className="relative mt-4 flex items-center justify-center">
        <motion.button
          key="button"
          layoutId="appearance-button"
          className="flex h-10 w-12 items-center justify-center bg-background px-3 text-foreground transition-colors hover:bg-muted"
          style={{
            borderRadius: 8,
          }}
          onClick={() => setIsOpen(true)}
          whileTap={{ scale: 0.95 }}
        >
          <motion.span
            layoutId="appearance-label"
            className="text-sm"
            animate={{ rotate: isOpen ? 180 : 0 }}
          >
            <SunMoon size={20} />
          </motion.span>
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={appearanceRef}
              layoutId="appearance-button"
              className="absolute bottom-0 left-0 h-[120px] w-[350px] overflow-hidden border border-border bg-background shadow-lg outline-none"
              style={{
                borderRadius: 12,
              }}
              {...FADE_IN_SCALE}
            >
              <div className="flex h-full flex-col">
                <motion.span
                  layoutId="appearance-label"
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
                  <div className="mt-6 flex flex-row gap-2">
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
                        <div className="z-10 flex flex-col items-center gap-2">
                          <t.icon size={20} />
                          <span className="text-sm">{t.label}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
