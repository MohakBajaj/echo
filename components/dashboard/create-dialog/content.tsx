"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getAvatarURL } from "@/lib/utils";
import { useCreateDialog, usePost } from "@/store";
import { PostPrivacy } from "@prisma/client";
import { AnimatePresence, motion } from "framer-motion";
import { Globe, ImageIcon, Lock, Users, Video } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCallback, useRef, useState } from "react";
import { MediaItem } from "./media-item";
import useOutsideClick from "@/hooks/use-click-outside";

const TRANSITION = {
  type: "spring",
  bounce: 0.05,
  duration: 0.2,
};

const MAX_MEDIA_ITEMS = 9;

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
] as const;

const mediaOptions = [
  {
    label: "image",
    icon: ImageIcon,
    accept: "image/*",
  },
  {
    label: "video",
    icon: Video,
    accept: "video/*",
  },
] as const;

export function Content({ className }: { className?: string }) {
  const { setOpenCreateDialog } = useCreateDialog();
  const { postPrivacy, setPostPrivacy } = usePost();
  const { data: session } = useSession();
  const avatarURL = getAvatarURL(session?.user?.name ?? "");

  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState<
    { file: File; type: "image" | "video"; url: string }[]
  >([]);

  const privacyRef = useRef<HTMLDivElement>(null);
  useOutsideClick(privacyRef as React.RefObject<HTMLElement>, () =>
    setIsOpen(false)
  );

  const handleMediaUpload = useCallback(
    (files: FileList, type: "image" | "video") => {
      if (!files.length) return;

      const currentMediaCount = mediaFiles.length;
      const remainingSlots = MAX_MEDIA_ITEMS - currentMediaCount;
      if (remainingSlots <= 0) return;

      const newMediaFiles = Array.from(files)
        .slice(0, remainingSlots)
        .map((file) => {
          const url = URL.createObjectURL(file);
          return { file, type, url };
        });

      setMediaFiles((prev) => [...prev, ...newMediaFiles]);
    },
    [mediaFiles]
  );

  const handleFileSelect = useCallback(
    (accept: string, type: "image" | "video") => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = accept;
      input.multiple = true;
      input.click();

      input.onchange = () => {
        if (!input.files) return;
        handleMediaUpload(input.files, type);
      };
    },
    [handleMediaUpload]
  );

  const handlePost = useCallback(() => {
    // TODO: Implement post creation
    console.log({
      content,
      privacy: postPrivacy,
      mediaCount: mediaFiles.length,
      mediaFiles: mediaFiles,
    });
    console.table(mediaFiles);
  }, [content, postPrivacy, mediaFiles]);

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
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="no-scrollbar resize-x-none rounded-md bg-background p-2 focus:outline-none"
          />

          {/* Media Items */}
          <div className="grid grid-cols-3 gap-2">
            {mediaFiles.map((mediaItem, index) => (
              <MediaItem
                key={index}
                type={mediaItem.type}
                src={mediaItem.url}
                onRemove={() => {
                  URL.revokeObjectURL(mediaItem.url);
                  setMediaFiles((prev) => prev.filter((_, i) => i !== index));
                }}
              />
            ))}
          </div>

          {/* Media Options */}
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {mediaOptions.map((option) => (
                <motion.button
                  key={option.label}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={TRANSITION}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() =>
                    handleFileSelect(
                      option.accept,
                      option.label as "image" | "video"
                    )
                  }
                  disabled={mediaFiles.length >= MAX_MEDIA_ITEMS}
                >
                  <option.icon size={16} />
                  <span className="capitalize">{option.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Number of Media Slots available */}
            {mediaFiles.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {`${mediaFiles.length}/${MAX_MEDIA_ITEMS}`}
              </span>
            )}
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
                transition={TRANSITION}
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
          onClick={handlePost}
        >
          Echo
        </motion.button>
      </div>
    </div>
  );
}
