import { Skeleton } from "@/components/ui/skeleton";
import { fetcher } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";

export default function PostsList({ handle }: { handle: string }) {
  type Post = {
    id: string;
    createdAt: string;
    text: string;
    media: string[];
    author: {
      username: string;
      college: {
        name: string;
      };
    };
  };

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
        <div key={post.id} className="rounded-lg border border-border p-4">
          <div className="flex items-center gap-2">
            <p className="font-medium">@{post.author.username}</p>
            <p className="text-sm text-muted-foreground">
              {post.author.college.name}
            </p>
          </div>
          <p className="mt-2 whitespace-break-spaces">{post.text}</p>
          {post.media.length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {post.media.map((url) => {
                const isVideo = url.match(/\.(mp4|webm)$/i);
                return isVideo ? (
                  <video
                    key={url}
                    src={url}
                    controls
                    controlsList="nodownload noremoteplayback"
                    playsInline
                    preload="metadata"
                    className="aspect-square max-h-[512px] rounded-md object-cover"
                    onContextMenu={(e) => e.preventDefault()}
                  />
                ) : (
                  <Image
                    key={url}
                    src={url}
                    alt=""
                    width={1024}
                    height={1024}
                    className="aspect-square max-h-[512px] rounded-md object-cover"
                  />
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
