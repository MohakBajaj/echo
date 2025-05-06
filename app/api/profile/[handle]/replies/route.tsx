import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { config } from "@/lib/auth";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { ipAddress } from "@vercel/functions";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1 m"),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const handle = (await params).handle;
    const ip = ipAddress(req) ?? "127.0.0.1";
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const session = await getServerSession(config);
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { username: handle },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get only replies (posts with parentPostId)
    const replies = await db.post.findMany({
      where: {
        authorId: user.id,
        privacy: "ANYONE",
        parentPostId: { not: null },
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            college: { select: { name: true } },
          },
        },
        parentPost: {
          select: {
            id: true,
            text: true,
            authorId: true,
            author: { select: { username: true } },
          },
        },
        _count: {
          select: { likes: true, dislikes: true, replies: true, reposts: true },
        },
        likes: { where: { userId: session.user.id } },
        dislikes: { where: { userId: session.user.id } },
        reposts: { where: { userId: session.user.id } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform replies to include interaction data
    const processedReplies = replies.map((reply) => {
      const { likes, dislikes, reposts, ...replyData } = reply;
      return {
        ...replyData,
        isLiked: likes.length > 0,
        isDisliked: dislikes.length > 0,
        isReposted: reposts.length > 0,
      };
    });

    return NextResponse.json(processedReplies);
  } catch (error) {
    console.error("Error fetching replies:", error);
    return NextResponse.json(
      { error: "Failed to fetch replies" },
      { status: 500 }
    );
  }
}
