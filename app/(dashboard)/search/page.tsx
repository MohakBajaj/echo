"use client";

import { useQuery } from "@tanstack/react-query";
import { fetcher, nFormatter } from "@/lib/utils";
import { SearchResponse } from "@/types/search";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import Link from "next/link";
import { useQueryState } from "nuqs";
import { Search } from "lucide-react";
import Post from "@/components/dashboard/post";

export default function SearchPage() {
  const [searchInput, setSearchInput] = useQueryState("q", {
    defaultValue: "",
    parse: (value) => value || "",
  });
  const debouncedSearch = useDebounce(searchInput, 500);
  const [type, setType] = useQueryState("type", {
    defaultValue: "all" as const,
    parse: (value): "all" | "users" | "posts" | "colleges" => {
      return ["all", "users", "posts", "colleges"].includes(value)
        ? (value as "all" | "users" | "posts" | "colleges")
        : "all";
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["search", debouncedSearch, type],
    queryFn: async () => {
      if (!debouncedSearch) return null;
      const [data] = await fetcher<SearchResponse>(
        `/api/search?q=${debouncedSearch}&type=${type}`
      );
      return data;
    },
    enabled: Boolean(debouncedSearch),
  });

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:items-center sm:gap-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search for users, posts, or colleges..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs
          value={type}
          onValueChange={(value) => setType(value as typeof type)}
          className="w-full"
        >
          <TabsList className="grid h-11 w-full grid-cols-4 gap-1 rounded-xl p-1">
            <TabsTrigger
              value="all"
              className="rounded-lg data-[state=active]:bg-primary/10"
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="rounded-lg data-[state=active]:bg-primary/10"
            >
              Users
            </TabsTrigger>
            <TabsTrigger
              value="posts"
              className="rounded-lg data-[state=active]:bg-primary/10"
            >
              Posts
            </TabsTrigger>
            <TabsTrigger
              value="colleges"
              className="rounded-lg data-[state=active]:bg-primary/10"
            >
              Colleges
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="animate-pulse text-lg">Searching...</div>
        </div>
      ) : !data ? (
        <div className="flex min-h-[200px] items-center justify-center text-muted-foreground">
          Enter a search term to get started
        </div>
      ) : (
        <div className="space-y-8">
          {(type === "all" || type === "posts") && data.posts.length > 0 && (
            <section>
              <h2 className="mb-6 text-2xl font-semibold">Posts</h2>
              <div className="space-y-4">
                {data.posts.map((post) => (
                  <Post key={post.id} {...post} />
                ))}
              </div>
            </section>
          )}

          {(type === "all" || type === "users") && data.users.length > 0 && (
            <section>
              <h2 className="mb-6 text-2xl font-semibold">Users</h2>
              <div className="grid gap-4 sm:grid-cols-2">
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
            </section>
          )}

          {(type === "all" || type === "colleges") &&
            data.colleges.length > 0 && (
              <section>
                <h2 className="mb-6 text-2xl font-semibold">Colleges</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {data.colleges.map((college) => (
                    <Link
                      key={college.id}
                      href={`/college/${college.id}`}
                      className="group flex flex-col gap-1.5 rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md"
                    >
                      <span className="font-medium group-hover:text-primary">
                        {college.name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {nFormatter(college._count.User)} members
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

          {data.users.length === 0 &&
            data.posts.length === 0 &&
            data.colleges.length === 0 && (
              <div className="flex min-h-[200px] items-center justify-center text-muted-foreground">
                No results found for &quot;{searchInput}&quot;
              </div>
            )}
        </div>
      )}
    </div>
  );
}
