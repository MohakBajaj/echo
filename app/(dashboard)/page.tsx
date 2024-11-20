"use client";

import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/utils";
import Post from "@/components/dashboard/post";

type Post = {
  id: string;
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
    replies: number;
    reposts: number;
  };
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
      <div className="flex h-[80vh] items-center justify-center">
        <p className="text-muted-foreground">Loading posts...</p>
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
      {data?.map((post) => <Post key={post.id} {...post} />)}
      {data?.length === 0 && (
        <div className="flex h-[80vh] items-center justify-center">
          <p className="text-muted-foreground">No posts yet</p>
        </div>
      )}
    </div>
  );
}
