import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { Notification } from "@/lib/models";
import { markAllNotificationsRead } from "@/app/actions";

export default async function NotificationsPage() {
  const me = await requireUser();
  await dbConnect();
  const notifs = await Notification.find({ userId: me._id }).sort({ createdAt: -1 }).limit(50).lean();
  const hasUnread = notifs.some((n) => !n.read);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
        {hasUnread && (
          <form action={markAllNotificationsRead}>
            <button className="text-sm font-medium text-brand-700">Mark all read</button>
          </form>
        )}
      </div>

      {notifs.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-slate-400 ring-1 ring-slate-100">
          You&apos;re all caught up 🎉
        </p>
      ) : (
        <ul className="space-y-2">
          {notifs.map((n) => {
            const inner = (
              <div
                className={`rounded-2xl p-3 ring-1 ${
                  n.read ? "bg-white ring-slate-100" : "bg-brand-50 ring-brand-100"
                }`}
              >
                <p className="text-sm text-slate-800">{n.message}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {new Date(n.createdAt).toLocaleString(undefined, {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            );
            return (
              <li key={String(n._id)}>{n.link ? <Link href={n.link}>{inner}</Link> : inner}</li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
