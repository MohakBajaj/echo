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
  limiter: Ratelimit.slidingWindow(27, "1 m"), // 27 posts per minute
});

const postSchema = z.object({
  content: z.string().optional(),
  media: z.array(z.string()).optional(),
  privacy: z.enum(["FOLLOWED", "ANYONE", "MENTIONED"]),
  parentPostId: z.string().optional(),
  quoteId: z.string().optional(),
});

type PostInput = z.infer<typeof postSchema>;

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
    const validatedData = postSchema.parse(body) as PostInput;

    const post = await db.post.create({
      data: {
        text: validatedData.content || "",
        media: validatedData.media || [],
        privacy: validatedData.privacy,
        parentPostId: validatedData.parentPostId,
        quoteId: validatedData.quoteId,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: {
            username: true,
            college: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    console.error("Post creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
