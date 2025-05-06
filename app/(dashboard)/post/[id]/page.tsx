"use client";

import { useParams, useRouter } from "next/navigation";
import ThreadView from "@/components/dashboard/post-details/thread-view";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { usePostThread } from "@/hooks/queries/use-post-thread";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  const { data, isLoading, error } = usePostThread(postId);

  if (isLoading) {
    return (
      <div className="divide-y divide-border/30">
        <div className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-border/30 bg-background/80 px-4 backdrop-blur-sm">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-6 w-20" />
        </div>

        <div className="space-y-4 p-4">
          <div className="flex items-start gap-3 pb-2">
            <Skeleton className="h-10 w-10 rounded-md" />
            <div className="flex-1">
              <Skeleton className="mb-1 h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>

          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-3 w-20" />

          <div className="border-t border-border/20 pt-4">
            <Skeleton className="mb-3 h-4 w-16" />
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-md" />
                <div className="flex-1">
                  <Skeleton className="mb-1 h-3 w-24" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-md" />
                <div className="flex-1">
                  <Skeleton className="mb-1 h-3 w-32" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-2 text-center">
        <p className="text-destructive">Error loading post</p>
        <p className="text-sm text-muted-foreground">
          The post you&apos;re looking for may have been deleted or doesn&apos;t
          exist.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => router.push("/")}
        >
          Return home
        </Button>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={postId}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="min-h-[calc(100vh-3.5rem)]"
      >
        <ThreadView thread={data} />
      </motion.div>
    </AnimatePresence>
  );
}
