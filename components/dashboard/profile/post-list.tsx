import { Skeleton } from "@/components/ui/skeleton";
import { fetcher } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import Post from "../post";

type Post = {
  id: string;
  createdAt: string;
  text: string;
  media: string[];
  authorId: string;
  author: {
    username: string;
    college: {
      name: string;
    };
  };
  _count: {
    likes: number;
    dislikes: number;
    replies?: number;
    reposts?: number;
  };
};

export default function PostsList({ handle }: { handle: string }) {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["profile-posts", "posts", handle],
    queryFn: async () => {
      const username = decodeURIComponent(handle).replace("@", "");
      const [data, status] = await fetcher<Post[]>(
        `/api/profile/${username}/posts`
      );

      if (status !== 200) {
        throw new Error("Failed to fetch posts");
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
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Skeleton className="aspect-square rounded-md" />
              <Skeleton className="aspect-square rounded-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!posts?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <p className="text-center text-sm text-muted-foreground">
          No posts yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-16 sm:pb-0">
      {posts.map((post) => (
        <Post key={post.id} {...post} />
      ))}
    </div>
  );
}
