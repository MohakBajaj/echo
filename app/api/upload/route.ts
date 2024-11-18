import { put } from "@vercel/blob";
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
  limiter: Ratelimit.slidingWindow(27, "1 m"), // 27 uploads per minute
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

    const form = await request.formData();
    const file = form.get("file") as File;
    const filename = form.get("filename") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const blob = await put(filename, file, {
      access: "public",
    });

    return NextResponse.json(blob);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Error uploading file" },
      { status: 500 }
    );
  }
}
