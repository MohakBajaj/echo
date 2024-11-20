import { getServerSession } from "next-auth";
import { config } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

type NotificationWithRelations = {
  id: string;
  createdAt: Date;
  read: boolean;
  type: "ADMIN" | "LIKE" | "REPLY" | "FOLLOW" | "REPOST" | "QUOTE";
  message: string;
  isPublic: boolean;
  senderUser: {
    username: string;
  };
  post?: {
    id: string;
    text: string;
    author: {
      username: string;
    };
  } | null;
};

export default async function NotificationsPage() {
  const session = await getServerSession(config);

  if (!session?.user) {
    redirect("/login");
  }

  const notifications = (await db.notification.findMany({
    where: {
      OR: [{ receiverUserId: session.user.id }, { isPublic: true }],
    },
    include: {
      senderUser: true,
      post: {
        include: {
          author: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })) as NotificationWithRelations[];

  db.notification
    .updateMany({
      where: {
        receiverUserId: session.user.id,
      },
      data: { read: true },
    })
    .then(() => {
      console.log("Notifications marked as read");
    });

  return (
    <div className="mx-auto max-w-3xl p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          {notifications.length}{" "}
          {notifications.length === 1 ? "notification" : "notifications"}
        </span>
      </div>

      <div className="space-y-4">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`group relative rounded-xl border border-border p-6 shadow-sm transition-all duration-200 hover:border-primary/20 hover:shadow-md ${
              notification.read ? "bg-muted/30" : "bg-background"
            }`}
          >
            <div className="flex items-start gap-5">
              <div className="flex-1">
                {notification.type === "ADMIN" && (
                  <div className="mb-2 flex items-center gap-2">
                    <p className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      ADMIN
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(notification.createdAt, {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                )}
                <p className="text-base text-foreground">
                  {notification.type !== "ADMIN" && (
                    <>
                      <Link
                        href={`/profile/@${notification.senderUser.username}`}
                        className="font-semibold text-primary hover:underline"
                      >
                        @{notification.senderUser.username}
                      </Link>{" "}
                    </>
                  )}
                  {notification.message}
                </p>
                {notification.post && (
                  <div className="mt-3 rounded-lg bg-muted/50 p-3 transition-colors group-hover:bg-muted">
                    <Link
                      href={`/post/${notification.post.id}`}
                      className="block text-sm text-muted-foreground hover:text-foreground"
                    >
                      {notification.post.text.length > 100
                        ? notification.post.text.slice(0, 100) + "..."
                        : notification.post.text}
                    </Link>
                  </div>
                )}
                {!notification.type.includes("ADMIN") && (
                  <span className="mt-2 block text-xs text-muted-foreground">
                    {formatDistanceToNow(notification.createdAt, {
                      addSuffix: true,
                    })}
                  </span>
                )}
              </div>
              {!notification.read && (
                <div className="h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-primary/10" />
              )}
            </div>
          </div>
        ))}

        {notifications.length === 0 && (
          <div className="rounded-xl border border-border/50 bg-muted/20 p-12 text-center">
            <p className="text-lg font-medium text-muted-foreground">
              No notifications yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground/80">
              When you get notifications, they&apos;ll show up here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
