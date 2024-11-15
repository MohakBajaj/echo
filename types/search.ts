export type SearchResponse = {
  users: {
    username: string;
    bio: string;
    college: {
      name: string;
    };
  }[];
  posts: {
    id: string;
    text: string;
    createdAt: Date;
    author: {
      username: string;
      college: {
        name: string;
      };
    };
    _count: {
      likes: number;
      replies: number;
      reposts: number;
    };
  }[];
};
