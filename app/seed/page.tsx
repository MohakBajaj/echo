"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { fetcher } from "@/lib/utils";
import { redirect } from "next/navigation";

export default function SeedPage() {
  if (process.env.NODE_ENV === "production") {
    redirect("/");
  }

  const [isLoadingColleges, setIsLoadingColleges] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const seedColleges = async () => {
    setIsLoadingColleges(true);
    try {
      const [response, status] = await fetcher("/api/seed/colleges", {
        method: "POST",
      });

      if (status === 201) {
        toast.success("Successfully seeded colleges!");
      } else {
        toast.error(
          (response as { error?: string }).error || "Failed to seed colleges"
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while seeding colleges");
    } finally {
      setIsLoadingColleges(false);
    }
  };

  const seedUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const [response, status] = await fetcher("/api/seed/users", {
        method: "POST",
      });

      if (status === 201) {
        toast.success("Successfully seeded users!");
      } else {
        toast.error(
          (response as { error?: string }).error || "Failed to seed users"
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while seeding users");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-10">
      <h1 className="mb-8 text-3xl font-bold">Database Seeding</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Seed Colleges</CardTitle>
            <CardDescription>
              Add sample colleges to the database for testing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={seedColleges}
              disabled={isLoadingColleges}
              className="w-full"
            >
              {isLoadingColleges ? "Seeding..." : "Seed Colleges"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seed Users</CardTitle>
            <CardDescription>
              Add sample users to the database for testing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={seedUsers}
              disabled={isLoadingUsers}
              className="w-full"
            >
              {isLoadingUsers ? "Seeding..." : "Seed Users"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
