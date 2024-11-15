import { NextResponse, type NextRequest } from "next/server";
import { ipAddress } from "@vercel/functions";
import { db } from "@/lib/db";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1 m"),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { handle: string } }
) {
  const ip = ipAddress(req) ?? "127.0.0.1";
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const handle = params.handle;
  if (!handle) {
    return NextResponse.json({ error: "Handle is required" }, { status: 400 });
  }

  const user = await db.user.findUnique({
    where: {
      username: handle,
    },
    select: {
      id: true,
      username: true,
      bio: true,
      privacy: true,
      createdAt: true,
      college: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          followers: true,
          following: true,
          posts: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}
