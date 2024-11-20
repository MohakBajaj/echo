import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { config } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const followSchema = z.object({
  username: z.string().min(1),
});

type FollowRequest = z.infer<typeof followSchema>;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(config);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const json = await request.json();
    const body = followSchema.parse(json) as FollowRequest;

    const currentUser = await db.user.findUnique({
      where: {
        id: session.user.id,
      },
    });

    if (!currentUser) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userToFollow = await db.user.findUnique({
      where: {
        username: body.username,
      },
    });

    if (!userToFollow) {
      return new NextResponse("User not found", { status: 404 });
    }

    if (currentUser.id === userToFollow.id) {
      return new NextResponse("Cannot follow yourself", { status: 400 });
    }

    const isAlreadyFollowing = await db.user.findFirst({
      where: {
        id: currentUser.id,
        following: {
          some: {
            id: userToFollow.id,
          },
        },
      },
    });

    if (isAlreadyFollowing) {
      // Unfollow
      await db.user.update({
        where: {
          id: currentUser.id,
        },
        data: {
          following: {
            disconnect: {
              id: userToFollow.id,
            },
          },
        },
      });

      return NextResponse.json(
        { message: "Unfollowed successfully" },
        { status: 200 }
      );
    }

    // Follow
    await db.$transaction([
      db.user.update({
        where: {
          id: currentUser.id,
        },
        data: {
          following: {
            connect: {
              id: userToFollow.id,
            },
          },
        },
      }),
      db.notification.create({
        data: {
          type: "FOLLOW",
          message: `@${currentUser.username} started following you`,
          senderUserId: currentUser.id,
          receiverUserId: userToFollow.id,
        },
      }),
    ]);

    return NextResponse.json(
      { message: "Followed successfully" },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 422 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
