import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { db } from "@/lib/db";
import { config } from "@/lib/auth";

const likeSchema = z.object({
  postId: z.string(),
});

type LikeInput = z.infer<typeof likeSchema>;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(config);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = likeSchema.parse(body) as LikeInput;

    // Remove dislike if exists
    await db.dislike.deleteMany({
      where: {
        postId: validatedData.postId,
        userId: session.user.id,
      },
    });

    // Check if like already exists
    const existingLike = await db.like.findUnique({
      where: {
        postId_userId: {
          postId: validatedData.postId,
          userId: session.user.id,
        },
      },
    });

    if (existingLike) {
      // Unlike - delete the like
      await db.like.delete({
        where: {
          postId_userId: {
            postId: validatedData.postId,
            userId: session.user.id,
          },
        },
      });

      // Delete notification for post author
      await db.notification.deleteMany({
        where: {
          postId: validatedData.postId,
          senderUserId: session.user.id,
        },
      });
      return NextResponse.json({ liked: false });
    }

    // Get post details for notification
    const post = await db.post.findUnique({
      where: { id: validatedData.postId },
      select: { authorId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Create new like
    await db.like.create({
      data: {
        postId: validatedData.postId,
        userId: session.user.id,
      },
    });

    // Create notification for post author
    if (post.authorId !== session.user.id) {
      await db.notification.create({
        data: {
          type: "LIKE",
          message: "liked your post",
          senderUserId: session.user.id,
          receiverUserId: post.authorId,
          postId: validatedData.postId,
        },
      });
    }

    return NextResponse.json({ liked: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    console.error("Like toggle error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
