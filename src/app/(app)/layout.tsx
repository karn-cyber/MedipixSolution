import { redirect } from "next/navigation";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { getCurrentUser } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { Notification } from "@/lib/models";
import { isManager, isAdmin, ROLE_LABELS } from "@/lib/roles";
import BottomNav from "@/components/BottomNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await getCurrentUser();
  if (!me) redirect("/sign-in");
  if (!me.onboarded) redirect("/onboarding");

  await dbConnect();
  const unread = await Notification.countDocuments({ userId: me._id, read: false });

  const items = [
    { href: "/dashboard", label: "Home", icon: "🏠" },
    { href: "/invoices", label: "Invoices", icon: "🧾" },
    { href: "/invoices/new", label: "Upload", icon: "➕" },
    ...(isManager(me.role) ? [{ href: "/team", label: "Team", icon: "👥" }] : []),
    ...(isAdmin(me.role) ? [{ href: "/admin", label: "Admin", icon: "🛡️" }] : []),
    { href: "/notifications", label: "Alerts", icon: "🔔" },
  ];

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <Link href="/dashboard" className="flex items-center gap-2">
          <img src="/icons/icon-192.png" alt="" className="h-8 w-8 rounded-lg" />
          <div className="leading-tight">
            <p className="text-sm font-bold text-slate-900">Medipix</p>
            <p className="text-[11px] text-brand-700">{me.role ? ROLE_LABELS[me.role] : ""}</p>
          </div>
        </Link>
        <UserButton />
      </header>

      <main className="flex-1 px-4 py-4">{children}</main>

      <BottomNav items={items} unread={unread} />
    </div>
  );
}
