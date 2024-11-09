import { X } from "lucide-react";
import { motion } from "framer-motion";
import { memo, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

const MediaWrapper = memo(
  ({
    children,
    onRemove,
    onClick,
  }: {
    children: React.ReactNode;
    onRemove: () => void;
    onClick: () => void;
  }) => (
    <motion.div
      className="group relative cursor-pointer"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        duration: 0.2,
      }}
      onClick={onClick}
    >
      {children}
      <motion.button
        className="absolute right-1 top-1 rounded-full bg-background/80 p-1.5 opacity-100 transition-opacity hover:bg-background md:opacity-0 md:group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={{
          type: "spring",
          bounce: 0.05,
          duration: 0.2,
        }}
      >
        <X size={14} />
      </motion.button>
    </motion.div>
  )
);

MediaWrapper.displayName = "MediaWrapper";

const Image = memo(({ src }: { src: string }) => (
  /* eslint-disable-next-line @next/next/no-img-element */
  <img
    src={src}
    alt="image media"
    className="aspect-square w-full rounded-md object-cover transition-all hover:brightness-90"
    loading="lazy"
  />
));

Image.displayName = "Image";

const Video = memo(({ src }: { src: string }) => (
  <video
    src={src}
    controls
    controlsList="nodownload nofullscreen noremoteplayback"
    playsInline
    preload="metadata"
    className="aspect-square w-full rounded-md object-contain transition-all hover:brightness-90 focus:outline-none"
    onContextMenu={(e) => e.preventDefault()}
  />
));

Video.displayName = "Video";

export const MediaItem = memo(
  ({
    type,
    src,
    onRemove,
  }: {
    type: "image" | "video";
    src: string;
    onRemove: () => void;
  }) => {
    const [showDialog, setShowDialog] = useState(false);

    return (
      <>
        <MediaWrapper onRemove={onRemove} onClick={() => setShowDialog(true)}>
          {type === "image" ? <Image src={src} /> : <Video src={src} />}
        </MediaWrapper>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent
            className="flex min-h-screen min-w-[100vw] flex-col items-center justify-center border-none bg-transparent shadow-none backdrop-blur-xl ~p-4/14"
            hideClose
          >
            <DialogTitle className="sr-only">Media Preview</DialogTitle>
            <DialogDescription className="sr-only">
              {type === "image" ? "Image Preview" : "Video Preview"}
            </DialogDescription>
            {type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt="image media"
                className="h-auto max-h-[80vh] w-auto rounded-md object-contain"
              />
            ) : (
              <video
                src={src}
                controls
                controlsList="nodownload noremoteplayback"
                playsInline
                preload="metadata"
                className="h-auto max-h-[80vh] w-auto rounded-md object-contain"
                onContextMenu={(e) => e.preventDefault()}
              />
            )}
            <DialogClose asChild>
              <motion.button
                className="absolute right-2 top-2 rounded-full border-2 border-background/80 bg-transparent p-1.5 opacity-100 transition-opacity hover:bg-background/10"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{
                  type: "spring",
                  bounce: 0.05,
                  duration: 0.2,
                }}
              >
                <X className="~size-8/10" />
              </motion.button>
            </DialogClose>
          </DialogContent>
        </Dialog>
      </>
    );
  }
);

MediaItem.displayName = "MediaItem";
