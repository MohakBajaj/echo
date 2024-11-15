"use client";

import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/utils";
import { SearchResponse } from "@/types/search";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import Link from "next/link";
import { useQueryState } from "nuqs";

export default function SearchPage() {
  const [searchInput, setSearchInput] = useQueryState("q", {
    defaultValue: "",
    parse: (value) => value || "",
  });
  const debouncedSearch = useDebounce(searchInput, 500);
  const [type, setType] = useQueryState("type", {
    defaultValue: "all" as const,
    parse: (value): "all" | "users" | "posts" => {
      return ["all", "users", "posts"].includes(value)
        ? (value as "all" | "users" | "posts")
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
    <div className="container mx-auto max-w-4xl p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <Input
          placeholder="Search for users or posts..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1"
        />
        <Tabs
          value={type}
          onValueChange={(value) => setType(value as typeof type)}
          className="w-full sm:w-auto"
        >
          <TabsList className="w-full justify-evenly sm:w-auto">
            <TabsTrigger className="w-1/3" value="all">
              All
            </TabsTrigger>
            <TabsTrigger className="w-1/3" value="users">
              Users
            </TabsTrigger>
            <TabsTrigger className="w-1/3" value="posts">
              Posts
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="mt-8 flex items-center justify-center">
          <div className="animate-pulse text-lg">Searching...</div>
        </div>
      ) : !data ? (
        <div className="mt-8 text-center text-muted-foreground">
          Enter a search term to get started
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {(type === "all" || type === "users") && data.users.length > 0 && (
            <section>
              <h2 className="mb-6 text-2xl font-semibold">Users</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {data.users.map((user) => (
                  <Link
                    href={`/profile/@${user.username}`}
                    key={user.username}
                    className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">@{user.username}</span>•
                      <span className="text-sm text-muted-foreground">
                        {user.college.name}
                      </span>
                      •
                      <span className="line-clamp-1 truncate text-sm text-muted-foreground">
                        {user.bio}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {(type === "all" || type === "posts") && data.posts.length > 0 && (
            <section>
              <h2 className="mb-6 text-2xl font-semibold">Posts</h2>
              <div className="space-y-6">
                {data.posts.map((post) => (
                  <article
                    key={post.id}
                    className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <p className="text-lg">{post.text}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <Link
                        href={`/profile/@${post.author.username}`}
                        className="font-medium hover:underline"
                      >
                        @{post.author.username}
                      </Link>
                      <span>{post.author.college.name}</span>
                      <div className="flex gap-4">
                        <span className="flex items-center gap-1">
                          <span className="text-rose-500">❤️</span>
                          {post._count.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="text-blue-500">💬</span>
                          {post._count.replies}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="text-green-500">🔄</span>
                          {post._count.reposts}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {data.users.length === 0 && data.posts.length === 0 && (
            <div className="mt-8 text-center text-muted-foreground">
              No results found for &quot;{searchInput}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
