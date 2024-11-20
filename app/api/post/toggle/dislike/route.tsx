import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { db } from "@/lib/db";
import { config } from "@/lib/auth";

const dislikeSchema = z.object({
  postId: z.string(),
});

type DislikeInput = z.infer<typeof dislikeSchema>;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(config);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = dislikeSchema.parse(body) as DislikeInput;

    // Remove like if exists
    await db.like.deleteMany({
      where: {
        postId: validatedData.postId,
        userId: session.user.id,
      },
    });

    // Check if dislike already exists
    const existingDislike = await db.dislike.findUnique({
      where: {
        postId_userId: {
          postId: validatedData.postId,
          userId: session.user.id,
        },
      },
    });

    if (existingDislike) {
      // Remove dislike
      await db.dislike.delete({
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

      return NextResponse.json({ disliked: false });
    }

    // Get post details for notification
    const post = await db.post.findUnique({
      where: { id: validatedData.postId },
      select: { authorId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Create new dislike
    await db.dislike.create({
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
          message: "disliked your post",
          senderUserId: session.user.id,
          receiverUserId: post.authorId,
          postId: validatedData.postId,
        },
      });
    }

    return NextResponse.json({ disliked: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    console.error("Dislike toggle error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
