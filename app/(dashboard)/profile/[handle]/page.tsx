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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EditProfileDialog from "@/components/dashboard/profile/edit-profile";
import { ProfileData } from "@/types/profile";
import { useParams } from "next/navigation";
import { AlertTriangle, Lock } from "lucide-react";
import PostsList from "@/components/dashboard/profile/post-list";

export default function ProfilePage() {
  const { handle } = useParams();
  const { data: session, status } = useSession();
  const { setOpenEditProfileDialog } = useEditProfileDialog();

  const { data: profileData, isLoading } = useQuery({
    queryKey: ["profile", handle],
    queryFn: async () => {
      const username = decodeURIComponent(handle as string).replace("@", "");
      const [data, status] = await fetcher<ProfileData>(
        `/api/profile/${username}`
      );

      if (status === 404) {
        throw new Error("Profile not found");
      }

      if (status !== 200) {
        throw new Error("Failed to fetch profile");
      }

      return data;
    },
    enabled: Boolean(handle),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry for 404s or after 2 failures
      if (error instanceof Error) {
        return error.message !== "Profile not found" && failureCount < 2;
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnMount: false, // Only fetch once when component mounts
  });

  if (status === "loading" || isLoading) {
    return <ProfileSkeleton />;
  }

  if (!profileData) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <AlertTriangle className="size-12 text-muted-foreground" />
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Profile not found</h2>
          <p className="text-sm text-muted-foreground">
            The profile you&apos;re looking for doesn&apos;t exist or has been
            removed
          </p>
        </div>
      </div>
    );
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
      {profileData.privacy === "PUBLIC" || isOwnProfile ? (
        <Tabs defaultValue="posts">
          <TabsList className="mb-4 w-full justify-evenly">
            {["posts", "replies", "reposts"].map((tab) => (
              <TabsTrigger key={tab} value={tab} className="w-1/3 capitalize">
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="posts">
            <PostsList handle={handle as string} />
          </TabsContent>
          {["replies", "reposts"].map((tab) => (
            <TabsContent key={tab} value={tab}>
              <div className="flex w-full flex-col items-center justify-center gap-3 py-8">
                <AlertTriangle className="size-12 text-muted-foreground" />
                <p className="text-center text-sm font-medium text-muted-foreground">
                  Sorry, {tab} are not available. Implementing soon.
                </p>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="flex w-full flex-col items-center justify-center gap-3 py-8">
          <Lock className="size-12 text-muted-foreground" />
          <p className="text-center text-sm font-medium text-muted-foreground">
            This profile is private. Only followers can see their posts.
          </p>
        </div>
      )}
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
