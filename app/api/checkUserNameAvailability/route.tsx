import { NextResponse, type NextRequest } from "next/server";
import { validateUsername } from "@/lib/utils";
import { db } from "@/lib/db";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(50, "1 m"),
});

export async function GET(req: NextRequest) {
  const ip = req.ip ?? "127.0.0.1";
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { error: "Username is required" },
      { status: 400 }
    );
  }

  if (!validateUsername(username)) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  const existingUser = await db.user.findUnique({
    where: {
      username: username,
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    return NextResponse.json({ available: false });
  }

  return NextResponse.json({ available: true });
}
