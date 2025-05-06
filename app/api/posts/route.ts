import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { config } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(config);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get recent posts (including original posts and reposts)
    const posts = await db.post.findMany({
      where: {
        // Only fetch top-level posts (not replies)
        parentPostId: null,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            college: { select: { name: true } },
          },
        },
        _count: {
          select: { likes: true, dislikes: true, replies: true, reposts: true },
        },
      },
    });

    // Get reposts to include in the timeline
    const reposts = await db.repost.findMany({
      where: {
        userId: {
          not: session.user.id, // Exclude current user's reposts since we want to show them as reposts
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        post: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                college: { select: { name: true } },
              },
            },
            _count: {
              select: {
                likes: true,
                dislikes: true,
                replies: true,
                reposts: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            college: { select: { name: true } },
          },
        },
      },
    });

    // Combine posts and reposts, then sort by createdAt
    const combinedFeed = [
      ...posts.map((post) => ({
        ...post,
        isRepost: false,
        originalPost: null,
        repostedBy: null,
      })),
      ...reposts.map((repost) => ({
        id: `repost-${repost.postId}-${repost.userId}`,
        text: repost.post.text,
        media: repost.post.media,
        authorId: repost.post.authorId,
        author: repost.post.author,
        _count: repost.post._count,
        createdAt: repost.createdAt,
        isRepost: true,
        originalPost: repost.post,
        repostedBy: repost.user,
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 20); // Limit to top 20 after sorting

    // Check user interactions with these posts
    const postIds = combinedFeed
      .map((post) =>
        post.isRepost && post.originalPost ? post.originalPost.id : post.id
      )
      .filter(Boolean) as string[];

    const userInteractions = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        likedPosts: {
          where: { postId: { in: postIds } },
          select: { postId: true },
        },
        Dislike: {
          where: { postId: { in: postIds } },
          select: { postId: true },
        },
        reposts: {
          where: { postId: { in: postIds } },
          select: { postId: true },
        },
      },
    });

    // Add interaction flags to each post
    const feedWithInteractions = combinedFeed.map((post) => {
      const postId =
        post.isRepost && post.originalPost ? post.originalPost.id : post.id;

      // Set interaction flags
      const isLiked =
        userInteractions?.likedPosts.some((like) => like.postId === postId) ||
        false;
      const isDisliked =
        userInteractions?.Dislike.some(
          (dislike) => dislike.postId === postId
        ) || false;
      const isReposted =
        userInteractions?.reposts.some((repost) => repost.postId === postId) ||
        false;

      if (post.isRepost && post.originalPost) {
        return {
          ...post,
          originalPost: {
            ...post.originalPost,
            isLiked,
            isDisliked,
            isReposted,
          },
        };
      }

      return { ...post, isLiked, isDisliked, isReposted };
    });

    return NextResponse.json(feedWithInteractions);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
