import Sidebar from "@/components/dashboard/sidebar";
import { getAvatarURL } from "@/lib/utils";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { config } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(config);
  const avatarURL = getAvatarURL(session?.user?.username ?? "");

  return (
    <div className="flex h-dvh">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
      {/* prefetch the avatar */}
      <Link href={avatarURL} className="invisible hidden" />
    </div>
  );
}
