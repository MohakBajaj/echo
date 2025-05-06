import { getAvatarURL, fetcher } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import Image from "next/image";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem } from "../ui/carousel";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import {
  CircleAlert,
  Heart,
  Play,
  ThumbsDown,
  Trash,
  X,
  MessageCircle,
  Repeat,
  CornerDownRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Button } from "../ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { ReplyForm } from "./post-details/reply-form";

const reportSchema = z.object({
  reason: z.string().min(10, "Reason must be at least 10 characters"),
});

type ReportFormValues = z.infer<typeof reportSchema>;

type Post = {
  id: string;
  text: string;
  media: string[];
  authorId: string;
  author: { username: string; college: { name: string } };
  _count: {
    likes: number;
    dislikes: number;
    replies?: number;
    reposts?: number;
  };
  parentPostId?: string;
  parentPost?: Post | null;
  isParent?: boolean;
  isReply?: boolean;
  isThread?: boolean;
  isRepost?: boolean;
  repostedBy?: { username: string; id: string };
  onReplyClick?: () => void;
  isLiked?: boolean;
  isDisliked?: boolean;
  isReposted?: boolean;
  createdAt?: string;
};

type RepostResponse = { reposted: boolean };

export default function Post({
  id,
  text,
  media,
  authorId,
  author,
  _count,
  isParent,
  isReply,
  isThread,
  isRepost,
  repostedBy,
  onReplyClick,
  isLiked,
  isDisliked,
  isReposted,
}: Post) {
  const { data: session } = useSession();
  const isOwner = session?.user?.id === authorId;
  const [showDialog, setShowDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{
    url: string;
    isVideo: boolean;
  } | null>(null);
  const [showInlineReply, setShowInlineReply] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  const queryClient = useQueryClient();

  // Fetch the first few replies for this post
  const { data: replies } = useQuery({
    queryKey: ["post", "preview-replies", id],
    queryFn: async () => {
      if (!showReplies) return null;
      const [data] = await fetcher<Post[]>(`/api/post/${id}/replies`);
      // Only return the first 3 replies
      return data?.slice(0, 3) || [];
    },
    enabled: showReplies && !!id,
  });

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: { reason: "" },
  });

  const reportMutation = useMutation({
    mutationFn: async (values: ReportFormValues) => {
      const [data, status] = await fetcher("/api/profile/report", {
        method: "POST",
        body: JSON.stringify({ postId: id, reason: values.reason }),
      });

      if (status !== 200) {
        throw new Error("Failed to report post");
      }

      return data;
    },
    onSuccess: () => {
      setShowReportDialog(false);
      form.reset();
      toast.success("Post reported successfully");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const [data, status] = await fetcher("/api/post", {
        method: "DELETE",
        body: JSON.stringify({ postId: id }),
      });

      if (status !== 200) {
        throw new Error("Failed to delete post");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile-posts"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["search"] });
      setShowDeleteDialog(false);
      toast.success("Post deleted successfully");
    },
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      const [data, status] = await fetcher("/api/post/toggle/like", {
        method: "POST",
        body: JSON.stringify({ postId: id }),
      });

      if (status !== 200) {
        throw new Error("Failed to like post");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["profile-posts"] });

      if (isThread) {
        queryClient.invalidateQueries({ queryKey: ["post", "thread"] });
      }
    },
  });

  const dislikeMutation = useMutation({
    mutationFn: async () => {
      const [data, status] = await fetcher("/api/post/toggle/dislike", {
        method: "POST",
        body: JSON.stringify({ postId: id }),
      });

      if (status !== 200) {
        throw new Error("Failed to dislike post");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["search"] });
      queryClient.invalidateQueries({ queryKey: ["profile-posts"] });

      if (isThread) {
        queryClient.invalidateQueries({ queryKey: ["post", "thread"] });
      }
    },
  });

  const repostMutation = useMutation<RepostResponse>({
    mutationFn: async () => {
      const [data, status] = await fetcher<RepostResponse>(
        "/api/post/toggle/repost",
        { method: "POST", body: JSON.stringify({ postId: id }) }
      );

      if (status !== 200) {
        throw new Error("Failed to repost");
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["search"] });
      queryClient.invalidateQueries({ queryKey: ["profile-posts"] });

      if (isThread) {
        queryClient.invalidateQueries({ queryKey: ["post", "thread"] });
      }

      if (data.reposted) {
        toast.success("Reposted successfully");
      } else {
        toast.success("Removed repost");
      }
    },
  });

  // Handle inline reply completion
  const handleReplyComplete = () => {
    setShowInlineReply(false);
    // Refresh replies preview if they're being shown
    if (showReplies) {
      queryClient.invalidateQueries({
        queryKey: ["post", "preview-replies", id],
      });
    }
  };

  return (
    <div className="space-y-1">
      {/* Repost indicator */}
      {isRepost && repostedBy && (
        <div className="flex items-center gap-1.5 px-4 py-1 text-xs text-muted-foreground">
          <Repeat className="size-3" />
          <span>
            Reposted by{" "}
            <Link
              href={`/profile/@${repostedBy.username}`}
              className="hover:text-primary hover:underline"
            >
              @{repostedBy.username}
            </Link>
          </span>
        </div>
      )}

      <div
        id={`post-${id}`}
        className={`relative rounded-lg border border-border ${
          isParent
            ? "bg-card/30"
            : isReposted
              ? "bg-emerald-50/5"
              : "bg-card/50"
        } p-4 shadow-sm transition-colors hover:bg-card/80 ${
          isReposted ? "ring-1 ring-emerald-300/10" : ""
        }`}
      >
        <Link
          href={isReply ? `/post/${id}` : `/profile/@${author.username}`}
          className="flex w-fit items-center gap-3 hover:opacity-80"
        >
          <Avatar className="size-10 rounded-md ring-2 ring-primary/10">
            <AvatarImage src={getAvatarURL(author.username)} />
            <AvatarFallback className="bg-primary/5 font-medium">
              {author.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">@{author.username}</p>
            <p className="text-sm text-muted-foreground">
              {author.college.name}
            </p>
          </div>
        </Link>

        <Link
          href={isParent ? "#" : `/post/${id}`}
          className={isParent ? "cursor-default" : ""}
        >
          <p className="mt-3 whitespace-break-spaces text-pretty">{text}</p>
        </Link>

        {media.length > 0 && (
          <div className="mt-3">
            <Carousel className="max-h-64 w-full" opts={{ dragFree: true }}>
              <CarouselContent className="max-h-64">
                {media.map((url) => {
                  const isVideo = url.match(/\.(mp4|webm)$/i);
                  return (
                    <CarouselItem key={url} className="basis-1/3 cursor-grab">
                      {isVideo ? (
                        <div
                          className="relative flex max-h-64 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl"
                          onClick={() => {
                            setSelectedMedia({ url, isVideo: true });
                            setShowDialog(true);
                          }}
                        >
                          <video
                            src={url}
                            preload="metadata"
                            className="aspect-square max-h-64 w-full object-cover transition-transform hover:scale-105"
                            onContextMenu={(e) => e.preventDefault()}
                          />
                          {/* Play button */}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <Play className="size-10 fill-white stroke-white transition-transform hover:scale-110" />
                          </div>
                        </div>
                      ) : (
                        <div
                          className="relative flex max-h-64 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl"
                          onClick={() => {
                            setSelectedMedia({ url, isVideo: false });
                            setShowDialog(true);
                          }}
                        >
                          <div className="absolute inset-0">
                            <Image
                              src={url}
                              alt=""
                              width={1024}
                              height={1024}
                              className="h-full w-full object-cover opacity-60 blur-3xl"
                            />
                          </div>
                          <Image
                            src={url}
                            alt=""
                            width={1024}
                            height={1024}
                            className="relative aspect-square h-auto w-full object-contain transition-transform hover:scale-105"
                          />
                        </div>
                      )}
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
            </Carousel>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogContent
                className="flex min-h-screen min-w-[100vw] flex-col items-center justify-center border-none bg-black/90 shadow-none backdrop-blur-xl ~p-4/14"
                hideClose
              >
                <DialogTitle className="sr-only">
                  {selectedMedia?.isVideo ? "Video Preview" : "Image Preview"}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  {selectedMedia?.isVideo ? "Video Preview" : "Image Preview"}
                </DialogDescription>
                {selectedMedia &&
                  (selectedMedia.isVideo ? (
                    <video
                      src={selectedMedia.url}
                      controls
                      controlsList="nodownload noremoteplayback"
                      playsInline
                      preload="metadata"
                      className="h-auto max-h-[90vh] w-auto rounded-xl object-contain shadow-2xl"
                      onContextMenu={(e) => e.preventDefault()}
                    />
                  ) : (
                    <Image
                      src={selectedMedia.url}
                      alt="image media"
                      width={1024}
                      height={1024}
                      className="h-auto max-h-[90vh] w-auto rounded-xl object-contain shadow-2xl"
                    />
                  ))}
                <DialogClose asChild>
                  <motion.button
                    className="absolute right-4 top-4 rounded-full border-2 border-white/20 bg-black/50 p-2 opacity-80 transition hover:border-white/40 hover:bg-black/70 hover:opacity-100"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", bounce: 0.05, duration: 0.2 }}
                  >
                    <X className="size-6" />
                  </motion.button>
                </DialogClose>
              </DialogContent>
            </Dialog>
          </div>
        )}

        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          <motion.button
            className={`flex items-center gap-1.5 ${isLiked ? "text-primary" : "hover:text-primary"} disabled:opacity-50`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", bounce: 0.05, duration: 0.2 }}
            onClick={() => likeMutation.mutate()}
            disabled={likeMutation.isPending}
          >
            <Heart className={`size-4 ${isLiked ? "fill-primary" : ""}`} />
            <span>{_count.likes}</span>
          </motion.button>
          <motion.button
            className={`flex items-center gap-1.5 ${isDisliked ? "text-primary" : "hover:text-primary"} disabled:opacity-50`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", bounce: 0.05, duration: 0.2 }}
            onClick={() => dislikeMutation.mutate()}
            disabled={dislikeMutation.isPending}
          >
            <ThumbsDown className="size-4" />
            <span>{_count.dislikes}</span>
          </motion.button>

          {!isParent && (
            <>
              <motion.button
                className={`flex items-center gap-1.5 ${showInlineReply ? "text-primary" : "hover:text-primary"} disabled:opacity-50`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", bounce: 0.05, duration: 0.2 }}
                onClick={() => {
                  if (onReplyClick) {
                    onReplyClick();
                  } else {
                    setShowInlineReply(!showInlineReply);
                  }
                }}
              >
                <MessageCircle
                  className={`size-4 ${showInlineReply ? "fill-primary/20" : ""}`}
                />
                <span>{_count.replies ?? 0}</span>
              </motion.button>

              <motion.button
                className={`flex items-center gap-1.5 ${isReposted ? "text-primary" : "hover:text-primary"} disabled:opacity-50`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", bounce: 0.05, duration: 0.2 }}
                onClick={() => repostMutation.mutate()}
                disabled={repostMutation.isPending}
              >
                <Repeat
                  className={`size-4 ${isReposted ? "fill-primary/20 stroke-primary" : ""}`}
                />
                <span>{_count.reposts ?? 0}</span>
              </motion.button>
            </>
          )}
        </div>

        {/* Inline reply form */}
        <AnimatePresence>
          {showInlineReply && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 overflow-hidden rounded-lg border border-border/60 bg-card/30 px-3 py-2"
            >
              <ReplyForm
                parentPostId={id}
                onClose={() => setShowInlineReply(false)}
                onReplyComplete={handleReplyComplete}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reply preview (thread view) */}
        {!isParent && !isReply && _count.replies && _count.replies > 0 && (
          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
              className="mb-2 flex w-full items-center justify-center gap-1 rounded-md border border-border/30 py-1 text-xs text-muted-foreground hover:bg-background/80"
              onClick={() => setShowReplies(!showReplies)}
            >
              {showReplies ? (
                <>
                  <ChevronUp className="size-3.5" />
                  <span>Hide replies</span>
                </>
              ) : (
                <>
                  <ChevronDown className="size-3.5" />
                  <span>
                    Show {_count.replies}{" "}
                    {_count.replies === 1 ? "reply" : "replies"}
                  </span>
                </>
              )}
            </Button>

            <AnimatePresence>
              {showReplies && replies && replies.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="ml-6 mt-1 space-y-3 border-l border-border/30 pl-4"
                >
                  {replies.map((reply) => (
                    <div key={reply.id} className="relative">
                      <div className="absolute -left-[20px] top-3 text-border">
                        <CornerDownRight className="size-3.5" />
                      </div>
                      <Post
                        id={reply.id}
                        text={reply.text}
                        media={reply.media || []}
                        authorId={reply.authorId}
                        author={reply.author}
                        _count={reply._count}
                        isReply
                      />
                    </div>
                  ))}

                  {_count.replies && _count.replies > 3 && (
                    <Link
                      href={`/post/${id}`}
                      className="block py-2 text-center text-xs text-primary hover:underline"
                    >
                      View all {_count.replies} replies
                    </Link>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {!isOwner ? (
          <div className="absolute right-3 top-3.5 flex items-center justify-center">
            <motion.button
              className=""
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", bounce: 0.05, duration: 0.2 }}
              onClick={() => setShowReportDialog(true)}
            >
              <CircleAlert className="size-4" />
              <span className="sr-only">Report</span>
            </motion.button>
          </div>
        ) : (
          <div className="absolute right-3 top-3.5 flex items-center justify-center">
            <motion.button
              className="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", bounce: 0.05, duration: 0.2 }}
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash className="size-4" />
            </motion.button>
          </div>
        )}

        <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
          <DialogContent className="max-w-[90vw] rounded-lg sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                Report Post
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                Please provide a reason for reporting this post.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((values) =>
                  reportMutation.mutate(values)
                )}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide a reason for reporting this post..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setShowReportDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={reportMutation.isPending}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {reportMutation.isPending ? "Submitting..." : "Report"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="max-w-[90vw] rounded-lg sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                Delete Post
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                Are you sure you want to delete this post? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
