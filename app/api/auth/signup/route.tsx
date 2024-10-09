import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { generateUserHash, validateUsername } from "@/lib/utils";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 h"),
});

const signupSchema = z.object({
  username: z.string().min(3).max(30),
  password: z.string().min(8),
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.ip ?? "127.0.0.1";
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json();
    const { username, password, email } = signupSchema.parse(body);

    if (!validateUsername(username)) {
      return NextResponse.json({ error: "Invalid username" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 400 }
      );
    }

    // Get college with email
    const emailDomain = email.split("@")[1];
    const collegeId = await db.college.findUnique({
      where: { domain: emailDomain },
      select: { id: true },
    });

    if (!collegeId) {
      return NextResponse.json(
        { error: "Email domain does not match any registered college" },
        { status: 400 }
      );
    }

    // Generate user hash
    const userHash = generateUserHash(email, password);

    // Create new user
    const newUser = await db.user.create({
      data: {
        username,
        userHash,
        collegeId: collegeId.id,
      },
    });

    return NextResponse.json(
      { message: "User created successfully", userId: newUser.id },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
