"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getAvatarURL, fetcher } from "@/lib/utils";
import { useCreateDialog, usePost } from "@/store";
import { Post, PostPrivacy } from "@prisma/client";
import { AnimatePresence, motion } from "framer-motion";
import { Globe, ImageIcon, Lock, Users, Video, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCallback, useRef, useState } from "react";
import { MediaItem } from "./media-item";
import useOutsideClick from "@/hooks/use-click-outside";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import nsfwFilter from "@/lib/nsfw";

const TRANSITION = {
  type: "spring",
  bounce: 0.05,
  duration: 0.2,
};

const MAX_MEDIA_ITEMS = 9;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];

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
  // Removing mentioned privacy for now
  // {
  //   label: "mentioned",
  //   icon: Lock,
  //   privacy: PostPrivacy.MENTIONED,
  // },
] as const;

const mediaOptions = [
  {
    label: "image",
    icon: ImageIcon,
    accept: ALLOWED_IMAGE_TYPES.join(","),
  },
  {
    label: "video",
    icon: Video,
    accept: ALLOWED_VIDEO_TYPES.join(","),
  },
] as const;

type MediaFile = {
  file: File;
  type: "image" | "video";
  url: string;
  blobUrl?: string;
  uploading?: boolean;
  deleting?: boolean;
  error?: string;
};

const useDeleteFromBlob = () => {
  return useMutation({
    mutationFn: async (url: string) => {
      const [response, status] = await fetcher("/api/upload/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      if (status !== 200) {
        throw new Error("Failed to delete file");
      }

      return response;
    },
    onError: (error) => {
      console.error("Error deleting file:", error);
      toast.error("Failed to delete file");
    },
  });
};

const useUploadToBlob = () => {
  return useMutation({
    mutationFn: async ({
      file,
      filename,
    }: {
      file: File;
      filename: string;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("filename", filename);

      const [response, status] = await fetcher<{ url: string }>("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (status !== 200) {
        throw new Error("Failed to upload file");
      }

      return response.url;
    },
  });
};

const useProfanityCheck = () => {
  return useMutation({
    mutationFn: async (content: string) => {
      const [response, status] = await fetcher<{
        flaggedFor: string;
        isProfanity: boolean;
        score: number;
      }>("https://vector.profanity.dev", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
      });

      if (status !== 200) {
        throw new Error("Failed to check profanity");
      }

      return response;
    },
  });
};

export function Content({ className }: { className?: string }) {
  const queryClient = useQueryClient();
  const { setOpenCreateDialog } = useCreateDialog();
  const { postPrivacy, setPostPrivacy } = usePost();
  const { data: session } = useSession();
  const avatarURL = getAvatarURL(session?.user?.username ?? "");

  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);

  const privacyRef = useRef<HTMLDivElement>(null);
  useOutsideClick(privacyRef as React.RefObject<HTMLElement>, () =>
    setIsOpen(false)
  );

  const uploadMutation = useUploadToBlob();
  const deleteMutation = useDeleteFromBlob();
  const profanityCheckMutation = useProfanityCheck();

  const createPostMutation = useMutation({
    mutationFn: async (data: {
      content: string;
      media: string[];
      privacy: PostPrivacy;
    }) => {
      const [response, status] = await fetcher<Post>("/api/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (status !== 200) {
        if ("error" in response) {
          throw new Error(response.error as string);
        }
        throw new Error("Failed to create post");
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["profile-posts"] });
      toast.success("Echo posted successfully!");
      setOpenCreateDialog(false);
      setContent("");
      setMediaFiles([]);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create post. Please try again.");
    },
  });

  const validateFile = (file: File, type: "image" | "video"): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return "File size exceeds 10MB limit";
    }

    const allowedTypes =
      type === "image" ? ALLOWED_IMAGE_TYPES : ALLOWED_VIDEO_TYPES;
    if (!allowedTypes.includes(file.type)) {
      return `Invalid ${type} format. Allowed formats: ${allowedTypes.join(", ")}`;
    }

    return null;
  };

  const handleMediaUpload = useCallback(
    async (files: FileList, type: "image" | "video") => {
      if (!files.length) return;

      const currentMediaCount = mediaFiles.length;
      const remainingSlots = MAX_MEDIA_ITEMS - currentMediaCount;

      if (remainingSlots <= 0) {
        toast.error(`Maximum ${MAX_MEDIA_ITEMS} media items allowed`);
        return;
      }

      const newMediaFiles = Array.from(files)
        .slice(0, remainingSlots)
        .map((file) => {
          const error = validateFile(file, type);
          if (error) {
            return {
              file,
              type,
              url: URL.createObjectURL(file),
              error,
            };
          }

          return {
            file,
            type,
            url: URL.createObjectURL(file),
            uploading: true,
          };
        });

      setMediaFiles((prev) => [...prev, ...newMediaFiles]);

      await Promise.all(
        newMediaFiles.map(async (mediaFile, index) => {
          if (mediaFile.error) return;

          try {
            let isSafe = true;
            if (mediaFile.type === "image") {
              try {
                isSafe = await nsfwFilter.isSafe(mediaFile.file);
                console.log({ isSafe });
              } catch (error) {
                console.error("NSFW predictor threw an error", error);
              }

              if (!isSafe) {
                setMediaFiles((prev) => {
                  const newFiles = [...prev];
                  newFiles[currentMediaCount + index] = {
                    ...newFiles[currentMediaCount + index],
                    uploading: false,
                    error: "NSFW content detected",
                  };
                  return newFiles;
                });
                return;
              }
            }

            const filename = `${Date.now()}-${mediaFile.file.name}`;
            const blobUrl = await uploadMutation.mutateAsync({
              file: mediaFile.file,
              filename,
            });

            setMediaFiles((prev) => {
              const newFiles = [...prev];
              newFiles[currentMediaCount + index] = {
                ...newFiles[currentMediaCount + index],
                uploading: false,
                blobUrl,
              };
              return newFiles;
            });
          } catch (error) {
            console.error(error);
            setMediaFiles((prev) => {
              const newFiles = [...prev];
              newFiles[currentMediaCount + index] = {
                ...newFiles[currentMediaCount + index],
                uploading: false,
                error: "Failed to upload file",
              };
              return newFiles;
            });
            toast.error("Failed to upload file");
          }
        })
      );
    },
    [mediaFiles, uploadMutation]
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

  const handlePost = useCallback(async () => {
    if (createPostMutation.isPending) return;
    if (!content.trim() && mediaFiles.length === 0) {
      toast.error("Please add some content or media");
      return;
    }

    if (mediaFiles.some((file) => file.uploading)) {
      toast.error("Please wait for all media to finish uploading");
      return;
    }

    if (mediaFiles.some((file) => file.error)) {
      toast.error("Please remove any media files with errors");
      return;
    }

    if (content.trim()) {
      const profanityCheck = await profanityCheckMutation.mutateAsync(content);

      if (profanityCheck.isProfanity) {
        toast.error(
          "Hey Buddy! Please be nice and keep it clean. I don't want to censor you."
        );
        return;
      }
    }

    createPostMutation.mutate({
      content: content.trim(),
      media: mediaFiles.map((file) => file.blobUrl || ""),
      privacy: postPrivacy,
    });
  }, [
    createPostMutation,
    content,
    mediaFiles,
    profanityCheckMutation,
    postPrivacy,
  ]);

  const handleRemoveMedia = useCallback(
    async (index: number) => {
      const mediaFile = mediaFiles[index];

      setMediaFiles((prev) => {
        const newFiles = [...prev];
        newFiles[index] = { ...newFiles[index], deleting: true };
        return newFiles;
      });

      try {
        if (mediaFile.url) {
          URL.revokeObjectURL(mediaFile.url);
        }

        if (mediaFile.blobUrl) {
          await deleteMutation.mutateAsync(mediaFile.blobUrl);
        }

        setMediaFiles((prev) => prev.filter((_, i) => i !== index));
      } catch (error) {
        console.error(error);
        setMediaFiles((prev) => {
          const newFiles = [...prev];
          newFiles[index] = {
            ...newFiles[index],
            deleting: false,
            error: "Failed to delete file",
          };
          return newFiles;
        });
      }
    },
    [mediaFiles, deleteMutation]
  );

  const handleClose = useCallback(async () => {
    await Promise.all(
      mediaFiles.map(async (file) => {
        if (file.url) {
          URL.revokeObjectURL(file.url);
        }
        if (file.blobUrl) {
          await deleteMutation.mutateAsync(file.blobUrl);
        }
      })
    );

    setMediaFiles([]);
    setContent("");
    setOpenCreateDialog(false);
  }, [mediaFiles, deleteMutation, setOpenCreateDialog]);

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
          onClick={handleClose}
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
                onRemove={() => handleRemoveMedia(index)}
                error={mediaItem.error}
                uploading={mediaItem.uploading}
                deleting={mediaItem.deleting}
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
          className="rounded-md bg-primary px-2.5 py-1 text-white disabled:opacity-50"
          onClick={handlePost}
          disabled={
            createPostMutation.isPending ||
            profanityCheckMutation.isPending ||
            (!content.trim() && mediaFiles.length === 0) ||
            mediaFiles.some((f) => f.uploading)
          }
        >
          {createPostMutation.isPending || profanityCheckMutation.isPending ? (
            <div className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              <span>Posting...</span>
            </div>
          ) : (
            "Echo"
          )}
        </motion.button>
      </div>
    </div>
  );
}
