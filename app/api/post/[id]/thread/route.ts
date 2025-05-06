import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { config } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(config);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const postId = (await params).id;

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    // Get the post
    const post = await db.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: { username: true, college: { select: { name: true } } },
        },
        parentPost: {
          include: {
            author: {
              select: { username: true, college: { select: { name: true } } },
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
        _count: {
          select: { likes: true, dislikes: true, replies: true, reposts: true },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Get replies to the post
    const replies = await db.post.findMany({
      where: { parentPostId: postId },
      orderBy: { createdAt: "asc" },
      include: {
        author: {
          select: { username: true, college: { select: { name: true } } },
        },
        _count: {
          select: { likes: true, dislikes: true, replies: true, reposts: true },
        },
      },
    });

    // Check if the current user has liked, disliked, or reposted this post
    const [userInteractions] = await Promise.all([
      db.user.findUnique({
        where: { id: session.user.id },
        select: {
          likedPosts: { where: { postId }, select: { postId: true } },
          Dislike: { where: { postId }, select: { postId: true } },
          reposts: { where: { postId }, select: { postId: true } },
        },
      }),
    ]);

    // Build the thread
    const thread = {
      post: {
        ...post,
        isLiked:
          (userInteractions?.likedPosts &&
            userInteractions.likedPosts.length > 0) ||
          false,
        isDisliked:
          (userInteractions?.Dislike && userInteractions.Dislike.length > 0) ||
          false,
        isReposted:
          (userInteractions?.reposts && userInteractions.reposts.length > 0) ||
          false,
      },
      replies: replies.map((reply) => ({
        ...reply,
        isLiked: false,
        isDisliked: false,
        isReposted: false,
      })),
    };

    return NextResponse.json(thread);
  } catch (error) {
    console.error("Error fetching thread:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
