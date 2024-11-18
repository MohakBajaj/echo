import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { config } from "@/lib/auth";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(27, "1 m"), // 27 deletes per minute
});

export async function POST(request: Request) {
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

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    }

    await del(url);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Error deleting file" }, { status: 500 });
  }
}
