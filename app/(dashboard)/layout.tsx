import Sidebar from "@/components/dashboard/sidebar";
import PageLayout from "@/components/dashboard/PageLayout";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar />
      <main className="no-scrollbar mx-auto h-dvh max-w-xl flex-1">
        <PageLayout>{children}</PageLayout>
      </main>
    </div>
  );
}
