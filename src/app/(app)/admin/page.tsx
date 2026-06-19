import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { Invoice, User } from "@/lib/models";
import { isAdmin, ROLE_LABELS, type Role } from "@/lib/roles";
import { ShieldIcon } from "@/components/icons";

export default async function AdminPage() {
  const me = await requireUser();
  if (!isAdmin(me.role)) redirect("/dashboard");

  await dbConnect();
  const [invoiceCount, userCount, agg, byRole, recent, users] = await Promise.all([
    Invoice.countDocuments(),
    User.countDocuments(),
    Invoice.aggregate([
      { $group: { _id: null, individual: { $sum: "$individualCount" }, total: { $sum: "$totalCount" } } },
    ]),
    User.aggregate([{ $group: { _id: "$role", n: { $sum: 1 } } }]),
    Invoice.find().sort({ createdAt: -1 }).limit(8).lean(),
    User.find().sort({ createdAt: -1 }).limit(50).lean(),
  ]);

  const sums = agg[0] ?? { individual: 0, total: 0 };
  const roleCounts: Record<string, number> = {};
  byRole.forEach((r) => (roleCounts[r._id ?? "—"] = r.n));

  const stats = [
    { label: "Invoices", value: invoiceCount },
    { label: "Users", value: userCount },
    { label: "Individual count", value: sums.individual },
    { label: "Total count", value: sums.total },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <ShieldIcon size={22} className="text-brand-700" /> Admin
        </h1>
        <p className="text-sm text-slate-500">Full visibility across Medipix.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs font-medium text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {(["TM", "ABM", "ZBM", "ADMIN"] as Role[]).map((r) => (
          <span key={r} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {ROLE_LABELS[r]}: {roleCounts[r] ?? 0}
          </span>
        ))}
      </div>

      <div>
        <h2 className="mb-2 font-semibold text-slate-800">Latest invoices</h2>
        <ul className="space-y-2">
          {recent.map((inv) => (
            <li key={String(inv._id)}>
              <Link href={`/invoices/${inv._id}`} className="flex gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-100">
                <img src={`/api/invoices/${inv._id}/image`} alt="" className="h-12 w-12 rounded-lg object-cover ring-1 ring-slate-200" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-800">{inv.title || "Invoice"}</p>
                  <p className="text-xs text-slate-500">
                    {inv.uploaderName} · ind {inv.individualCount} · total {inv.totalCount}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="mb-2 font-semibold text-slate-800">Users</h2>
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100">
          {users.map((u) => (
            <li key={String(u._id)} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">{u.name ?? "Unnamed"}</p>
                <p className="truncate text-xs text-slate-500">{u.email}</p>
              </div>
              <span className="ml-2 shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-800">
                {u.role ?? "—"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
