import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { User, Post, College } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const type = searchParams.get("type") || "all";

    if (!query) {
      return NextResponse.json(
        { error: "Missing search query" },
        { status: 400 }
      );
    }

    let users: Partial<User>[] = [];
    let posts: Partial<Post>[] = [];
    let colleges: Partial<College>[] = [];

    if (type === "all" || type === "users") {
      users = await db.user.findMany({
        where: {
          OR: [
            { username: { contains: query, mode: "insensitive" } },
            { bio: { contains: query, mode: "insensitive" } },
          ],
          privacy: "PUBLIC",
        },
        select: {
          username: true,
          bio: true,
          college: {
            select: {
              name: true,
            },
          },
        },
        take: 10,
      });
    }

    if (type === "all" || type === "posts") {
      posts = await db.post.findMany({
        where: {
          text: { contains: query, mode: "insensitive" },
          privacy: "ANYONE",
        },
        include: {
          author: {
            select: {
              username: true,
              college: {
                select: {
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              likes: true,
              dislikes: true,
              replies: true,
              reposts: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
      });
    }

    if (type === "all" || type === "colleges") {
      colleges = await db.college.findMany({
        where: {
          name: { contains: query, mode: "insensitive" },
        },
        select: {
          name: true,
          id: true,
          _count: {
            select: {
              User: true,
            },
          },
        },
        take: 10,
      });
    }

    return NextResponse.json({ users, posts, colleges });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
}
