import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateUserHash } from "@/lib/utils";
import { faker } from "@faker-js/faker";

export async function POST() {
  try {
    const colleges = await db.college.findMany({
      select: { id: true, domain: true },
    });

    if (colleges.length === 0) {
      return NextResponse.json(
        { error: "No colleges found. Please seed colleges first." },
        { status: 400 }
      );
    }

    const users = Array.from({ length: 10 }, () => {
      const college = colleges[Math.floor(Math.random() * colleges.length)];
      const email = faker.internet.email().split("@")[0] + "@" + college.domain;
      const password = "Test@123";
      const username = faker.internet.userName();
      const userHash = generateUserHash(email, password);
      const collegeId = college.id;

      return {
        username,
        userHash,
        collegeId,
        bio: faker.lorem.sentence(),
      };
    });

    const createdUsers = await db.user.createMany({
      data: users,
      skipDuplicates: true,
    });

    return NextResponse.json(
      { message: "Users seeded successfully", count: createdUsers.count },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error seeding users:", error);
    return NextResponse.json(
      { error: "Failed to seed users" },
      { status: 500 }
    );
  }
}
