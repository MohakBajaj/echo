import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/utils";

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

export function usePostThread(postId: string) {
  return useQuery<Thread>({
    queryKey: ["post", "thread", postId],
    queryFn: async () => {
      const [data] = await fetcher<Thread>(`/api/post/${postId}/thread`);
      return data;
    },
    enabled: !!postId,
  });
}
