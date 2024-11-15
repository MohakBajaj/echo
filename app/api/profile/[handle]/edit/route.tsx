import { NextResponse, type NextRequest } from "next/server";
import { ipAddress } from "@vercel/functions";
import { db } from "@/lib/db";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getServerSession } from "next-auth";
import { config } from "@/lib/auth";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1 m"),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { handle: string } }
) {
  const session = await getServerSession(config);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = ipAddress(req) ?? "127.0.0.1";
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const handle = params.handle;
    if (!handle) {
      return NextResponse.json(
        { error: "Handle is required" },
        { status: 400 }
      );
    }

    // Check if user is trying to edit their own profile
    if (session.user.username !== handle) {
      return NextResponse.json(
        { error: "You can only edit your own profile" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { username, bio, privacy } = body;

    // Validate username if provided
    if (username) {
      const existingUser = await db.user.findUnique({
        where: {
          username,
          NOT: {
            username: handle,
          },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 400 }
        );
      }
    }

    // Update user profile
    const updatedUser = await db.user.update({
      where: {
        username: handle,
      },
      data: {
        ...(username && { username }),
        ...(bio && { bio }),
        ...(privacy && { privacy }),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        username: true,
        bio: true,
        privacy: true,
        updatedAt: true,
        college: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
