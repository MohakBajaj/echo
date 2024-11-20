"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { use } from "react";

type CollegeResponse = {
  college: string;
  users: {
    username: string;
    bio: string;
    college: {
      name: string;
    };
  }[];
};

export default function CollegePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);

  const { data, isLoading, error } = useQuery({
    queryKey: ["college", resolvedParams.id],
    queryFn: async () => {
      const [data, status] = await fetcher<CollegeResponse>(
        `/api/college/${resolvedParams.id}`
      );
      if (status !== 200) {
        if ("error" in data) throw new Error(data.error as string);
        throw new Error("An error occurred");
      }
      return data;
    },
  });

  if (error) {
    return (
      <div className="container flex min-h-[200px] items-center justify-center py-8 text-destructive">
        {error instanceof Error ? error.message : "An error occurred"}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl space-y-6 p-6">
        <Skeleton className="mb-8 h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-4">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="mb-8 text-2xl font-semibold">
        Members of {data?.college}
      </h1>

      {!data?.users.length ? (
        <div className="flex min-h-[200px] items-center justify-center text-muted-foreground">
          No public profiles found
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {data.users.map((user) => (
            <Link
              href={`/profile/@${user.username}`}
              key={user.username}
              className="group rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex flex-col gap-2">
                <span className="font-medium group-hover:text-primary">
                  @{user.username}
                </span>
                <span className="text-sm text-muted-foreground">
                  {user.college.name}
                </span>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {user.bio}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
