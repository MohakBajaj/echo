import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { config } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(config);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const posts = await db.post.findMany({
      where: {
        OR: [
          {
            privacy: "ANYONE",
          },
          {
            AND: [
              { privacy: "FOLLOWED" },
              {
                author: {
                  followers: {
                    some: {
                      id: session.user.id,
                    },
                  },
                },
              },
            ],
          },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        author: {
          include: {
            college: true,
          },
        },
        likes: true,
        dislikes: true,
        reposts: true,
        replies: {
          include: {
            author: true,
          },
        },
        _count: {
          select: {
            replies: true,
            likes: true,
            reposts: true,
            dislikes: true,
          },
        },
      },
    });
    return NextResponse.json(posts);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
