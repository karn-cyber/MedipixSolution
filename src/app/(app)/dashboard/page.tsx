import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { Invoice, User } from "@/lib/models";
import { visibleUploaderIds } from "@/lib/visibility";
import { isManager, isAdmin, ROLE_LABELS } from "@/lib/roles";
import { PlusCircleIcon, ReceiptIcon, UsersIcon, ShieldIcon, TableIcon } from "@/components/icons";

export default async function Dashboard() {
  const me = await requireUser();
  await dbConnect();

  const ids = await visibleUploaderIds(me);
  const filter = ids ? { uploaderId: { $in: ids } } : {};

  const [invoiceCount, teamCount, recent] = await Promise.all([
    Invoice.countDocuments(filter),
    isManager(me.role) ? User.countDocuments({ managerId: me._id }) : Promise.resolve(0),
    Invoice.find(filter).sort({ createdAt: -1 }).limit(4).lean(),
  ]);

  const stats = [
    { label: "Total invoices", value: invoiceCount },
    ...(isManager(me.role) ? [{ label: "Team members", value: teamCount }] : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hi, {me.name?.split(" ")[0] ?? "there"}</h1>
        <p className="text-sm text-slate-500">{me.role ? ROLE_LABELS[me.role] : ""}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs font-medium text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/invoices/new" className="flex items-center gap-2 rounded-2xl bg-brand-700 p-4 font-semibold text-white shadow-lg shadow-brand-700/20">
          <PlusCircleIcon size={20} /> Upload invoice
        </Link>
        <Link href="/invoices" className="flex items-center gap-2 rounded-2xl bg-white p-4 font-semibold text-slate-800 ring-1 ring-slate-200">
          <ReceiptIcon size={20} className="text-brand-700" /> View invoices
        </Link>
        {isManager(me.role) && (
          <Link href="/team" className="flex items-center gap-2 rounded-2xl bg-white p-4 font-semibold text-slate-800 ring-1 ring-slate-200">
            <UsersIcon size={20} className="text-brand-700" /> Manage team
          </Link>
        )}
        {(isManager(me.role) || isAdmin(me.role)) && (
          <Link href="/data" className="flex items-center gap-2 rounded-2xl bg-white p-4 font-semibold text-slate-800 ring-1 ring-slate-200">
            <TableIcon size={20} className="text-brand-700" /> Data
          </Link>
        )}
        {isAdmin(me.role) && (
          <Link href="/admin" className="flex items-center gap-2 rounded-2xl bg-white p-4 font-semibold text-slate-800 ring-1 ring-slate-200">
            <ShieldIcon size={20} className="text-brand-700" /> Admin view
          </Link>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Recent</h2>
          <Link href="/invoices" className="text-sm font-medium text-brand-700">See all</Link>
        </div>
        {recent.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-400 ring-1 ring-slate-100">
            No invoices yet. Tap <span className="font-semibold text-brand-700">Upload</span> to add one.
          </p>
        ) : (
          <ul className="space-y-2">
            {recent.map((inv) => (
              <li key={String(inv._id)}>
                <Link
                  href={`/invoices/${inv._id}`}
                  className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100"
                >
                  <img
                    src={`/api/invoices/${inv._id}/image`}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-12 w-12 rounded-lg bg-slate-100 object-cover ring-1 ring-slate-200"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-800">{inv.title || "Invoice"}</p>
                    <p className="text-xs text-slate-500">
                      by {inv.uploaderName}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
