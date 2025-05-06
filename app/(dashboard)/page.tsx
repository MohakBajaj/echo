"use client";

import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/utils";
import Post from "@/components/dashboard/post";
import { Skeleton } from "@/components/ui/skeleton";

type User = { id: string; username: string; college: { name: string } };

type Post = {
  id: string;
  text: string;
  media: string[];
  authorId: string;
  author: { username: string; college: { name: string } };
  _count: { likes: number; dislikes: number; replies: number; reposts: number };
  parentPostId?: string;
  isRepost?: boolean;
  originalPost?: Post;
  repostedBy?: User;
  isLiked?: boolean;
  isDisliked?: boolean;
  isReposted?: boolean;
  createdAt: string;
};

export default function Home() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const [data] = await fetcher<Post[]>("/api/posts");
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 p-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-md" />
              <div className="space-y-1 pt-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-24 w-full" />
            <div className="flex gap-3">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <p className="text-destructive">Error loading posts</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      {data?.map((post) => {
        if (post.isRepost && post.originalPost) {
          // For reposts, display the original post with repost info
          return (
            <Post
              key={post.id}
              {...post.originalPost}
              isRepost={true}
              repostedBy={post.repostedBy}
              isLiked={post.originalPost.isLiked}
              isDisliked={post.originalPost.isDisliked}
              isReposted={post.originalPost.isReposted}
            />
          );
        }

        return (
          <Post
            key={post.id}
            {...post}
            isLiked={post.isLiked}
            isDisliked={post.isDisliked}
            isReposted={post.isReposted}
          />
        );
      })}

      {data?.length === 0 && (
        <div className="flex h-[80vh] items-center justify-center">
          <p className="text-muted-foreground">No posts yet</p>
        </div>
      )}
    </div>
  );
}
