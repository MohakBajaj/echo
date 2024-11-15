import { NextResponse, type NextRequest } from "next/server";
import { ipAddress } from "@vercel/functions";
import { db } from "@/lib/db";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { config } from "@/lib/auth";
import { getServerSession } from "next-auth";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1 m"),
});

export async function POST(req: NextRequest) {
  try {
    const ip = ipAddress(req) ?? "127.0.0.1";
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // Verify authentication
    const session = await getServerSession(config);
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { userId, postId, reason } = body;

    if (!reason) {
      return NextResponse.json(
        { error: "Reason is required" },
        { status: 400 }
      );
    }

    if (!userId && !postId) {
      return NextResponse.json(
        { error: "Either userId or postId is required" },
        { status: 400 }
      );
    }

    const report = await db.report.create({
      data: {
        reason,
        ...(userId && { userId }),
        ...(postId && { postId }),
      },
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error creating report:", error);
    return NextResponse.json(
      { error: "Failed to create report" },
      { status: 500 }
    );
  }
}
