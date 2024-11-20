import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { config } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const isFollowingSchema = z.object({
  username: z.string().min(1),
});

type IsFollowingRequest = z.infer<typeof isFollowingSchema>;

export async function GET(request: Request) {
  try {
    const session = await getServerSession(config);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username) {
      return new NextResponse("Username is required", { status: 400 });
    }

    const body = isFollowingSchema.parse({ username }) as IsFollowingRequest;

    const currentUser = await db.user.findUnique({
      where: {
        id: session.user.id,
      },
      include: {
        following: {
          where: {
            username: body.username,
          },
          select: {
            id: true,
          },
        },
      },
    });

    if (!currentUser) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    return NextResponse.json({
      isFollowing: currentUser.following.length > 0,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 422 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
