import { Skeleton } from "@/components/ui/skeleton";
import { fetcher } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import Post from "../post";
import { AlertTriangle } from "lucide-react";

type Post = {
  id: string;
  createdAt: string;
  text: string;
  media: string[];
  authorId: string;
  author: { id: string; username: string; college: { name: string } };
  _count: {
    likes: number;
    dislikes: number;
    replies?: number;
    reposts?: number;
  };
  isLiked?: boolean;
  isDisliked?: boolean;
  isReposted?: boolean;
};

export default function RepostsList({ handle }: { handle: string }) {
  const { data: reposts, isLoading } = useQuery({
    queryKey: ["profile-reposts", handle],
    queryFn: async () => {
      const username = decodeURIComponent(handle).replace("@", "");
      const [data, status] = await fetcher<Post[]>(
        `/api/profile/${username}/reposts`
      );

      if (status !== 200) {
        throw new Error("Failed to fetch reposts");
      }

      return data;
    },
    enabled: Boolean(handle),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="space-y-4 pb-16 sm:pb-0">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border p-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="mt-2 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!reposts?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <AlertTriangle className="size-12 text-muted-foreground" />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          No reposts yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-16 sm:pb-0">
      {reposts.map((post) => (
        <Post
          key={post.id}
          {...post}
          isRepost={true}
          repostedBy={{ id: post.author.id, username: post.author.username }}
        />
      ))}
    </div>
  );
}
