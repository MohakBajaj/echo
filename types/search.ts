export type SearchResponse = {
  users: {
    username: string;
    bio: string;
    college: {
      name: string;
    };
  }[];
  posts: Post[];
  colleges: {
    id: string;
    name: string;
    _count: {
      User: number;
    };
  }[];
};

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
    replies?: number;
    reposts?: number;
  };
};
