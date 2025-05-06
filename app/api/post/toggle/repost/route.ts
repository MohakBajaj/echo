import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { config } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(27, "1 m"), // 27 operations per minute
});

const repostSchema = z.object({ postId: z.string() });

export async function POST(req: Request) {
  try {
    const session = await getServerSession(config);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { success, reset } = await ratelimit.limit(session.user.id);
    if (!success) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          resetAt: new Date(reset).toISOString(),
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { postId } = repostSchema.parse(body);

    const existingRepost = await db.repost.findUnique({
      where: { postId_userId: { postId, userId: session.user.id } },
    });

    if (existingRepost) {
      // Remove repost if it exists
      await db.repost.delete({
        where: { postId_userId: { postId, userId: session.user.id } },
      });

      // Delete notification associated with this repost
      await db.notification.deleteMany({
        where: { senderUserId: session.user.id, postId, type: "REPOST" },
      });

      return NextResponse.json({ reposted: false });
    } else {
      // Create repost
      const post = await db.post.findUnique({
        where: { id: postId },
        select: { authorId: true },
      });

      if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }

      await db.repost.create({ data: { postId, userId: session.user.id } });

      // Create notification if the user is not reposting their own post
      if (post.authorId !== session.user.id) {
        await db.notification.create({
          data: {
            type: "REPOST",
            message: "reposted your post",
            senderUserId: session.user.id,
            receiverUserId: post.authorId,
            postId,
          },
        });
      }

      return NextResponse.json({ reposted: true });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    console.error("Error toggling repost:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
