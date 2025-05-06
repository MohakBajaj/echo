import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/utils";

type Post = {
  id: string;
  text: string;
  media: string[];
  authorId: string;
  author: { username: string; college: { name: string } };
  _count: { likes: number; dislikes: number; replies: number; reposts: number };
  createdAt: string;
};

export function usePostReplies(postId: string) {
  return useQuery<Post[]>({
    queryKey: ["post", "replies", postId],
    queryFn: async () => {
      const [data] = await fetcher<Post[]>(`/api/post/${postId}/replies`);
      return data;
    },
    enabled: !!postId,
  });
}
