"use client";

import { useState, useRef } from "react";
import useWindow from "@/hooks/use-window";
import { useCreateDialog, usePost } from "@/store";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { AnimatePresence, motion } from "framer-motion";
import { cn, getAvatarURL } from "@/lib/utils";
import {
  FilesIcon,
  Globe,
  ImageIcon,
  Lock,
  MapPin,
  Users,
  Video,
} from "lucide-react";
import { PostPrivacy } from "@prisma/client";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

const TRANSITION = {
  type: "spring",
  bounce: 0.05,
  duration: 0.2,
};

export function CreateDialog() {
  const { isMobile } = useWindow();
  const { openCreateDialog, setOpenCreateDialog } = useCreateDialog();

  if (isMobile) {
    return (
      <Drawer open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DrawerContent className="h-[100dvh]">
          <DrawerTitle className="sr-only">Create New Echo</DrawerTitle>
          <Content className="pt-2" />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
      <DialogContent className="min-h-[25dvh] min-w-[30dvw] p-0" hideClose>
        <DialogTitle className="sr-only">Create New Echo</DialogTitle>
        <Content />
      </DialogContent>
    </Dialog>
  );
}

const privacyOptions = [
  {
    label: "anyone",
    icon: Globe,
    privacy: PostPrivacy.ANYONE,
  },
  {
    label: "followers",
    icon: Users,
    privacy: PostPrivacy.FOLLOWED,
  },
  {
    label: "mentioned",
    icon: Lock,
    privacy: PostPrivacy.MENTIONED,
  },
];

const mediaOptions = [
  {
    label: "image",
    icon: ImageIcon,
  },
  {
    label: "video",
    icon: Video,
  },
  {
    label: "file",
    icon: FilesIcon,
  },
  {
    label: "location",
    icon: MapPin,
  },
];

function Content({ className }: { className?: string }) {
  const { setOpenCreateDialog } = useCreateDialog();
  const [isOpen, setIsOpen] = useState(false);
  const privacyRef = useRef<HTMLDivElement>(null);
  const { postPrivacy, setPostPrivacy } = usePost();
  const { data: session } = useSession();
  const avatarURL = getAvatarURL(session?.user?.name ?? "");

  return (
    <div className={cn(className, "flex flex-col")}>
      {/* header */}
      <div className="relative flex w-full items-center justify-center border-b border-border p-2">
        <h1 className="font-[family-name:var(--font-poppins)] text-lg font-semibold">
          New Echo
        </h1>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={TRANSITION}
          className="absolute left-2 rounded-md px-2 py-1 hover:bg-muted"
          onClick={() => setOpenCreateDialog(false)}
        >
          Cancel
        </motion.button>
      </div>
      {/* body */}
      <div className="flex h-full flex-col gap-4 p-4 md:flex-1">
        <div className="flex flex-col gap-2">
          <div className="flex items-center space-x-2">
            <Avatar className="size-8 rounded-md">
              <AvatarImage src={avatarURL} />
              <AvatarFallback>
                {session?.user?.username?.[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h3 className="font-semibold">{session?.user?.username}</h3>
            <span className="rounded-md bg-muted px-2 text-xs text-muted-foreground">
              {session?.user?.college}
            </span>
          </div>
          <textarea
            placeholder="What's on your mind?"
            rows={1}
            className="no-scrollbar resize-x-none rounded-md bg-background p-2 focus:outline-none"
          />
          <div className="flex flex-wrap items-center gap-2">
            {mediaOptions.map((option) => (
              <motion.button
                key={option.label}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={TRANSITION}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
              >
                <option.icon size={16} />
                <span className="capitalize">{option.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
      {/* footer */}
      <div className="flex w-full items-center justify-between gap-2 border-t border-border px-2 py-3">
        {/* Privacy */}
        <div className="relative flex items-center justify-center">
          <motion.button
            className="flex h-8 items-center justify-center gap-2 rounded-md bg-background px-2 text-foreground transition-colors hover:bg-muted"
            onClick={() => setIsOpen(true)}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div className="flex items-center gap-2">
              {postPrivacy === PostPrivacy.MENTIONED ? (
                <Lock size={16} />
              ) : postPrivacy === PostPrivacy.FOLLOWED ? (
                <Users size={16} />
              ) : (
                <Globe size={16} />
              )}
              <span className="text-sm capitalize">
                {postPrivacy === PostPrivacy.MENTIONED
                  ? "Mentioned"
                  : postPrivacy === PostPrivacy.FOLLOWED
                    ? "Followers"
                    : "Anyone"}
              </span>
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                ref={privacyRef}
                className="absolute bottom-0 left-0 w-[200px] overflow-hidden rounded-lg border border-border bg-background shadow-lg outline-none"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ type: "spring", bounce: 0, duration: 0.2 }}
              >
                <div className="flex flex-col p-1">
                  {privacyOptions.map((option) => (
                    <motion.button
                      key={option.label}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
                      onClick={() => {
                        setPostPrivacy(option.privacy);
                        setIsOpen(false);
                      }}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <option.icon size={16} />
                      <span className="capitalize">{option.label}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Echo Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={TRANSITION}
          className="rounded-md bg-primary px-2.5 py-1 text-white"
        >
          Echo
        </motion.button>
      </div>
    </div>
  );
}
