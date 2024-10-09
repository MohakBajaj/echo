import AuthLeftHalf from "@/components/auth/left-half";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh w-full flex-col md:grid md:grid-cols-7">
      <AuthLeftHalf className="hidden md:col-span-4 md:block" />
      <div className="w-full md:col-span-3">{children}</div>
    </div>
  );
}
