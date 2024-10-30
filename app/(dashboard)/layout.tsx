import Sidebar from "@/components/dashboard/sidebar";
import { getAvatarURL } from "@/lib/utils";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { config } from "@/lib/auth";
import PageLayout from "@/components/dashboard/PageLayout";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(config);
  const avatarURL = getAvatarURL(session?.user?.username ?? "");

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar />
      <main className="no-scrollbar mx-auto h-dvh max-w-xl flex-1">
        <PageLayout>{children}</PageLayout>
      </main>
      {/* prefetch the avatar */}
      <Link href={avatarURL} className="invisible hidden" />
    </div>
  );
}
