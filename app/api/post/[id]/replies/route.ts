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

    // Fetch replies for the post
    const replies = await db.post.findMany({
      where: { parentPostId: postId },
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { username: true, college: { select: { name: true } } },
        },
        _count: {
          select: { likes: true, dislikes: true, replies: true, reposts: true },
        },
      },
    });

    // Check if the current user has liked, disliked, or reposted any of these replies
    const userInteractions = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        likedPosts: {
          where: { postId: { in: replies.map((reply) => reply.id) } },
          select: { postId: true },
        },
        Dislike: {
          where: { postId: { in: replies.map((reply) => reply.id) } },
          select: { postId: true },
        },
        reposts: {
          where: { postId: { in: replies.map((reply) => reply.id) } },
          select: { postId: true },
        },
      },
    });

    // Map the interactions to the replies
    const repliesWithInteractions = replies.map((reply) => {
      const isLiked =
        userInteractions?.likedPosts.some((like) => like.postId === reply.id) ||
        false;
      const isDisliked =
        userInteractions?.Dislike.some(
          (dislike) => dislike.postId === reply.id
        ) || false;
      const isReposted =
        userInteractions?.reposts.some(
          (repost) => repost.postId === reply.id
        ) || false;

      return { ...reply, isLiked, isDisliked, isReposted };
    });

    return NextResponse.json(repliesWithInteractions);
  } catch (error) {
    console.error("Error fetching replies:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
