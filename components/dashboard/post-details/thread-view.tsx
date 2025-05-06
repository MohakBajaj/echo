import { useState } from "react";
import Post from "@/components/dashboard/post";
import { ReplyForm } from "./reply-form";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

type Post = {
  id: string;
  text: string;
  media: string[];
  authorId: string;
  author: { username: string; college: { name: string } };
  _count: { likes: number; dislikes: number; replies: number; reposts: number };
  parentPost?: Post | null;
  isLiked?: boolean;
  isDisliked?: boolean;
  isReposted?: boolean;
  createdAt: string;
};

type Thread = { post: Post; replies: Post[] };

type ThreadViewProps = { thread: Thread };

const ThreadView = ({ thread }: ThreadViewProps) => {
  const { post, replies } = thread;
  const [showReplyForm, setShowReplyForm] = useState(false);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="flex flex-col">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-border/30 bg-background/80 px-4 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="h-8 w-8 rounded-full"
        >
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-base font-medium">Thread</h1>
      </div>

      {/* Thread Content */}
      <div className="flex-1">
        {/* Parent Post (if exists) */}
        {post.parentPost && (
          <div className="border-b border-border/20 px-4 py-3 opacity-85">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs text-muted-foreground">Replying to</span>
              <Link
                href={`/profile/@${post.parentPost.author.username}`}
                className="text-xs font-medium text-primary hover:underline"
              >
                @{post.parentPost.author.username}
              </Link>
            </div>
            <Post
              id={post.parentPost.id}
              text={post.parentPost.text}
              media={post.parentPost.media}
              authorId={post.parentPost.authorId}
              author={post.parentPost.author}
              _count={post.parentPost._count}
              isParent
            />
          </div>
        )}

        {/* Main Post */}
        <div className="border-b border-border/30 px-4 py-3">
          <Post
            id={post.id}
            text={post.text}
            media={post.media}
            authorId={post.authorId}
            author={post.author}
            _count={post._count}
            isThread
            onReplyClick={() => setShowReplyForm(true)}
            isLiked={post.isLiked}
            isDisliked={post.isDisliked}
            isReposted={post.isReposted}
          />

          <AnimatePresence>
            {showReplyForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-3 overflow-hidden rounded-lg border border-border/60 bg-card/30 px-4 py-3"
              >
                <ReplyForm
                  parentPostId={post.id}
                  onClose={() => setShowReplyForm(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Replies Section */}
        <div className="px-4 py-2">
          {replies.length > 0 ? (
            <>
              <div className="mb-2 flex items-center gap-2 py-2">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-medium">
                  {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
                </h2>
              </div>

              <ScrollArea className="max-h-[calc(100vh-16rem)]">
                <motion.div
                  className="space-y-4"
                  variants={container}
                  initial="hidden"
                  animate="show"
                >
                  {replies.map((reply) => (
                    <motion.div
                      key={reply.id}
                      variants={item}
                      className="border-b border-border/10 pb-4 last:border-0"
                    >
                      <Post
                        id={reply.id}
                        text={reply.text}
                        media={reply.media}
                        authorId={reply.authorId}
                        author={reply.author}
                        _count={reply._count}
                        isReply
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </ScrollArea>
            </>
          ) : (
            !showReplyForm && (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <MessageCircle className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No replies yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setShowReplyForm(true)}
                >
                  Be the first to reply
                </Button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ThreadView;
