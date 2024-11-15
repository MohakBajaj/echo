"use client";

import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { fetcher, getAvatarURL, nFormatter } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileSkeleton } from "@/components/dashboard/profile/profile-skeleton";
import { useEditProfileDialog } from "@/store";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EditProfileDialog from "@/components/dashboard/profile/edit-profile";
import { ProfileData } from "@/types/profile";
import { useParams } from "next/navigation";

export default function ProfilePage() {
  const { handle } = useParams();
  const { data: session, status } = useSession();
  const { setOpenEditProfileDialog } = useEditProfileDialog();

  const { data: profileData, isLoading } = useQuery({
    queryKey: ["profile", handle],
    queryFn: async () => {
      const username = decodeURIComponent(handle as string).replace("@", "");
      const response = await fetcher<ProfileData>(`/api/profile/${username}`);

      if (!response?.[0]) {
        throw new Error("Profile not found");
      }

      return response[0];
    },
    enabled: Boolean(handle),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error) => {
      return error.message !== "Profile not found" && failureCount < 2;
    },
  });

  if (status === "loading" || isLoading) {
    return <ProfileSkeleton />;
  }

  if (!profileData) {
    return <div>Profile not found</div>;
  }

  const { username, bio, createdAt, college, privacy, _count } = profileData;
  const isOwnProfile = session?.user?.username === username;

  const stats = [
    { label: "followers", count: _count.followers },
    { label: "following", count: _count.following },
    { label: "posts", count: _count.posts },
  ] as const;

  return (
    <div className="flex flex-col space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div className="flex w-full justify-between gap-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">@{username}</h1>
              <p className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
                {college.name}
              </p>
            </div>
            {bio && <p className="mt-2">{bio}</p>}
            {createdAt && (
              <p className="mt-2 text-xs text-muted-foreground">
                Joined {format(new Date(createdAt), "MMMM yyyy")}
              </p>
            )}
          </div>
          <Avatar className="size-24 rounded-lg border-2 border-border shadow-sm">
            <AvatarImage src={getAvatarURL(username)} />
            <AvatarFallback>{username.slice(0, 2)}</AvatarFallback>
          </Avatar>
        </div>
      </div>
      {/* Stats */}
      <div className="flex items-center gap-6">
        {stats.map(({ label, count }) => (
          <p key={label} className="text-sm text-muted-foreground">
            {nFormatter(count ?? 0)} {label}
          </p>
        ))}
      </div>
      {/* Edit Profile Button - Only show for own profile */}
      {isOwnProfile && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", bounce: 0.05, duration: 0.2 }}
          className="rounded-lg border border-border bg-background px-4 py-1 text-foreground"
          onClick={() => setOpenEditProfileDialog(true)}
        >
          Edit Profile
        </motion.button>
      )}
      <Separator />
      <Tabs defaultValue="posts">
        <TabsList className="mb-4 w-full justify-evenly">
          {["posts", "replies", "reposts"].map((tab) => (
            <TabsTrigger key={tab} value={tab} className="w-1/3 capitalize">
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {isOwnProfile && (
        <EditProfileDialog
          initialData={{
            username,
            bio,
            privacy,
          }}
        />
      )}
    </div>
  );
}
