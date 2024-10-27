import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const sampleColleges = [
  {
    name: "University of Petroleum and Energy Studies",
    domain: "stu.upes.ac.in",
  },
  {
    name: "Delhi University",
    domain: "du.ac.in",
  },
  {
    name: "Indian Institute of Technology Delhi",
    domain: "iitd.ac.in",
  },
];

export async function POST() {
  try {
    const colleges = await db.college.createMany({
      data: sampleColleges,
      skipDuplicates: true,
    });

    return NextResponse.json(
      { message: "Colleges seeded successfully", count: colleges.count },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error seeding colleges:", error);
    return NextResponse.json(
      { error: "Failed to seed colleges" },
      { status: 500 }
    );
  }
}
