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
      return NextResponse.json({ disliked: false });
    }

    // Create new dislike
    await db.dislike.create({
      data: {
        postId: validatedData.postId,
        userId: session.user.id,
      },
    });

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
