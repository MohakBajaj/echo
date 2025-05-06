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
  limiter: Ratelimit.slidingWindow(27, "1 m"), // 27 replies per minute
});

const replySchema = z.object({
  text: z.string().min(1).max(500),
  media: z.array(z.string()).optional(),
  parentPostId: z.string(),
  privacy: z.enum(["FOLLOWED", "ANYONE", "MENTIONED"]).default("ANYONE"),
});

type ReplyInput = z.infer<typeof replySchema>;

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
    const validatedData = replySchema.parse(body) as ReplyInput;

    // Check if parent post exists
    const parentPost = await db.post.findUnique({
      where: { id: validatedData.parentPostId },
      select: { id: true, authorId: true },
    });

    if (!parentPost) {
      return NextResponse.json(
        { error: "Parent post not found" },
        { status: 404 }
      );
    }

    // Create the reply post
    const replyPost = await db.post.create({
      data: {
        text: validatedData.text,
        media: validatedData.media || [],
        privacy: validatedData.privacy,
        parentPostId: validatedData.parentPostId,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: { username: true, college: { select: { name: true } } },
        },
      },
    });

    // Create notification if the user is not replying to their own post
    if (parentPost.authorId !== session.user.id) {
      await db.notification.create({
        data: {
          type: "REPLY",
          message: "replied to your post",
          senderUserId: session.user.id,
          receiverUserId: parentPost.authorId,
          postId: validatedData.parentPostId,
        },
      });
    }

    return NextResponse.json(replyPost);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    console.error("Reply creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
