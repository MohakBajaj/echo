import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { getAvatarURL } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetcher } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2, Send, X } from "lucide-react";

type ReplyFormProps = {
  parentPostId: string;
  onClose: () => void;
  onReplyComplete?: () => void;
};

export const ReplyForm = ({
  parentPostId,
  onClose,
  onReplyComplete,
}: ReplyFormProps) => {
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();

  const replyMutation = useMutation({
    mutationFn: async () => {
      const [data, status] = await fetcher("/api/post/reply", {
        method: "POST",
        body: JSON.stringify({
          text: content,
          parentPostId: parentPostId,
          privacy: "ANYONE",
        }),
      });

      if (status !== 200) {
        throw new Error("Failed to send reply");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["post", "thread", parentPostId],
      });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["profile-posts"] });
      toast.success("Reply sent successfully");
      setContent("");
      onClose();

      // Call the onReplyComplete callback if provided
      if (onReplyComplete) {
        onReplyComplete();
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to send reply. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Reply cannot be empty");
      return;
    }
    replyMutation.mutate();
  };

  if (!session?.user) {
    return null;
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1 z-10 h-7 w-7 rounded-full opacity-70 hover:bg-muted hover:opacity-100"
        onClick={onClose}
      >
        <X className="h-3.5 w-3.5" />
      </Button>

      <form onSubmit={handleSubmit} className="pt-1">
        <div className="flex gap-2">
          <Avatar className="mt-1 size-7 rounded-md border border-primary/10 bg-background shadow-sm">
            <AvatarImage src={getAvatarURL(session.user.username)} />
            <AvatarFallback className="bg-primary/5 text-xs font-medium">
              {session.user.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Write your reply..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-16 resize-none border-muted bg-background/70 text-sm focus-visible:ring-1 focus-visible:ring-primary/30"
              disabled={replyMutation.isPending}
            />

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                <span
                  className={content.length > 450 ? "text-destructive" : ""}
                >
                  {content.length}
                </span>
                <span>/500</span>
              </p>

              <Button
                type="submit"
                size="sm"
                variant="ghost"
                className="h-8 gap-1.5 rounded-full hover:bg-primary/5 hover:text-primary"
                disabled={replyMutation.isPending || !content.trim()}
              >
                {replyMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <>
                    <span>Reply</span>
                    <Send className="size-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
