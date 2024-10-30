import { X } from "lucide-react";
import { motion } from "framer-motion";
import { memo } from "react";

const MediaWrapper = memo(
  ({
    children,
    onRemove,
  }: {
    children: React.ReactNode;
    onRemove: () => void;
  }) => (
    <motion.div
      className="group relative"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        duration: 0.2,
      }}
    >
      {children}
      <motion.button
        className="absolute right-1 top-1 rounded-full bg-background/80 p-1.5 opacity-100 transition-opacity hover:bg-background md:opacity-0 md:group-hover:opacity-100"
        onClick={onRemove}
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
    return (
      <MediaWrapper onRemove={onRemove}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        {type === "image" ? <Image src={src} /> : <Video src={src} />}
      </MediaWrapper>
    );
  }
);

MediaItem.displayName = "MediaItem";
