export type ProfileData = {
  id: string;
  username: string;
  bio: string | null;
  privacy: "PUBLIC" | "PRIVATE";
  createdAt: string;
  college: {
    name: string;
  };
  _count: {
    followers: number;
    following: number;
    posts: number;
  };
};

export type ProfileUpdateData = Pick<
  ProfileData,
  "username" | "bio" | "privacy"
>;
