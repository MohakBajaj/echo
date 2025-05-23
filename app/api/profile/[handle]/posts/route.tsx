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

// Define a type for posts with repostedAt and repostedBy properties
type PostWithRepost = {
  id: string;
  text: string;
  media: string[];
  authorId: string;
  author: { id: string; username: string; college: { name: string } };
  _count: { likes: number; dislikes: number; replies: number; reposts: number };
  createdAt: Date;
  isLiked: boolean;
  isDisliked: boolean;
  isReposted: boolean;
  isRepost?: boolean;
  repostedBy?: { id: string; username: string };
  repostedAt?: Date;
};

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

    // Get user's posts
    const userPosts = await db.post.findMany({
      where: { authorId: user.id, privacy: "ANYONE" },
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
        likes: { where: { userId: session.user.id } },
        dislikes: { where: { userId: session.user.id } },
        reposts: { where: { userId: session.user.id } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get reposts by this user
    const userReposts = await db.repost.findMany({
      where: { userId: user.id },
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
            likes: { where: { userId: session.user.id } },
            dislikes: { where: { userId: session.user.id } },
            reposts: { where: { userId: session.user.id } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform posts to include interaction data
    const processedPosts = userPosts.map((post) => {
      const { likes, dislikes, reposts, ...postData } = post;
      return {
        ...postData,
        isLiked: likes.length > 0,
        isDisliked: dislikes.length > 0,
        isReposted: reposts.length > 0,
      };
    });

    // Transform reposts to include the original post data and interaction data
    const processedReposts = userReposts.map((repost) => {
      const { post } = repost;
      const { likes, dislikes, reposts, ...postData } = post;
      return {
        ...postData,
        isLiked: likes.length > 0,
        isDisliked: dislikes.length > 0,
        isReposted: reposts.length > 0,
        isRepost: true,
        repostedBy: { id: user.id, username: handle },
        repostedAt: repost.createdAt,
      };
    });

    // Combine and sort by creation date (for reposts, use the repost date)
    const allPosts = [...processedPosts, ...processedReposts].sort((a, b) => {
      const dateA = (a as PostWithRepost).repostedAt || a.createdAt;
      const dateB = (b as PostWithRepost).repostedAt || b.createdAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    return NextResponse.json(allPosts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}
