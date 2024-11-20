import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { ipAddress } from "@vercel/functions";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per minute
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = ipAddress(request) ?? "127.0.0.1";
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const id = (await params).id;

    const college = await db.college.findFirst({
      where: {
        id,
      },
      include: {
        User: {
          select: {
            username: true,
            bio: true,
            privacy: true,
            college: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!college) {
      return NextResponse.json({ error: "College not found" }, { status: 404 });
    }

    // Only return public profiles
    const users = college.User.filter((user) => user.privacy === "PUBLIC");

    return NextResponse.json({ users, college: college.name });
  } catch (error) {
    console.error("Error fetching college users:", error);
    return NextResponse.json(
      { error: "Failed to fetch college users" },
      { status: 500 }
    );
  }
}
